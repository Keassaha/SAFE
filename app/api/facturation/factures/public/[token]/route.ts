import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/**
 * GET: retourne la facture pour un token de partage (lien client).
 * Pas d'authentification. 404 si token invalide ou expiré.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  if (!token?.trim()) {
    return NextResponse.json({ error: "Lien invalide" }, { status: 404 });
  }

  const invoice = await prisma.invoice.findFirst({
    where: {
      shareToken: token,
      cancelledAt: null,
    },
    include: {
      cabinet: { select: { id: true, nom: true, adresse: true } },
      client: {
        select: {
          id: true,
          raisonSociale: true,
          billingAddress: true,
          billingCity: true,
          billingProvince: true,
          billingPostalCode: true,
          billingCountry: true,
        },
      },
      dossier: { select: { id: true, intitule: true, numeroDossier: true } },
      invoiceItems: {
        orderBy: { createdAt: "asc" },
        include: { user: { select: { id: true, nom: true } } },
      },
      invoiceLines: {
        orderBy: { sortOrder: "asc" },
        include: {
          timeEntry: { include: { user: { select: { nom: true } } } },
        },
      },
    },
  });

  if (!invoice) {
    return NextResponse.json({ error: "Facture introuvable" }, { status: 404 });
  }
  const now = new Date();
  if (invoice.shareTokenExpiresAt && invoice.shareTokenExpiresAt < now) {
    return NextResponse.json(
      { error: "Ce lien a expiré" },
      { status: 410 }
    );
  }

  const lineItems = invoice.invoiceLines.map((line) => ({
    id: line.id,
    type:
      line.lineType === "fee"
        ? "honoraires"
        : line.lineType === "expense"
          ? "debours_taxable"
          : "honoraires",
    description: line.description,
    date: line.serviceDate ?? line.createdAt,
    hours: line.quantite ?? null,
    rate: line.tauxUnitaire ?? null,
    amount: line.lineSubtotal ?? line.montant,
    userId: line.timeEntry?.userId ?? null,
    userNom: line.timeEntry?.user?.nom ?? null,
    timeEntryId: line.timeEntryId,
    parentItemId: null as string | null,
    parentLineId: null as string | null,
    source: "line" as const,
    validationComment: line.validationComment ?? null,
  }));
  const itemItems = invoice.invoiceItems.map((item) => ({
    id: item.id,
    type: item.type,
    description: item.description,
    date: item.date,
    hours: item.hours,
    rate: item.rate,
    amount: item.amount,
    userId: item.userId,
    userNom: item.professionalDisplayName ?? item.user?.nom ?? null,
    timeEntryId: item.timeEntryId,
    parentItemId: item.parentItemId ?? null,
    parentLineId: item.parentLineId ?? null,
    source: "item" as const,
    validationComment: item.validationComment ?? null,
  }));
  const items = [...lineItems, ...itemItems];

  return NextResponse.json({
    id: invoice.id,
    numero: invoice.numero,
    statut: invoice.statut,
    dateEmission: invoice.dateEmission,
    dateEcheance: invoice.dateEcheance,
    clientId: invoice.clientId,
    cabinet: invoice.cabinet,
    client: invoice.client,
    dossierId: invoice.dossierId,
    dossier: invoice.dossier,
    items,
    subtotalTaxable: invoice.subtotalTaxable,
    tps: invoice.tps,
    tvq: invoice.tvq,
    deboursNonTaxableTotal: invoice.deboursNonTaxableTotal,
    montantTotal: invoice.montantTotal,
    montantPaye: invoice.montantPaye,
    balanceDue: invoice.balanceDue,
    clientNote: invoice.clientNote,
  });
}
