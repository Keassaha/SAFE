import { NextResponse } from "next/server";
import React from "react";
import { getServerSession } from "next-auth";
import { renderToBuffer } from "@react-pdf/renderer";
import type { DocumentProps } from "@react-pdf/renderer";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canManageInvoices } from "@/lib/auth/permissions";
import { PaymentReceiptPDF, type PaymentReceiptData } from "@/components/pdf/PaymentReceiptPDF";
import type { UserRole } from "@prisma/client";

/**
 * GET /api/documents/payment-receipt/[paymentId]
 *
 * Generates a payment receipt PDF for a given payment.
 *
 * Query params: ?lang=fr|en, ?download=1
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ paymentId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });
  const cabinetId = (session.user as { cabinetId?: string }).cabinetId;
  const role = (session.user as { role?: string }).role as UserRole;
  if (!cabinetId) return new NextResponse("Cabinet not found", { status: 403 });
  if (!canManageInvoices(role)) return new NextResponse("Insufficient permissions", { status: 403 });

  const { paymentId } = await params;
  const url = new URL(request.url);
  const requestedLang = url.searchParams.get("lang");
  const forceDownload = url.searchParams.get("download") === "1";

  const payment = await prisma.payment.findFirst({
    where: { id: paymentId, cabinetId },
    include: {
      cabinet: true,
      invoice: { include: { client: true, dossier: true } },
    },
  });

  if (!payment) return new NextResponse("Payment not found", { status: 404 });

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

  const client = payment.invoice?.client;
  const clientName = client
    ? client.typeClient === "personne_physique"
      ? [client.prenom, client.nom].filter(Boolean).join(" ")
      : (client.raisonSociale ?? "Client")
    : "Client";

  const data: PaymentReceiptData = {
    cabinet: {
      nom: payment.cabinet.nom,
      adresse: payment.cabinet.adresse,
      telephone: payment.cabinet.telephone,
      email: payment.cabinet.email,
      barreauNumero: payment.cabinet.barreauNumero,
    },
    client: {
      nomComplet: clientName,
      adresse: client
        ? [client.adresse, client.city, client.province, client.postalCode].filter(Boolean).join(", ") || null
        : null,
    },
    payment: {
      numero: payment.id.slice(-8).toUpperCase(),
      date: payment.datePaiement.toLocaleDateString(language === "fr" ? "fr-CA" : "en-CA", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
      amount: payment.montant,
      currency: "CAD",
      method: payment.paymentMethod ?? payment.method ?? "transfer",
      reference: payment.reference,
    },
    invoice: payment.invoice
      ? {
          numero: payment.invoice.numero,
          dossierIntitule: payment.invoice.dossier?.intitule ?? null,
        }
      : null,
    language,
  };

  const doc = React.createElement(PaymentReceiptPDF, { data });
  const buffer = await renderToBuffer(doc as React.ReactElement<DocumentProps>);
  const fileName = `RECEIPT-${data.payment.numero}-${new Date().toISOString().split("T")[0]}.pdf`;
  const disposition = forceDownload ? "attachment" : "inline";

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `${disposition}; filename="${fileName}"`,
      "Cache-Control": "no-store",
    },
  });
}
