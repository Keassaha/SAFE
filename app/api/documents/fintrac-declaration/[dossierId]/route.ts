import { NextResponse } from "next/server";
import React from "react";
import { getServerSession } from "next-auth";
import { renderToBuffer } from "@react-pdf/renderer";
import type { DocumentProps } from "@react-pdf/renderer";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canViewDossiers } from "@/lib/auth/permissions";
import { FintracDeclarationPDF, type FintracData } from "@/components/pdf/FintracDeclarationPDF";
import type { UserRole } from "@prisma/client";

/**
 * GET /api/documents/fintrac-declaration/[dossierId]
 *
 * Generates a FINTRAC client identification declaration PDF for a real estate dossier.
 * Pulls client identity verifications from ClientIdentityVerification model.
 *
 * Query params: ?lang=fr|en, ?download=1
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
    },
  });
  if (!dossier) return new NextResponse("Dossier not found", { status: 404 });

  // Pull up to 2 most recent identity verifications for this client
  const identifications = await prisma.clientIdentityVerification.findMany({
    where: { clientId: dossier.clientId },
    orderBy: { date: "desc" },
    take: 2,
    select: { methode: true, notes: true, date: true },
  });

  // Detect language
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
        if (mods?.fideicommis?.regle === "bylaw9-lso") language = "en";
      } catch { /* keep default */ }
    }
  }

  // Detect currency
  let currency = "CAD";
  if (dossier.cabinet.config) {
    try {
      const cfg = JSON.parse(dossier.cabinet.config);
      currency = cfg?.devise ?? currency;
    } catch { /* keep default */ }
  }

  const clientName =
    dossier.client.typeClient === "personne_physique"
      ? [dossier.client.prenom, dossier.client.nom].filter(Boolean).join(" ")
      : (dossier.client.raisonSociale ?? "Client");

  const clientAddress =
    [dossier.client.adresse, dossier.client.city, dossier.client.province, dossier.client.postalCode]
      .filter(Boolean)
      .join(", ") || null;

  // Use the Client.idType / idNumber / idExpiration as primary identification, fallback to verifications
  const primaryId = dossier.client.idType
    ? {
        pieceType: String(dossier.client.idType),
        pieceNumero: dossier.client.idNumber,
        pieceExpiry: dossier.client.idExpiration?.toISOString().split("T")[0] ?? null,
      }
    : identifications[0]
      ? {
          pieceType: identifications[0].methode,
          pieceNumero: null,
          pieceExpiry: null,
        }
      : { pieceType: null, pieceNumero: null, pieceExpiry: null };

  const secondaryId = identifications[0] && dossier.client.idType
    ? {
        pieceType: identifications[0].methode,
        pieceNumero: null,
        pieceExpiry: null,
      }
    : { pieceType: null, pieceNumero: null, pieceExpiry: null };

  const data: FintracData = {
    cabinet: {
      nom: dossier.cabinet.nom,
      adresse: dossier.cabinet.adresse,
      telephone: dossier.cabinet.telephone,
      email: dossier.cabinet.email,
      barreauNumero: dossier.cabinet.barreauNumero,
    },
    client: {
      nomComplet: clientName,
      dateNaissance: null, // TODO: add dateNaissance to Client model if needed
      occupation: null,
      adresse: clientAddress,
      citizenship: null,
    },
    identifications: [primaryId, secondaryId],
    dossier: {
      numero: dossier.numeroDossier,
      intitule: dossier.intitule,
      type: dossier.type,
    },
    property: {
      adresse: dossier.propertyAddress,
      pin: null,
      purchasePrice: null,
      currency,
    },
    sourceOfFunds: null,
    language,
  };

  const doc = React.createElement(FintracDeclarationPDF, { data });
  const buffer = await renderToBuffer(doc as React.ReactElement<DocumentProps>);
  const fileName = `FINTRAC-${dossier.numeroDossier ?? dossier.id}-${new Date().toISOString().split("T")[0]}.pdf`;
  const disposition = forceDownload ? "attachment" : "inline";

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `${disposition}; filename="${fileName}"`,
      "Cache-Control": "no-store",
    },
  });
}
