/**
 * Service notes de crédit : création et application à des factures.
 */

import { prisma } from "@/lib/db";
import { TPS_RATE, TVQ_RATE } from "@/lib/invoice-calculations";
import { createAuditLog } from "@/lib/services/audit";
import { recalculateInvoiceTotals } from "./invoice-service";

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/** Génère le prochain numéro de note de crédit */
async function getNextCreditNoteNumber(cabinetId: string): Promise<string> {
  const year = new Date().getFullYear();
  const count = await prisma.creditNote.count({
    where: {
      cabinetId,
      creditDate: {
        gte: new Date(year, 0, 1),
        lt: new Date(year + 1, 0, 1),
      },
    },
  });
  return `CN-${year}-${String(count + 1).padStart(3, "0")}`;
}

/** Crée une note de crédit à partir d'une facture */
export async function createCreditNote(params: {
  cabinetId: string;
  invoiceId: string;
  reason?: string | null;
  creditAmount?: number;
  creditFull?: boolean;
  createdById?: string | null;
}): Promise<{ creditNoteId: string }> {
  const { cabinetId, invoiceId, reason, creditAmount, creditFull = false, createdById } = params;

  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId, cabinetId },
  });
  if (!invoice) throw new Error("Facture introuvable");
  if (invoice.clientId == null) throw new Error("Facture sans client");

  const balanceOrTotal = invoice.balanceDue ?? invoice.totalInvoiceAmount ?? invoice.montantTotal ?? 0;
  const amount = creditFull ? balanceOrTotal : (creditAmount ?? balanceOrTotal);
  if (amount <= 0) throw new Error("Le montant à créditer doit être positif");

  const subtotalCredit = amount / (1 + TPS_RATE + TVQ_RATE);
  const gstCredit = round2(subtotalCredit * TPS_RATE);
  const qstCredit = round2(subtotalCredit * TVQ_RATE);
  const totalCredit = round2(subtotalCredit + gstCredit + qstCredit);

  const creditNoteNumber = await getNextCreditNoteNumber(cabinetId);
  const now = new Date();

  const creditNote = await prisma.creditNote.create({
    data: {
      cabinetId,
      clientId: invoice.clientId,
      invoiceId,
      creditNoteNumber,
      creditDate: now,
      reason: reason ?? undefined,
      status: "ISSUED",
      subtotalCredit,
      gstCredit,
      qstCredit,
      totalCredit,
      appliedAmount: 0,
      remainingAmount: totalCredit,
      createdById: createdById ?? undefined,
    },
  });

  await createAuditLog({
    cabinetId,
    userId: createdById ?? undefined,
    entityType: "CreditNote",
    entityId: creditNote.id,
    action: "create",
    newValues: { invoiceId, totalCredit },
    performedBy: createdById ?? undefined,
    performedAt: now,
  });

  return { creditNoteId: creditNote.id };
}

/** Applique une note de crédit (ou une partie) à une facture */
export async function applyCreditNote(params: {
  creditNoteId: string;
  invoiceId: string;
  appliedAmount: number;
  performedById?: string | null;
  cabinetId?: string;
}): Promise<void> {
  const { creditNoteId, invoiceId, appliedAmount, performedById, cabinetId: enforcedCabinetId } = params;
  if (appliedAmount <= 0) throw new Error("Le montant appliqué doit être positif");

  const creditNote = await prisma.creditNote.findFirst({
    where: { id: creditNoteId, ...(enforcedCabinetId ? { cabinetId: enforcedCabinetId } : {}) },
  });
  if (!creditNote) throw new Error("Note de crédit introuvable");
  if (creditNote.status === "CANCELLED") {
    throw new Error("Cette note de crédit est annulée");
  }
  if (appliedAmount > creditNote.remainingAmount) {
    throw new Error("Montant supérieur au solde disponible de la note de crédit");
  }

  const invoice = await prisma.invoice.findFirst({
    where: { id: invoiceId, cabinetId: creditNote.cabinetId },
  });
  if (!invoice) throw new Error("Facture introuvable");
  if (invoice.clientId !== creditNote.clientId) {
    throw new Error("La facture doit être du même client que la note de crédit");
  }

  const now = new Date();
  await prisma.$transaction(async (tx) => {
    await tx.creditNoteApplication.create({
      data: {
        creditNoteId,
        invoiceId,
        appliedAmount,
        appliedAt: now,
      },
    });
    const newRemaining = creditNote.remainingAmount - appliedAmount;
    const newApplied = creditNote.appliedAmount + appliedAmount;
    const newStatus =
      newRemaining <= 0 ? "FULLY_APPLIED" : "PARTIALLY_APPLIED";
    await tx.creditNote.update({
      where: { id: creditNoteId },
      data: {
        remainingAmount: newRemaining,
        appliedAmount: newApplied,
        status: newStatus,
        updatedAt: now,
      },
    });
    await tx.invoice.update({
      where: { id: invoiceId },
      data: {
        creditAppliedAmount: (invoice.creditAppliedAmount ?? 0) + appliedAmount,
      },
    });
  });

  await recalculateInvoiceTotals(invoiceId);
  await createAuditLog({
    cabinetId: creditNote.cabinetId,
    userId: performedById ?? undefined,
    entityType: "CreditNote",
    entityId: creditNoteId,
    action: "update",
    newValues: { invoiceId, appliedAmount },
    performedBy: performedById ?? undefined,
    performedAt: now,
  });
}
