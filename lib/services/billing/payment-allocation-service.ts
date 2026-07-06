/**
 * Service paiements et allocations.
 * Règle : paiements et allocations séparés ; recalcul du solde facture après chaque allocation.
 */

import { prisma } from "@/lib/db";
import { createAuditLog } from "@/lib/services/audit";
import { writeJournalForPayment } from "@/lib/services/journal/billing-journal";
import { recalculateInvoiceTotals } from "./invoice-service";
import { warnPaymentWithoutInvoice, type GuardWarning } from "@/lib/accounting/anti-erreurs";

export interface AllocationItem {
  invoiceId: string;
  allocatedAmount: number;
}

/**
 * Validation pure des règles d'allocation. Centralisée pour pouvoir être
 * testée sans Prisma.
 *
 * Règles :
 *   - chaque allocation > 0 (les <= 0 sont rejetées explicitement) ;
 *   - chaque invoiceId apparaît au plus une fois dans la requête (rejet
 *     explicite des doublons — l'utilisateur doit consolider lui-même) ;
 *   - somme des allocations ≤ (montant du paiement − déjà alloué sur ce paiement) ;
 *   - chaque allocation ≤ solde restant DÛ de la facture (balanceDue).
 */
export function validateAllocationRequest(input: {
  paymentTotal: number;
  alreadyAllocatedFromThisPayment: number;
  allocations: AllocationItem[];
  invoiceBalances: Map<string, number>;
}): { ok: true; items: AllocationItem[] } | { ok: false; error: string } {
  const {
    paymentTotal,
    alreadyAllocatedFromThisPayment,
    allocations,
    invoiceBalances,
  } = input;

  if (allocations.length === 0) {
    return { ok: false, error: "Aucune allocation fournie" };
  }

  for (const { allocatedAmount } of allocations) {
    if (!Number.isFinite(allocatedAmount) || allocatedAmount <= 0) {
      return { ok: false, error: "Le montant d'allocation doit être strictement positif" };
    }
  }

  const seen = new Set<string>();
  for (const { invoiceId } of allocations) {
    if (seen.has(invoiceId)) {
      return {
        ok: false,
        error: `Allocation en double sur la facture ${invoiceId} : consolidez les montants en une seule entrée.`,
      };
    }
    seen.add(invoiceId);
  }

  const totalRequested = allocations.reduce((s, a) => s + a.allocatedAmount, 0);
  const remainingOnPayment = paymentTotal - alreadyAllocatedFromThisPayment;
  if (totalRequested > remainingOnPayment + 0.0001) {
    return {
      ok: false,
      error: `Le total des allocations (${totalRequested}) dépasse le solde non alloué du paiement (${remainingOnPayment}).`,
    };
  }

  for (const { invoiceId, allocatedAmount } of allocations) {
    const balance = invoiceBalances.get(invoiceId);
    if (balance == null) {
      return { ok: false, error: `Facture ${invoiceId} introuvable` };
    }
    if (allocatedAmount > balance + 0.0001) {
      return {
        ok: false,
        error: `Allocation de ${allocatedAmount} sur la facture ${invoiceId} excède son solde dû (${balance}).`,
      };
    }
  }

  return { ok: true, items: allocations };
}

/**
 * Allocation initiale sûre quand un paiement est saisi directement depuis une
 * facture. Sans montant explicite, on applique le paiement jusqu'au plus petit
 * des deux montants : paiement reçu ou solde dû. Le surplus reste non alloué
 * et ressort comme crédit client à traiter.
 */
