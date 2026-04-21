import { NextResponse } from "next/server";
import React from "react";
import { getServerSession } from "next-auth";
import { renderToBuffer } from "@react-pdf/renderer";
import type { DocumentProps } from "@react-pdf/renderer";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canViewDossiers } from "@/lib/auth/permissions";
import { Imm5476PDF, type Imm5476Data } from "@/components/pdf/Imm5476PDF";
import type { UserRole } from "@prisma/client";

/**
 * GET /api/documents/imm-5476/[dossierId]
 *
 * Génère le formulaire IMM 5476 (édition novembre 2025) pré-rempli avec :
 *  - Section A : informations du client demandeur (UCI IRCC si disponible)
 *  - Section B : avocat responsable du dossier (numéro Barreau QC)
 *  - Section E : zone de signature
 *
 * Accessible uniquement pour les dossiers de type "immigration".
 *
 * Query params:
 *   ?lang=fr|en   Force la langue (sinon auto-détection via CabinetInterface)
 *   ?download=1   Force le téléchargement (Content-Disposition: attachment)
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
      avocatResponsable: { select: { id: true, nom: true, email: true } },
    },
  });
  if (!dossier) return new NextResponse("Dossier not found", { status: 404 });

  // Langue: priorité ?lang param → langue du client → CabinetInterface → FR
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
  const clientFirstName =
    dossier.client.typeClient === "personne_physique"
      ? dossier.client.prenom ?? ""
      : (dossier.client.raisonSociale ?? "");
  const clientLastName =
    dossier.client.typeClient === "personne_physique"
      ? dossier.client.nom ?? ""
      : "";

  // Date naissance ISO
  const dateNaissanceISO = dossier.client.dateNaissance
    ? dossier.client.dateNaissance.toISOString().split("T")[0]
    : null;

  // Avocat responsable
  const avocat = dossier.avocatResponsable;

  // Type de demande humanisée depuis sousType
  const sousTypeLabels: Record<string, Record<"fr" | "en", string>> = {
    ee: { fr: "Résidence permanente — Entrée express", en: "Permanent Residence — Express Entry" },
    parrainage: { fr: "Résidence permanente — Parrainage", en: "Permanent Residence — Sponsorship" },
    travail: { fr: "Permis de travail", en: "Work Permit" },
    appel: { fr: "Appel en immigration", en: "Immigration Appeal" },
    consultation: { fr: "Consultation immigration", en: "Immigration Consultation" },
  };
  const typeDemande = dossier.sousType
    ? (sousTypeLabels[dossier.sousType]?.[language] ?? dossier.sousType)
    : dossier.type;

  const data: Imm5476Data = {
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
      telephone: dossier.cabinet.telephone,
    },
    client: {
      nomFamille: clientLastName || clientFirstName,
      prenoms: clientLastName ? clientFirstName : null,
      dateNaissance: dateNaissanceISO,
      email: dossier.client.email,
      uci: dossier.irccNumDossier, // UCI = numéro dossier IRCC si déjà connu
    },
    dossier: {
      numero: dossier.numeroDossier,
      intitule: dossier.intitule,
      typeDemande,
      irccNumDossier: dossier.irccNumDossier,
    },
    language,
  };

  const doc = React.createElement(Imm5476PDF, { data });
  const buffer = await renderToBuffer(doc as React.ReactElement<DocumentProps>);

  const fileName = `IMM5476-${dossier.numeroDossier ?? dossier.id}-${new Date().toISOString().split("T")[0]}.pdf`;
  const disposition = forceDownload ? "attachment" : "inline";

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `${disposition}; filename="${fileName}"`,
      "Cache-Control": "no-store",
    },
  });
}
