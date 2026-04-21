import { NextResponse } from "next/server";
import React from "react";
import { getServerSession } from "next-auth";
import { renderToBuffer } from "@react-pdf/renderer";
import type { DocumentProps } from "@react-pdf/renderer";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canViewDossiers } from "@/lib/auth/permissions";
import { AntecedentsDeclarationPDF, type AntecedentsDeclarationData } from "@/components/pdf/AntecedentsDeclarationPDF";
import type { UserRole } from "@prisma/client";

/**
 * GET /api/documents/antecedents-declaration/[dossierId]
 *
 * Génère la déclaration d'antécédents criminels et d'immigration.
 * Pré-remplit les réponses depuis le modèle ImmigrationBackground si existant.
 *
 * Obligation déontologique Barreau du Québec (B-1, r.3.1) :
 * l'avocat doit obtenir et conserver cette déclaration avant d'accepter
 * tout mandat en droit de l'immigration.
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
      immigrationBackground: true,
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

  // Nom complet du client
  const clientName =
    dossier.client.typeClient === "personne_physique"
      ? [dossier.client.prenom, dossier.client.nom].filter(Boolean).join(" ")
      : (dossier.client.raisonSociale ?? "Client");

  // Adresse client
  const clientAddress =
    [dossier.client.adresse, dossier.client.city, dossier.client.province, dossier.client.postalCode]
      .filter(Boolean)
      .join(", ") || null;

  // Date naissance ISO
  const dateNaissanceISO = dossier.client.dateNaissance
    ? dossier.client.dateNaissance.toISOString().split("T")[0]
    : null;

  // ID expiration ISO
  const idExpirationISO = dossier.client.idExpiration
    ? dossier.client.idExpiration.toISOString().split("T")[0]
    : null;

  // Antécédents depuis ImmigrationBackground ou valeurs par défaut (formulaire vierge)
  const bg = dossier.immigrationBackground;
  const antecedents = {
    criminalRecord: bg?.criminalRecord ?? false,
    criminalDetails: bg?.criminalDetails ?? null,
    priorRefusal: bg?.priorRefusal ?? false,
    priorRefusalDetails: bg?.priorRefusalDetails ?? null,
    overstay: bg?.overstay ?? false,
    overstayDetails: bg?.overstayDetails ?? null,
    deportation: bg?.deportation ?? false,
    deportationDetails: bg?.deportationDetails ?? null,
    misrepresentation: bg?.misrepresentation ?? false,
    misrepresentationDetails: bg?.misrepresentationDetails ?? null,
  };

  // Type de demande humanisé
  const sousTypeLabels: Record<string, Record<"fr" | "en", string>> = {
    ee: { fr: "Résidence permanente — Entrée express", en: "Permanent Residence — Express Entry" },
    parrainage: { fr: "Résidence permanente — Parrainage", en: "Permanent Residence — Sponsorship" },
    travail: { fr: "Permis de travail", en: "Work Permit" },
    appel: { fr: "Appel en immigration", en: "Immigration Appeal" },
  };
  const typeDemande = dossier.sousType
    ? (sousTypeLabels[dossier.sousType]?.[language] ?? dossier.sousType)
    : dossier.type;

  // Avocat
  const avocat = dossier.avocatResponsable;

  const data: AntecedentsDeclarationData = {
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
    },
    client: {
      nomComplet: clientName,
      dateNaissance: dateNaissanceISO,
      email: dossier.client.email,
      adresse: clientAddress,
      idType: dossier.client.idType ? String(dossier.client.idType) : null,
      idNumber: dossier.client.idNumber,
      idExpiration: idExpirationISO,
    },
    dossier: {
      numero: dossier.numeroDossier,
      intitule: dossier.intitule,
      typeDemande,
    },
    antecedents,
    language,
  };

  const doc = React.createElement(AntecedentsDeclarationPDF, { data });
  const buffer = await renderToBuffer(doc as React.ReactElement<DocumentProps>);

  const fileName = `Antecedents-${dossier.numeroDossier ?? dossier.id}-${new Date().toISOString().split("T")[0]}.pdf`;
  const disposition = forceDownload ? "attachment" : "inline";

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `${disposition}; filename="${fileName}"`,
      "Cache-Control": "no-store",
    },
  });
}
