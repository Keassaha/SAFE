import { NextResponse } from "next/server";
import React from "react";
import { getServerSession } from "next-auth";
import { renderToBuffer } from "@react-pdf/renderer";
import type { DocumentProps } from "@react-pdf/renderer";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canViewDossiers } from "@/lib/auth/permissions";
import { ImmigrationMandatePDF, type ImmigrationMandateData } from "@/components/pdf/ImmigrationMandatePDF";
import type { UserRole } from "@prisma/client";

/**
 * GET /api/documents/immigration-mandate/[dossierId]
 *
 * Génère le mandat de représentation spécialisé immigration.
 * Conforme à l'art. 4.1 du Code de déontologie des avocats (Barreau QC, B-1, r.3.1).
 *
 * Inclut :
 *  - Portée du mandat + type de demande IRCC
 *  - Clause de non-garantie de résultat (obligation déontologique)
 *  - Clause refus/appel
 *  - Honoraires + provision fidéicommis + frais IRCC
 *  - Délai ITA Express Entry si itaDate défini (deadline 60 jours)
 *  - Confidentialité renforcée (statut migratoire, biométries)
 *
 * Query params:
 *   ?lang=fr|en
 *   ?download=1
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ dossierId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });

  const cabinetId = (session.user as { cabinetId?: string }).cabinetId;
  const role = (session.user as { role?: string }).role as UserRole;
  if (!cabinetId) return new NextResponse("Cabinet not found", { status: 403 });
  if (!canViewDossiers(role)) return new NextResponse("Insufficient permissions", { status: 403 });

  const { dossierId } = await params;
  const url = new URL(request.url);
  const requestedLang = url.searchParams.get("lang");
  const forceDownload = url.searchParams.get("download") === "1";

  const dossier = await prisma.dossier.findFirst({
    where: { id: dossierId, cabinetId },
    include: {
      client: true,
      cabinet: true,
      avocatResponsable: { select: { nom: true, email: true } },
    },
  });
  if (!dossier) return new NextResponse("Dossier not found", { status: 404 });

  // Langue
  let language: "en" | "fr" = "fr";
  if (requestedLang === "en" || requestedLang === "fr") {
    language = requestedLang;
  } else if (dossier.client.langue?.toLowerCase() === "en") {
    language = "en";
  } else {
    try {
      const intf = await prisma.cabinetInterface.findUnique({
        where: { cabinetId },
        select: { modules: true },
      });
      if (intf?.modules) {
        const mods = JSON.parse(intf.modules);
        if (mods?.fideicommis?.regle === "bylaw9-lso") language = "en";
      }
    } catch { /* keep default */ }
  }

  // Nom complet + civilité
  const clientName =
    dossier.client.typeClient === "personne_physique"
      ? [dossier.client.prenom, dossier.client.nom].filter(Boolean).join(" ")
      : (dossier.client.raisonSociale ?? "Client");

  const clientAddress =
    [dossier.client.adresse, dossier.client.city, dossier.client.province, dossier.client.postalCode]
      .filter(Boolean)
      .join(", ") || null;

  // Dates ITA
  const itaDateISO = dossier.itaDate
    ? dossier.itaDate.toISOString().split("T")[0]
    : null;
  const submissionDeadlineISO = dossier.submissionDeadline
    ? dossier.submissionDeadline.toISOString().split("T")[0]
    : null;

  // Type de demande humanisé
  const sousTypeLabels: Record<string, Record<"fr" | "en", string>> = {
    ee: { fr: "résidence permanente via Entrée express", en: "Permanent Residence via Express Entry" },
    parrainage: { fr: "résidence permanente par parrainage", en: "Permanent Residence — Sponsorship" },
    travail: { fr: "permis de travail", en: "Work Permit" },
    appel: { fr: "appel en immigration", en: "Immigration Appeal" },
    consultation: { fr: "consultation en immigration", en: "Immigration Consultation" },
  };
  const typeDemande = dossier.sousType
    ? (sousTypeLabels[dossier.sousType]?.[language] ?? dossier.sousType)
    : (dossier.type ?? null);

  // Avocat responsable
  const avocat = dossier.avocatResponsable;

  // Devise
  let currency = "CAD";
  if (dossier.cabinet.config) {
    try {
      const cfg = JSON.parse(dossier.cabinet.config);
      currency = cfg?.devise ?? currency;
    } catch { /* keep default */ }
  }

  // Frais IRCC estimés selon type de demande
  const irccFeesEstimated: Record<string, number> = {
    ee: 1525,       // RP frais traitement + biométrie
    parrainage: 1075,
    travail: 255,
    appel: 1100,
  };
  const fraisIRCC = dossier.sousType ? (irccFeesEstimated[dossier.sousType] ?? null) : null;

  const data: ImmigrationMandateData = {
    cabinet: {
      nom: dossier.cabinet.nom,
      adresse: dossier.cabinet.adresse,
      telephone: dossier.cabinet.telephone,
      email: dossier.cabinet.email,
      barreauNumero: dossier.cabinet.barreauNumero,
    },
    avocat: {
      nom: avocat?.nom ?? dossier.cabinet.nom,
      barreauNumero: dossier.cabinet.barreauNumero,
      email: avocat?.email ?? dossier.cabinet.email,
    },
    client: {
      nomComplet: clientName,
      civilite: null, // Non stocké dans le modèle actuel
      adresse: clientAddress,
      email: dossier.client.email,
    },
    dossier: {
      numero: dossier.numeroDossier,
      intitule: dossier.intitule,
      typeDemande,
      irccNumDossier: dossier.irccNumDossier,
      itaDate: itaDateISO,
      submissionDeadline: submissionDeadlineISO,
      irccStatut: dossier.irccStatut,
    },
    honoraires: {
      tauxHoraire: dossier.tauxHoraire,
      provisionFideicommis: dossier.soldeFiducieDossier,
      fraisIRCC,
      currency,
    },
    dateMandat: new Date().toLocaleDateString(language === "fr" ? "fr-CA" : "en-CA", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }),
    language,
  };

  const doc = React.createElement(ImmigrationMandatePDF, { data });
  const buffer = await renderToBuffer(doc as React.ReactElement<DocumentProps>);

  const fileName = `MandatImmigration-${dossier.numeroDossier ?? dossier.id}-${new Date().toISOString().split("T")[0]}.pdf`;
  const disposition = forceDownload ? "attachment" : "inline";

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `${disposition}; filename="${fileName}"`,
      "Cache-Control": "no-store",
    },
  });
}
