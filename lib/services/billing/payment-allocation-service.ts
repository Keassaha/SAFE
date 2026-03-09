/**
 * Service paiements et allocations.
 * Règle : paiements et allocations séparés ; recalcul du solde facture après chaque allocation.
 */

import { prisma } from "@/lib/db";
import { createAuditLog } from "@/lib/services/audit";
import { recalculateInvoiceTotals } from "./invoice-service";

export async function createPayment(params: {
  cabinetId: string;
  clientId: string;
  paymentDate: Date;
  amount: number;
  paymentMethod?: string;
  referenceNumber?: string | null;
  sourceAccountType?: string;
  note?: string | null;
  receivedById?: string | null;
  invoiceId?: string | null;
  allocatedAmount?: number;
}): Promise<{ paymentId: string }> {
  const {
    cabinetId,
    clientId,
    paymentDate,
    amount,
    paymentMethod = "other",
    referenceNumber,
    sourceAccountType = "operating",
    note,
    receivedById,
    invoiceId,
    allocatedAmount,
  } = params;

  const payment = await prisma.payment.create({
    data: {
      cabinetId,
      clientId,
      datePaiement: paymentDate,
      montant: amount,
      mode: paymentMethod,
      method: "autre",
      reference: referenceNumber ?? undefined,
      paymentMethod: paymentMethod as "cash" | "cheque" | "e_transfer" | "card" | "bank_transfer" | "trust" | "other",
      referenceNumber: referenceNumber ?? undefined,
      sourceAccountType: (sourceAccountType as "operating" | "trust" | "external") ?? "operating",
      allocationStatus: "UNALLOCATED",
      note: note ?? undefined,
      receivedById: receivedById ?? undefined,
      invoiceId: invoiceId ?? undefined,
    },
  });

  if (invoiceId && allocatedAmount != null && allocatedAmount > 0) {
    await allocateToInvoices({
      paymentId: payment.id,
      allocations: [{ invoiceId, allocatedAmount }],
      performedById: receivedById,
    });
  }

  await createAuditLog({
    cabinetId,
    userId: receivedById ?? undefined,
    entityType: "Payment",
    entityId: payment.id,
    action: "create",
    newValues: { amount, clientId, invoiceId, allocatedAmount },
    performedBy: receivedById ?? undefined,
    performedAt: new Date(),
  });

  return { paymentId: payment.id };
}

/** Met à jour les champs modifiables d'un paiement. Le montant ne peut pas être inférieur au montant déjà alloué. */
export async function updatePayment(params: {
  paymentId: string;
  cabinetId: string;
  paymentDate?: Date;
  amount?: number;
  paymentMethod?: string;
  referenceNumber?: string | null;
  sourceAccountType?: string;
  note?: string | null;
  performedById?: string | null;
}): Promise<void> {
  const {
    paymentId,
    cabinetId,
    paymentDate,
    amount,
    paymentMethod,
    referenceNumber,
    sourceAccountType,
    note,
    performedById,
  } = params;

  const payment = await prisma.payment.findFirst({
    where: { id: paymentId, cabinetId },
    include: { paymentAllocations: true },
  });
  if (!payment) throw new Error("Paiement introuvable");
  if (payment.allocationStatus === "REVERSED") {
    throw new Error("Ce paiement a été annulé");
  }

  const alreadyAllocated = payment.paymentAllocations.reduce(
    (s, a) => s + a.allocatedAmount,
    0
  );
  if (amount != null && amount < alreadyAllocated) {
    throw new Error(
      `Le montant ne peut pas être inférieur au montant déjà alloué (${alreadyAllocated})`
    );
  }

  const updateData: Parameters<typeof prisma.payment.update>[0]["data"] = {};
  if (paymentDate != null) updateData.datePaiement = paymentDate;
  if (amount != null) updateData.montant = amount;
  if (paymentMethod != null)
    updateData.paymentMethod =
      paymentMethod as "cash" | "cheque" | "e_transfer" | "card" | "bank_transfer" | "trust" | "other";
  if (referenceNumber !== undefined) updateData.referenceNumber = referenceNumber ?? undefined;
  if (referenceNumber !== undefined) updateData.reference = referenceNumber ?? undefined;
  if (sourceAccountType != null)
    updateData.sourceAccountType =
      sourceAccountType as "operating" | "trust" | "external";
  if (note !== undefined) updateData.note = note ?? undefined;

  if (Object.keys(updateData).length === 0) return;

  await prisma.payment.update({
    where: { id: paymentId },
    data: updateData,
  });

  await createAuditLog({
    cabinetId,
    userId: performedById ?? undefined,
    entityType: "Payment",
    entityId: paymentId,
    action: "update",
    newValues: updateData,
    performedBy: performedById ?? undefined,
    performedAt: new Date(),
  });
}

/** Alloue un paiement à une ou plusieurs factures */
export async function allocateToInvoices(params: {
  paymentId: string;
  allocations: { invoiceId: string; allocatedAmount: number }[];
  performedById?: string | null;
  cabinetId?: string;
}): Promise<void> {
  const { paymentId, allocations, performedById, cabinetId: enforcedCabinetId } = params;

  const payment = await prisma.payment.findFirst({
    where: { id: paymentId, ...(enforcedCabinetId ? { cabinetId: enforcedCabinetId } : {}) },
    include: { paymentAllocations: true },
  });
  if (!payment) throw new Error("Paiement introuvable");
  if (payment.allocationStatus === "REVERSED") {
    throw new Error("Ce paiement a été annulé");
  }

  const alreadyAllocated = payment.paymentAllocations.reduce(
    (s, a) => s + a.allocatedAmount,
    0
  );
  const newTotal = allocations.reduce((s, a) => s + a.allocatedAmount, 0);
  if (alreadyAllocated + newTotal > payment.montant) {
    throw new Error("Le total des allocations ne peut pas dépasser le montant du paiement");
  }

  const cabinetId = payment.cabinetId;
  const now = new Date();

  await prisma.$transaction(async (tx) => {
    for (const { invoiceId, allocatedAmount } of allocations) {
      if (allocatedAmount <= 0) continue;
      const inv = await tx.invoice.findFirst({
        where: { id: invoiceId, cabinetId },
      });
      if (!inv) throw new Error(`Facture ${invoiceId} introuvable`);
      await tx.paymentAllocation.create({
        data: {
          paymentId,
          invoiceId,
          allocatedAmount,
          allocatedAt: now,
        },
      });
    }

    const totalAllocated =
      alreadyAllocated +
      allocations.reduce((s, a) => s + a.allocatedAmount, 0);
    const status =
      totalAllocated >= payment.montant
        ? "ALLOCATED"
        : totalAllocated > 0
          ? "PARTIALLY_ALLOCATED"
          : "UNALLOCATED";
    await tx.payment.update({
      where: { id: paymentId },
      data: { allocationStatus: status },
    });
  });

  for (const { invoiceId } of allocations) {
    await recalculateInvoiceTotals(invoiceId);
  }

  await createAuditLog({
    cabinetId,
    userId: performedById ?? undefined,
    entityType: "Payment",
    entityId: paymentId,
    action: "update",
    newValues: { allocations },
    performedBy: performedById ?? undefined,
    performedAt: now,
  });
}
