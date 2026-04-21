import { NextResponse } from "next/server";
import React from "react";
import { getServerSession } from "next-auth";
import { renderToBuffer } from "@react-pdf/renderer";
import type { DocumentProps } from "@react-pdf/renderer";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canViewDossiers } from "@/lib/auth/permissions";
import { EngagementLetterPDF, type EngagementLetterData } from "@/components/pdf/EngagementLetterPDF";
import type { UserRole } from "@prisma/client";

/**
 * GET /api/documents/engagement-letter/[dossierId]
 *
 * Generates an engagement letter PDF for the given dossier.
 * Pulls cabinet, lawyer, client and matter details, and produces a PDF
 * using the EngagementLetterPDF component.
 *
 * Query params:
 *   ?lang=fr|en  (default: en for ON cabinets, fr for QC cabinets)
 *   ?download=1  (forces Content-Disposition: attachment, default is inline)
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ dossierId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }
  const cabinetId = (session.user as { cabinetId?: string }).cabinetId;
  const role = (session.user as { role?: string }).role as UserRole;
  if (!cabinetId) {
    return new NextResponse("Cabinet not found", { status: 403 });
  }
  if (!canViewDossiers(role)) {
    return new NextResponse("Insufficient permissions", { status: 403 });
  }

  const { dossierId } = await params;
  const url = new URL(request.url);
  const requestedLang = url.searchParams.get("lang");
  const forceDownload = url.searchParams.get("download") === "1";

  // Fetch dossier with all relations needed
  const dossier = await prisma.dossier.findFirst({
    where: { id: dossierId, cabinetId },
    include: {
      client: true,
      avocatResponsable: true,
      cabinet: true,
    },
  });

  if (!dossier) {
    return new NextResponse("Dossier not found", { status: 404 });
  }

  // Detect language from CabinetInterface or fallback
  let language: "en" | "fr" = "fr";
  if (requestedLang === "en" || requestedLang === "fr") {
    language = requestedLang;
  } else {
    const intf = await prisma.cabinetInterface.findUnique({
      where: { cabinetId },
      select: { modules: true },
    });
    if (intf?.modules) {
      try {
        const mods = JSON.parse(intf.modules);
        if (mods?.email?.fromAddress?.includes(".com") || mods?.fideicommis?.regle === "bylaw9-lso") {
          language = "en";
        }
      } catch { /* keep default */ }
    }
  }

  // Detect cabinet config (taxes, currency)
  let taxMode = "tps_tvq";
  let taxRate = 14.975; // QC default (TPS 5 + TVQ 9.975)
  let currency = "CAD";
  if (dossier.cabinet.config) {
    try {
      const cfg = JSON.parse(dossier.cabinet.config);
      taxMode = cfg?.taxes?.mode ?? taxMode;
      taxRate = cfg?.taxes?.taux ?? taxRate;
      currency = cfg?.devise ?? currency;
    } catch { /* keep defaults */ }
  }
  // Override taxes from CabinetInterface if present
  const intf = await prisma.cabinetInterface.findUnique({
    where: { cabinetId },
    select: { modules: true },
  });
  if (intf?.modules) {
    try {
      const mods = JSON.parse(intf.modules);
      if (mods?.facturation?.taxes) {
        taxMode = mods.facturation.taxes.mode ?? taxMode;
        taxRate = mods.facturation.taxes.taux ?? taxRate;
      }
    } catch { /* ignore */ }
  }

  // Build data payload
  const clientName =
    dossier.client.typeClient === "personne_physique"
      ? [dossier.client.prenom, dossier.client.nom].filter(Boolean).join(" ")
      : (dossier.client.raisonSociale ?? "Client");

  const clientAddress =
    [dossier.client.adresse, dossier.client.city, dossier.client.province, dossier.client.postalCode]
      .filter(Boolean)
      .join(", ") || null;

  const data: EngagementLetterData = {
    cabinet: {
      nom: dossier.cabinet.nom,
      adresse: dossier.cabinet.adresse,
      telephone: dossier.cabinet.telephone,
      email: dossier.cabinet.email,
      barreauNumero: dossier.cabinet.barreauNumero,
    },
    avocat: {
      nom: dossier.avocatResponsable?.nom ?? "—",
      barreauNumero: null,
      email: dossier.avocatResponsable?.email ?? null,
    },
    client: {
      nomComplet: clientName,
      civilite: null,
      adresse: clientAddress,
      email: dossier.client.email,
    },
    dossier: {
      numero: dossier.numeroDossier,
      intitule: dossier.intitule,
      type: dossier.type,
      sousType: dossier.sousType,
      description: dossier.resumeDossier,
    },
    honoraires: {
      mode: dossier.modeFacturation,
      forfait: null, // forfait amount lives elsewhere (ForfaitService) — TODO link
      tauxHoraire: dossier.tauxHoraire,
      devise: currency,
      taxes: { mode: taxMode, taux: taxRate },
    },
    language,
  };

  const doc = React.createElement(EngagementLetterPDF, { data });
  const buffer = await renderToBuffer(doc as React.ReactElement<DocumentProps>);

  const fileName = `ENGAGEMENT-${dossier.numeroDossier ?? dossier.id}-${new Date().toISOString().split("T")[0]}.pdf`;
  const disposition = forceDownload ? "attachment" : "inline";

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `${disposition}; filename="${fileName}"`,
      "Cache-Control": "no-store",
    },
  });
}
