/**
 * Service des transactions fidéicommis : dépôt, retrait, correction.
 * Règles : append-only (aucun update/delete), solde vérifié avant retrait, audit systématique.
 */

import type { TrustModePaiement } from "@prisma/client";
import { prisma } from "@/lib/db";
import { createAuditLog } from "@/lib/services/audit";
import { getTrustBalance } from "./trust-balance-service";
import { getOrCreateTrustAccount } from "@/lib/services/billing/trust-service";
import { recalculateInvoiceTotals } from "@/lib/services/billing/invoice-service";

export interface CreateTrustDepositParams {
  cabinetId: string;
  clientId: string;
  dossierId: string;
  montant: number;
  dateTransaction: Date;
  modePaiement: TrustModePaiement;
  reference?: string | null;
  description?: string | null;
  createdById?: string | null;
}

export interface CreateTrustWithdrawalParams {
  cabinetId: string;
  clientId: string;
  dossierId: string;
  montant: number;
  dateTransaction: Date;
  factureId?: string | null;
  modePaiement?: TrustModePaiement | null;
  reference?: string | null;
  description?: string | null;
  createdById?: string | null;
}

export interface CreateTrustCorrectionParams {
  cabinetId: string;
  clientId: string;
  dossierId: string;
  montant: number; // positif ou négatif
  dateTransaction: Date;
  correctionOfId: string;
  description: string;
  reference?: string | null;
  createdById?: string | null;
}

/** Enregistre un dépôt. Montant > 0, client et dossier obligatoires. */
export async function createTrustDeposit(params: CreateTrustDepositParams): Promise<{ transactionId: string }> {
  const {
    cabinetId,
    clientId,
    dossierId,
    montant,
    dateTransaction,
    modePaiement,
    reference,
    description,
    createdById,
  } = params;

  if (montant <= 0) throw new Error("Le montant du dépôt doit être strictement positif");
  if (!clientId || !dossierId) throw new Error("Client et dossier sont obligatoires");

  const { id: trustAccountId } = await getOrCreateTrustAccount({
    cabinetId,
    clientId,
    matterId: dossierId,
  });

  const balanceBefore = await getTrustBalance({ cabinetId, clientId, dossierId });
  const newBalance = balanceBefore + montant;
  const now = new Date();

  const tx = await prisma.$transaction(async (db) => {
    const created = await db.trustTransaction.create({
      data: {
        cabinetId,
        trustAccountId,
        clientId,
        dossierId,
        date: dateTransaction,
        amount: montant,
        type: "deposit",
        transactionType: "deposit",
        balanceAfter: newBalance,
        modePaiement,
        reference: reference ?? undefined,
        description: description ?? undefined,
        note: description ?? undefined,
        createdById: createdById ?? undefined,
      },
    });
    await db.trustAccount.update({
      where: { id: trustAccountId },
      data: { currentBalance: newBalance, updatedAt: now },
    });
    await db.client.update({
      where: { id: clientId },
      data: { lastTrustTransactionDate: now },
    });
    await db.dossier.update({
      where: { id: dossierId },
      data: { soldeFiducieDossier: newBalance },
    });
    return created;
  });

  await createAuditLog({
    cabinetId,
    userId: createdById ?? undefined,
    entityType: "TrustTransaction",
    entityId: tx.id,
    action: "create",
    newValues: { type: "deposit", amount: montant, balanceAfter: newBalance, clientId, dossierId },
    performedBy: createdById ?? undefined,
    performedAt: now,
  });

  return { transactionId: tx.id };
}