export function resolveInitialAllocationAmount(input: {
  paymentAmount: number;
  invoiceBalanceDue: number;
  requestedAllocatedAmount?: number | null;
}): number {
  const paymentAmount = roundSignedMoney(input.paymentAmount);
  const invoiceBalanceDue = roundSignedMoney(input.invoiceBalanceDue);
  const requested =
    input.requestedAllocatedAmount != null
      ? roundSignedMoney(input.requestedAllocatedAmount)
      : null;

  if (requested != null && requested > 0) return requested;
  if (paymentAmount <= 0 || invoiceBalanceDue <= 0) return 0;
  return Math.min(paymentAmount, invoiceBalanceDue);
}

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
  // Import intelligent de preuve (Interac) — lot L4.
  provider?: string | null;
  providerRef?: string | null;
  payerName?: string | null;
  payerEmail?: string | null;
  preuveStorageKey?: string | null;
  preuveExtractedAt?: Date | null;
  preuveHash?: string | null;
}): Promise<{ paymentId: string; warnings: GuardWarning[] }> {
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
    provider,
    providerRef,
    payerName,
    payerEmail,
    preuveStorageKey,
    preuveExtractedAt,
    preuveHash,
  } = params;

  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("Le montant du paiement doit être strictement positif");
  }

  // Anti-doublon : un même virement (provider/providerRef) ne s'enregistre qu'une fois.
  // La contrainte unique [cabinetId, providerRef] garantit l'idempotence côté DB ;
  // ce pré-check produit un message clair avant d'atteindre la contrainte.
  if (providerRef) {
    const existing = await prisma.payment.findFirst({
      where: { cabinetId, providerRef },
      select: { id: true },
    });
    if (existing) {
      throw new Error("Ce virement a déjà été enregistré (doublon détecté).");
    }
  }

  // Anti-doublon par contenu : un même fichier de preuve (hash) ne s'enregistre qu'une fois.
  if (preuveHash) {
    const existingByHash = await prisma.payment.findFirst({
      where: { cabinetId, preuveHash },
      select: { id: true },
    });
    if (existingByHash) {
      throw new Error("Cette preuve a déjà été importée (fichier identique).");
    }
  }

  const payment = await prisma.$transaction(async (tx) => {
    let invoiceForAllocation:
      | {
          id: string;
          cabinetId: string;
          clientId: string;
          dossierId: string | null;
          numero: string;
          balanceDue: number;
        }
      | null = null;
    let initialAllocationAmount = 0;

    if (invoiceId) {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`invoice:${invoiceId}`}))`;
      invoiceForAllocation = await tx.invoice.findFirst({
        where: { id: invoiceId, cabinetId, clientId },
        select: {
          id: true,
          cabinetId: true,
          clientId: true,
          dossierId: true,
          numero: true,
          balanceDue: true,
        },
      });
      if (!invoiceForAllocation) {
        throw new Error("Facture introuvable ou n'appartient pas à ce client");
      }

      initialAllocationAmount = resolveInitialAllocationAmount({
        paymentAmount: amount,
        invoiceBalanceDue: invoiceForAllocation.balanceDue,
        requestedAllocatedAmount: allocatedAmount,
      });
      if (initialAllocationAmount <= 0) {
        throw new Error(
          "La facture sélectionnée n'a aucun solde dû. Enregistrez ce paiement sans facture pour le traiter comme crédit client.",
        );
      }

      const validation = validateAllocationRequest({
        paymentTotal: amount,
        alreadyAllocatedFromThisPayment: 0,
        allocations: [{ invoiceId, allocatedAmount: initialAllocationAmount }],
        invoiceBalances: new Map([[invoiceId, invoiceForAllocation.balanceDue]]),
      });
      if (!validation.ok) throw new Error(validation.error);
    }

    const created = await tx.payment.create({
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
        provider: provider ?? undefined,
        providerRef: providerRef ?? undefined,
        payerName: payerName ?? undefined,
        payerEmail: payerEmail ?? undefined,
        preuveStorageKey: preuveStorageKey ?? undefined,
        preuveExtractedAt: preuveExtractedAt ?? undefined,
        preuveHash: preuveHash ?? undefined,
      },
      include: {
        client: { select: { raisonSociale: true, prenom: true, nom: true } },
        invoice: { select: { numero: true, dossierId: true } },
      },
    });

    await writeJournalForPayment(created, {
      client: tx,
      utilisateurId: receivedById ?? null,
    });

    if (invoiceForAllocation && initialAllocationAmount > 0) {
      await tx.paymentAllocation.create({
        data: {
          paymentId: created.id,
          invoiceId: invoiceForAllocation.id,
          allocatedAmount: initialAllocationAmount,
          allocatedAt: new Date(),
        },
      });

      await tx.payment.update({
        where: { id: created.id },
        data: {
          allocationStatus:
            initialAllocationAmount >= amount
              ? "ALLOCATED"
              : "PARTIALLY_ALLOCATED",
        },
      });

      await recalculateInvoiceTotals(invoiceForAllocation.id, tx);
    }

    return created;
  });

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

  const warnings: GuardWarning[] = [];
  const warning = warnPaymentWithoutInvoice(Boolean(invoiceId));
  if (warning) warnings.push(warning);

  return { paymentId: payment.id, warnings };
}

function roundSignedMoney(value: number): number {
  return Math.round((value || 0) * 100) / 100;
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

/** Alloue un paiement à une ou plusieurs factures.
 *
 * Concurrence : la validation balance/paiement est rejouée **dans la transaction**
 * sous verrou Postgres advisory (`pg_advisory_xact_lock`) sur le paiement et sur
 * chaque facture cible. Cela sérialise les requêtes concurrentes touchant les
 * mêmes factures/paiement et empêche la sur-allocation, même si deux clients
 * envoient simultanément des allocations identiques.
 *
 * La pré-validation hors transaction reste utile pour fail-fast sur les
 * requêtes manifestement invalides (montants ≤ 0, doublons, paiement annulé).
 */
export async function allocateToInvoices(params: {
  paymentId: string;
  allocations: AllocationItem[];
  performedById?: string | null;
  cabinetId?: string;
}): Promise<void> {
  const { paymentId, allocations, performedById, cabinetId: enforcedCabinetId } = params;

  // 1. Lecture initiale du paiement (sans verrou) pour fail-fast sur paiement
  // inexistant/annulé. La revalidation sous verrou est faite plus loin.
  const payment = await prisma.payment.findFirst({
    where: { id: paymentId, ...(enforcedCabinetId ? { cabinetId: enforcedCabinetId } : {}) },
    select: { id: true, cabinetId: true, allocationStatus: true },
  });
  if (!payment) throw new Error("Paiement introuvable");
  if (payment.allocationStatus === "REVERSED") {
    throw new Error("Ce paiement a été annulé");
  }

  const cabinetId = payment.cabinetId;
  // Trié pour ordonner les advisory locks de manière déterministe entre
  // requêtes concurrentes — évite les deadlocks lock-A-puis-B vs lock-B-puis-A.
  const invoiceIds = Array.from(new Set(allocations.map((a) => a.invoiceId))).sort();
  const now = new Date();

  // 2. Toute la logique d'écriture sous verrou advisory + revalidation atomique
  const validatedItems = await prisma.$transaction(async (tx) => {
    // Verrou advisory : sérialise les transactions concurrentes touchant ce
    // paiement et ces factures. Libéré automatiquement au commit/rollback.
    // Pattern réutilisé depuis lib/services/journal/journal-service.ts.
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`payment:${paymentId}`}))`;
    for (const invoiceId of invoiceIds) {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`invoice:${invoiceId}`}))`;
    }

    // Re-lecture sous verrou : c'est l'état "vrai" et personne ne peut
    // muter ces lignes tant que la tx n'est pas terminée.
    const paymentLocked = await tx.payment.findFirst({
      where: { id: paymentId, cabinetId },
      include: { paymentAllocations: true },
    });
    if (!paymentLocked) throw new Error("Paiement introuvable");
    if (paymentLocked.allocationStatus === "REVERSED") {
      throw new Error("Ce paiement a été annulé");
    }
    const alreadyAllocatedFromThisPayment = paymentLocked.paymentAllocations.reduce(
      (s, a) => s + a.allocatedAmount,
      0,
    );

    const invoices = await tx.invoice.findMany({
      where: { id: { in: invoiceIds }, cabinetId },
      select: { id: true, balanceDue: true },
    });
    const invoiceBalances = new Map<string, number>(
      invoices.map((i) => [i.id, i.balanceDue ?? 0]),
    );

    // Validation atomique : sous verrou, balance et déjà-alloué sont fiables.
    const validation = validateAllocationRequest({
      paymentTotal: paymentLocked.montant,
      alreadyAllocatedFromThisPayment,
      allocations,
      invoiceBalances,
    });
    if (!validation.ok) throw new Error(validation.error);

    // Écritures
    for (const { invoiceId, allocatedAmount } of validation.items) {
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
      alreadyAllocatedFromThisPayment +
      validation.items.reduce((s, a) => s + a.allocatedAmount, 0);
    const status =
      totalAllocated >= paymentLocked.montant
        ? "ALLOCATED"
        : totalAllocated > 0
          ? "PARTIALLY_ALLOCATED"
          : "UNALLOCATED";
    await tx.payment.update({
      where: { id: paymentId },
      data: { allocationStatus: status },
    });

    for (const { invoiceId } of validation.items) {
      await recalculateInvoiceTotals(invoiceId, tx);
    }

    return validation.items;
  });

  await createAuditLog({
    cabinetId,
    userId: performedById ?? undefined,
    entityType: "Payment",
    entityId: paymentId,
    action: "update",
    newValues: { allocations: validatedItems },
    performedBy: performedById ?? undefined,
    performedAt: now,
  });
}
