/**
 * Service fidéicommis : compte fidéicommis et application au solde facture.
 */

import { prisma } from "@/lib/db";
import { createAuditLog } from "@/lib/services/audit";
import { recalculateInvoiceTotals } from "./invoice-service";

/** Récupère ou crée le compte fidéicommis pour un client (et optionnellement un dossier) */
export async function getOrCreateTrustAccount(params: {
  cabinetId: string;
  clientId: string;
  matterId?: string | null;
}): Promise<{ id: string; currentBalance: number }> {
  const { cabinetId, clientId, matterId } = params;
  let account = await prisma.trustAccount.findFirst({
    where: {
      cabinetId,
      clientId,
      matterId: matterId ?? null,
    },
  });
  if (!account) {
    account = await prisma.trustAccount.create({
      data: {
        cabinetId,
        clientId,
        matterId: matterId ?? null,
        currentBalance: 0,
        currency: "CAD",
      },
    });
  }
  return { id: account.id, currentBalance: account.currentBalance };
}

/** Applique un montant du fidéicommis au solde d'une facture */
export async function applyTrustToInvoice(params: {
  trustAccountId: string;
  invoiceId: string;
  amount: number;
  note?: string | null;
  createdById?: string | null;
  cabinetId?: string;
}): Promise<void> {
  const { trustAccountId, invoiceId, amount, note, createdById, cabinetId: enforcedCabinetId } = params;
  if (amount <= 0) throw new Error("Le montant doit être positif");

  const account = await prisma.trustAccount.findFirst({
    where: { id: trustAccountId, ...(enforcedCabinetId ? { cabinetId: enforcedCabinetId } : {}) },
  });
  if (!account) throw new Error("Compte fidéicommis introuvable");
  if (account.currentBalance < amount) {
    throw new Error("Solde fidéicommis insuffisant");
  }

  const invoice = await prisma.invoice.findFirst({
    where: { id: invoiceId, cabinetId: account.cabinetId },
  });
  if (!invoice) throw new Error("Facture introuvable");
  if (invoice.clientId !== account.clientId) {
    throw new Error("La facture n'est pas au nom du même client");
  }

  const newBalance = account.currentBalance - amount;
  const now = new Date();

  await prisma.$transaction(async (tx) => {
    await tx.trustTransaction.create({
      data: {
        cabinetId: account.cabinetId,
        trustAccountId: account.id,
        clientId: account.clientId,
        dossierId: account.matterId,
        date: now,
        amount: -amount,
        type: "withdrawal",
        transactionType: "transfer_to_invoice",
        balanceAfter: newBalance,
        invoiceId,
        note: note ?? undefined,
        createdById: createdById ?? undefined,
      },
    });
    await tx.trustAccount.update({
      where: { id: trustAccountId },
      data: { currentBalance: newBalance, updatedAt: now },
    });
    await tx.invoice.update({
      where: { id: invoiceId },
      data: {
        trustAppliedAmount: (invoice.trustAppliedAmount ?? 0) + amount,
        trustApplied: (invoice.trustApplied ?? 0) + amount,
      },
    });
  });

  await recalculateInvoiceTotals(invoiceId);
  await createAuditLog({
    cabinetId: account.cabinetId,
    userId: createdById ?? undefined,
    entityType: "TrustTransaction",
    entityId: trustAccountId,
    action: "update",
    newValues: { invoiceId, amount, balanceAfter: newBalance },
    performedBy: createdById ?? undefined,
    performedAt: now,
  });
}