/** Enregistre un retrait. Vérifie le solde avant ; si factureId fourni, met à jour la facture. */
export async function createTrustWithdrawal(params: CreateTrustWithdrawalParams): Promise<{ transactionId: string }> {
  const {
    cabinetId,
    clientId,
    dossierId,
    montant,
    dateTransaction,
    factureId,
    modePaiement,
    reference,
    description,
    createdById,
  } = params;

  if (montant <= 0) throw new Error("Le montant du retrait doit être strictement positif");
  if (!clientId || !dossierId) throw new Error("Client et dossier sont obligatoires");

  const balance = await getTrustBalance({ cabinetId, clientId, dossierId });
  if (montant > balance) {
    throw new Error(
      `Solde fidéicommis insuffisant. Solde disponible : ${balance.toFixed(2)}$ ; montant demandé : ${montant.toFixed(2)}$.`
    );
  }

  const { id: trustAccountId } = await getOrCreateTrustAccount({
    cabinetId,
    clientId,
    matterId: dossierId,
  });

  const newBalance = balance - montant;
  const now = new Date();

  if (factureId) {
    const invoice = await prisma.invoice.findFirst({
      where: { id: factureId, cabinetId, clientId },
    });
    if (!invoice) throw new Error("Facture introuvable ou n'appartient pas à ce client");
  }

  const tx = await prisma.$transaction(async (db) => {
    const created = await db.trustTransaction.create({
      data: {
        cabinetId,
        trustAccountId,
        clientId,
        dossierId,
        date: dateTransaction,
        amount: -montant,
        type: "withdrawal",
        transactionType: factureId ? "transfer_to_invoice" : "withdrawal",
        balanceAfter: newBalance,
        invoiceId: factureId ?? undefined,
        modePaiement: modePaiement ?? undefined,
        reference: reference ?? undefined,
        description: description ?? undefined,
        note: description ?? undefined,
        createdById: createdById ?? undefined,
      },
    });
    await db.trustAccount.update({
      where: { id: trustAccountId },
      data: { currentBalance: newBalance, updatedAt: now },
    });
    await db.client.update({
      where: { id: clientId },
      data: { lastTrustTransactionDate: now },
    });
    await db.dossier.update({
      where: { id: dossierId },
      data: { soldeFiducieDossier: newBalance },
    });
    if (factureId) {
      const inv = await db.invoice.findUniqueOrThrow({ where: { id: factureId } });
      await db.invoice.update({
        where: { id: factureId },
        data: {
          trustAppliedAmount: (inv.trustAppliedAmount ?? 0) + montant,
          trustApplied: (inv.trustApplied ?? 0) + montant,
        },
      });
    }
    return created;
  });

  if (factureId) await recalculateInvoiceTotals(factureId);

  await createAuditLog({
    cabinetId,
    userId: createdById ?? undefined,
    entityType: "TrustTransaction",
    entityId: tx.id,
    action: "create",
    newValues: {
      type: "withdrawal",
      amount: -montant,
      balanceAfter: newBalance,
      clientId,
      dossierId,
      invoiceId: factureId ?? undefined,
    },
    performedBy: createdById ?? undefined,
    performedAt: now,
  });

  return { transactionId: tx.id };
}

/** Enregistre une correction (jamais modifier une transaction existante). */
export async function createTrustCorrection(params: CreateTrustCorrectionParams): Promise<{ transactionId: string }> {
  const { cabinetId, clientId, dossierId, montant, dateTransaction, correctionOfId, description, reference, createdById } =
    params;

  if (!clientId || !dossierId) throw new Error("Client et dossier sont obligatoires");

  const original = await prisma.trustTransaction.findFirst({
    where: { id: correctionOfId, cabinetId, clientId, dossierId },
  });
  if (!original) throw new Error("Transaction à corriger introuvable");

  const { id: trustAccountId } = await getOrCreateTrustAccount({
    cabinetId,
    clientId,
    matterId: dossierId,
  });

  const balanceBefore = await getTrustBalance({ cabinetId, clientId, dossierId });
  const newBalance = balanceBefore + montant;
  const now = new Date();

  const tx = await prisma.$transaction(async (db) => {
    const created = await db.trustTransaction.create({
      data: {
        cabinetId,
        trustAccountId,
        clientId,
        dossierId,
        date: dateTransaction,
        amount: montant,
        type: "correction",
        transactionType: "correction",
        balanceAfter: newBalance,
        correctionOfId,
        description,
        note: description,
        reference: reference ?? undefined,
        createdById: createdById ?? undefined,
      },
    });
    await db.trustAccount.update({
      where: { id: trustAccountId },
      data: { currentBalance: newBalance, updatedAt: now },
    });
    await db.client.update({
      where: { id: clientId },
      data: { lastTrustTransactionDate: now },
    });
    await db.dossier.update({
      where: { id: dossierId },
      data: { soldeFiducieDossier: newBalance },
    });
    return created;
  });

  await createAuditLog({
    cabinetId,
    userId: createdById ?? undefined,
    entityType: "TrustTransaction",
    entityId: tx.id,
    action: "create",
    newValues: {
      type: "correction",
      amount: montant,
      correctionOfId,
      balanceAfter: newBalance,
      clientId,
      dossierId,
    },
    performedBy: createdById ?? undefined,
    performedAt: now,
  });

  return { transactionId: tx.id };
}
