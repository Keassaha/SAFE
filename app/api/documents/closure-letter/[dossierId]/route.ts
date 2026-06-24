import { NextResponse } from "next/server";
import React from "react";
import { getServerSession } from "next-auth";
import { renderToBuffer } from "@react-pdf/renderer";
import type { DocumentProps } from "@react-pdf/renderer";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canViewDossiers } from "@/lib/auth/permissions";
import { getTrustBalance } from "@/lib/services/fideicommis/trust-balance-service";
import { ClosureLetterPDF, type ClosureLetterData } from "@/components/pdf/ClosureLetterPDF";
import type { UserRole } from "@prisma/client";

/**
 * GET /api/documents/closure-letter/[dossierId]
 *
 * Generates a file closure letter PDF, computing final account balance
 * from invoices/payments and trust balance from TrustAccount.
 *
 * Query params: ?lang=fr|en, ?download=1, ?services=service1|service2|... (pipe-separated)
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
  const servicesParam = url.searchParams.get("services");

  const dossier = await prisma.dossier.findFirst({
    where: { id: dossierId, cabinetId },
    include: {
      client: true,
      avocatResponsable: true,
      cabinet: true,
    },
  });
  if (!dossier) return new NextResponse("Dossier not found", { status: 404 });

  // Compute totals
  const invoices = await prisma.invoice.findMany({
    where: { dossierId, cabinetId },
    select: { montantTotal: true, montantPaye: true, statut: true },
  });
  const totalBilled = invoices.reduce((sum, inv) => sum + (inv.montantTotal ?? 0), 0);
  const totalPaid = invoices.reduce((sum, inv) => sum + (inv.montantPaye ?? 0), 0);
  const balance = Math.max(totalBilled - totalPaid, 0);

  // Solde fidéicommis : MÊME source que l'alerte de fermeture (closure-blockers)
  // pour que la lettre au client corresponde à ce qui est affiché. Source unique
  // et auditable : somme des transactions (append-only), scopée client + dossier.
  const trustBalance = await getTrustBalance({
    cabinetId,
    clientId: dossier.client.id,
    dossierId,
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

  // Detect retention years from CabinetInterface modules
  let retentionYears = 7;
  const intf = await prisma.cabinetInterface.findUnique({
    where: { cabinetId },
    select: { modules: true },
  });
  if (intf?.modules) {
    try {
      const mods = JSON.parse(intf.modules);
      if (mods?.pipeda?.retention) {
        const retentionMap = mods.pipeda.retention as Record<string, number>;
        const dossierType = dossier.type ?? "default";
        retentionYears = retentionMap[dossierType] ?? retentionMap.default ?? 7;
      }
    } catch { /* keep default */ }
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

  const services = servicesParam ? servicesParam.split("|").filter(Boolean) : [];

  const data: ClosureLetterData = {
    cabinet: {
      nom: dossier.cabinet.nom,
      adresse: dossier.cabinet.adresse,
      telephone: dossier.cabinet.telephone,
      email: dossier.cabinet.email,
      // Règle CEO : jamais de numéro de Barreau sur un document destiné au client.
      barreauNumero: null,
    },
    avocat: {
      nom: dossier.avocatResponsable?.nom ?? "",
      barreauNumero: null,
      email: dossier.avocatResponsable?.email ?? null,
    },
    client: {
      nomComplet: clientName,
      adresse: clientAddress,
      email: dossier.client.email,
    },
    dossier: {
      numero: dossier.numeroDossier,
      intitule: dossier.intitule,
      type: dossier.type,
      dateOuverture: dossier.dateOuverture.toISOString().split("T")[0],
      dateFermeture: new Date().toISOString().split("T")[0],
    },
    finances: {
      totalBilled,
      totalPaid,
      balance,
      currency,
      trustBalanceRefund: trustBalance,
    },
    retentionYears,
    servicesRendered: services,
    language,
  };

  const doc = React.createElement(ClosureLetterPDF, { data });
  const buffer = await renderToBuffer(doc as React.ReactElement<DocumentProps>);
  const fileName = `CLOSURE-${dossier.numeroDossier ?? dossier.id}-${new Date().toISOString().split("T")[0]}.pdf`;
  const disposition = forceDownload ? "attachment" : "inline";

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `${disposition}; filename="${fileName}"`,
      "Cache-Control": "no-store",
    },
  });
}
