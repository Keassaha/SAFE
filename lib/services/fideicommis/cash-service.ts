/**
 * Chaîne des sommes reçues en espèces.
 *
 * Art. 69 à 73 B-1 r.5 · s. 4 à 6, 19 By-Law 9.
 *
 * Remplace le contrôle brut antérieur (`montant >= 7500 → refus`) par la règle
 * réellement écrite : un seuil AGRÉGÉ par dossier, assorti d'exceptions propres à
 * chaque province, et une chaîne documentaire complète — reçu signé sans seuil,
 * déclaration dans les 30 jours au Québec, remboursement en espèces, conversion au
 * taux de midi.
 */

import { prisma } from "@/lib/db";
import { createAuditLog } from "@/lib/services/audit";
import { getCabinetProvince } from "@/lib/cabinet/get-province";
import { resolveProvince, type CabinetProvince } from "@/lib/compliance/rules";
import {
  CASH_THRESHOLD_CAD,
  evaluateCashAcceptance,
  getCashDeclarationDuty,
  getCashExemption,
  getCashRefundRule,
  payerSignatureMayBeWaived,
  resolveConversionRateDate,
  toCad,
} from "@/lib/compliance/cash";

/** Refus motivé, portant son article et sa porte de sortie (PR-2, PR-4). */
export class CashComplianceError extends Error {
  readonly code:
    | "CASH_THRESHOLD_EXCEEDED"
    | "EXEMPTION_NOT_AVAILABLE_IN_PROVINCE"
    | "EXEMPTION_JUSTIFICATION_REQUIRED"
    | "PAYER_SIGNATURE_REQUIRED"
    | "REFUND_MUST_BE_CASH"
    | "REFUND_EXCEEDS_RECEIPT";
  readonly reference: string;

  constructor(params: {
    code: CashComplianceError["code"];
    message: string;
    reference: string;
    remedy: string;
  }) {
    super(`${params.message} (${params.reference}) ${params.remedy}`);
    this.name = "CashComplianceError";
    this.code = params.code;
    this.reference = params.reference;
  }
}

/**
 * Cumul des espèces déjà reçues pour un dossier, en dollars canadiens.
 *
 * C'est la donnée qui manquait : le contrôle antérieur ne regardait que le versement
 * présenté. La s. 4(1) vise « an aggregate amount » et l'art. 69 « pour un même
 * mandat ou contrat de service ».
 */
export async function getCashAggregateForDossier(params: {
  cabinetId: string;
  dossierId: string;
  province: CabinetProvince;
}): Promise<number> {
  const agg = await prisma.cashReceipt.aggregate({
    where: {
      cabinetId: params.cabinetId,
      dossierId: params.dossierId,
      // Au Québec, seule la réception EN FIDÉICOMMIS entre dans le cumul de
      // l'art. 69. En Ontario, la s. 4(1) vise toute somme rattachée au dossier.
      ...(params.province === "QC" ? { intoTrust: true } : {}),
    },
    _sum: { cadAmount: true },
  });
  return Math.round((agg._sum.cadAmount ?? 0) * 100) / 100;
}

export interface RecordCashReceiptParams {
  cabinetId: string;
  clientId: string;
  dossierId: string;
  userId: string;
  date: Date;
  payerName: string;
  amount: number;
  currency?: string;
  /** Taux de change si devise étrangère (art. 73 / s. 4(2)). */
  conversionRate?: number | null;
  /** Calendrier des jours fériés. Injecté : c'est une donnée, pas une règle. */
  isHoliday?: (d: Date) => boolean;
  purpose?: string | null;
  intoTrust?: boolean;
  exemptionInvoked?: string | null;
  exemptionJustification?: string | null;
  licenseeSignatureDocumentId?: string | null;
  payerSignatureDocumentId?: string | null;
  payerSignatureWaivedReason?: string | null;
  trustTransactionId?: string | null;
}

/**
 * Enregistre une somme reçue en espèces, avec son reçu.
 *
 * Le reçu est produit pour TOUTE somme, sans seuil : l'art. 70 vise « une somme en
 * espèces » et la s. 19(1) « every licensee who receives cash ». Le seuil de
 * 7 500 $ ne concerne que l'acceptation et la déclaration.
 */
export async function recordCashReceipt(
  params: RecordCashReceiptParams,
): Promise<{ id: string; receiptNumber: number; declarationDueAt: Date | null }> {
  const province = resolveProvince(await getCabinetProvince(params.cabinetId));
  const intoTrust = params.intoTrust ?? true;
  const currency = params.currency ?? "CAD";

  // ── Art. 73 / s. 4(2) — conversion ─────────────────────────────────────────
  let cadAmount = params.amount;
  let conversionRateDate: Date | null = null;
  if (currency !== "CAD") {
    if (!params.conversionRate) {
      throw new Error(
        `Taux de conversion requis pour une somme en ${currency} ` +
          `(${province === "QC" ? "B-1 r.5, art. 73" : "By-Law 9, s. 4(2)"}).`,
      );
    }
    const rule = resolveConversionRateDate({
      province,
      receivedAt: params.date,
      isHoliday: params.isHoliday ?? (() => false),
    });
    conversionRateDate = rule.rateDate;
    cadAmount = toCad(params.amount, params.conversionRate);
  }

  // ── Art. 69 / s. 4(1) — seuil agrégé par dossier ───────────────────────────
  const alreadyReceivedCad = await getCashAggregateForDossier({
    cabinetId: params.cabinetId,
    dossierId: params.dossierId,
    province,
  });

  const verdict = evaluateCashAcceptance(province, {
    amountCad: cadAmount,
    alreadyReceivedCad,
    exemption: params.exemptionInvoked,
    intoTrust,
  });

  if (verdict.status === "REFUSED") {
    await createAuditLog({
      cabinetId: params.cabinetId,
      userId: params.userId,
      entityType: "TrustTransaction",
      entityId: "BLOCKED",
      action: "create",
      metadata: { blocked: true, reason: verdict.code },
      newValues: {
        cadAmount,
        alreadyReceivedCad,
        aggregateCad: verdict.aggregateCad,
        dossierId: params.dossierId,
        exemption: params.exemptionInvoked ?? null,
      },
      performedBy: params.userId,
      performedAt: new Date(),
    });
    throw new CashComplianceError({
      code: verdict.code,
      message: verdict.messageFr,
      reference: verdict.reference,
      remedy: verdict.remedyFr,
    });
  }

  // Une exception invoquée sans justification n'est pas une exception : c'est une
  // case cochée. Le motif devient la réponse du cabinet en cas d'inspection.
  if (params.exemptionInvoked && !params.exemptionJustification?.trim()) {
    const def = getCashExemption(province, params.exemptionInvoked);
    throw new CashComplianceError({
      code: "EXEMPTION_JUSTIFICATION_REQUIRED",
      message: "Une exception au seuil doit être justifiée.",
      reference: def?.reference ?? (province === "QC" ? "B-1 r.5, art. 69" : "By-Law 9, s. 6"),
      remedy: "Indiquez en quoi la situation correspond à l'exception invoquée.",
    });
  }

  // ── Art. 70 al. 2 / s. 19(1) — les deux signatures ─────────────────────────
  const waiver = payerSignatureMayBeWaived(province);
  const hasPayerSignature = Boolean(params.payerSignatureDocumentId);
  const hasWaiverReason = Boolean(params.payerSignatureWaivedReason?.trim());
  if (!hasPayerSignature && !(waiver.allowed && hasWaiverReason)) {
    throw new CashComplianceError({
      code: "PAYER_SIGNATURE_REQUIRED",
      message: "Le reçu doit être signé par la personne de qui provient la somme.",
      reference: waiver.reference,
      remedy: waiver.allowed
        ? "Joignez la signature, ou documentez les efforts raisonnables faits pour l'obtenir (s. 19(2))."
        : "Joignez la signature du payeur. B-1 r.5 ne prévoit aucune dispense.",
    });
  }

  // ── Art. 71 — déclaration au directeur, Québec seulement ───────────────────
  const declaration = getCashDeclarationDuty({ province, amountCad: cadAmount, receivedAt: params.date });

  const exemptionDef = params.exemptionInvoked
    ? getCashExemption(province, params.exemptionInvoked)
    : undefined;

  const created = await prisma.$transaction(async (db) => {
    // Numérotation séquentielle sans trou, sous verrou : deux reçus concurrents ne
    // doivent pas porter le même numéro, ni en sauter un.
    await db.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`cash:${params.cabinetId}`}))`;
    const last = await db.cashReceipt.findFirst({
      where: { cabinetId: params.cabinetId },
      orderBy: { receiptNumber: "desc" },
      select: { receiptNumber: true },
    });
    const receiptNumber = (last?.receiptNumber ?? 0) + 1;

    return db.cashReceipt.create({
      data: {
        cabinetId: params.cabinetId,
        receiptNumber,
        date: params.date,
        payerName: params.payerName.trim(),
        amount: params.amount,
        currency,
        cadAmount,
        conversionRate: params.conversionRate ?? undefined,
        conversionRateDate: conversionRateDate ?? undefined,
        clientId: params.clientId,
        dossierId: params.dossierId,
        purpose: params.purpose ?? undefined,
        receivedByUserId: params.userId,
        licenseeSignatureDocumentId: params.licenseeSignatureDocumentId ?? undefined,
        payerSignatureDocumentId: params.payerSignatureDocumentId ?? undefined,
        payerSignatureWaivedReason: params.payerSignatureWaivedReason ?? undefined,
        province,
        intoTrust,
        exemptionInvoked: params.exemptionInvoked ?? undefined,
        exemptionJustification: params.exemptionJustification ?? undefined,
        refundMustBeCash: exemptionDef?.refundMustBeCash ?? false,
        declarationDueAt: declaration.dueAt ?? undefined,
        trustTransactionId: params.trustTransactionId ?? undefined,
      },
      select: { id: true, receiptNumber: true },
    });
  });

  await createAuditLog({
    cabinetId: params.cabinetId,
    userId: params.userId,
    entityType: "TrustTransaction",
    entityId: created.id,
    action: "create",
    newValues: {
      type: "cash_receipt",
      receiptNumber: created.receiptNumber,
      cadAmount,
      province,
      exemption: params.exemptionInvoked ?? null,
      declarationDueAt: declaration.dueAt?.toISOString() ?? null,
    },
    performedBy: params.userId,
    performedAt: new Date(),
  });

  return { ...created, declarationDueAt: declaration.dueAt };
}

/* ════════════════════════════════════════════════════════════════
   DÉCLARATION — art. 71 QC
   ════════════════════════════════════════════════════════════════ */

/**
 * Déclarations dues et en retard.
 *
 * Alimente le tableau de conformité : l'art. 71 fixe un délai de 30 jours, et un
 * dépassement est un manquement chiffrable, contrairement aux délais que le
 * règlement laisse ouverts.
 */
export async function getPendingCashDeclarations(params: {
  cabinetId: string;
  now?: Date;
}): Promise<
  Array<{
    id: string;
    receiptNumber: number;
    date: Date;
    cadAmount: number;
    payerName: string;
    dueAt: Date;
    daysRemaining: number;
    overdue: boolean;
  }>
> {
  const now = params.now ?? new Date();
  const receipts = await prisma.cashReceipt.findMany({
    where: {
      cabinetId: params.cabinetId,
      declarationDueAt: { not: null },
      declarationSentAt: null,
    },
    orderBy: { declarationDueAt: "asc" },
  });

  return receipts.map((r) => {
    const dueAt = r.declarationDueAt!;
    return {
      id: r.id,
      receiptNumber: r.receiptNumber,
      date: r.date,
      cadAmount: r.cadAmount,
      payerName: r.payerName,
      dueAt,
      daysRemaining: Math.ceil((dueAt.getTime() - now.getTime()) / 86_400_000),
      overdue: now.getTime() > dueAt.getTime(),
    };
  });
}

/** Consigne l'envoi de la déclaration au directeur de l'inspection professionnelle. */
export async function markDeclarationSent(params: {
  cabinetId: string;
  cashReceiptId: string;
  sentAt: Date;
  documentId?: string | null;
  userId: string;
}): Promise<void> {
  await prisma.cashReceipt.updateMany({
    where: { id: params.cashReceiptId, cabinetId: params.cabinetId },
    data: {
      declarationSentAt: params.sentAt,
      declarationDocumentId: params.documentId ?? undefined,
    },
  });

  await createAuditLog({
    cabinetId: params.cabinetId,
    userId: params.userId,
    entityType: "TrustTransaction",
    entityId: params.cashReceiptId,
    action: "update",
    newValues: { type: "cash_declaration_sent", sentAt: params.sentAt.toISOString() },
    performedBy: params.userId,
    performedAt: new Date(),
  });
}

/* ════════════════════════════════════════════════════════════════
   REMBOURSEMENT — art. 72 QC / s. 6(e) ON
   ════════════════════════════════════════════════════════════════ */

/**
 * Rembourse une somme reçue en espèces.
 *
 * `refundInCash` est explicite parce que le règlement l'impose dans un cas et
 * l'interdit dans l'autre : l'art. 57 interdit les sorties en espèces, l'art. 72 les
 * impose pour les sommes de 7 500 $ ou plus reçues en espèces. Deviner le mode
 * produirait tantôt une infraction à l'art. 57, tantôt à l'art. 72.
 */
export async function recordCashRefund(params: {
  cabinetId: string;
  cashReceiptId: string;
  date: Date;
  amount: number;
  recipientName: string;
  refundInCash: boolean;
  signatureDocumentId?: string | null;
  userId: string;
}): Promise<{ id: string }> {
  const province = resolveProvince(await getCabinetProvince(params.cabinetId));

  const receipt = await prisma.cashReceipt.findFirst({
    where: { id: params.cashReceiptId, cabinetId: params.cabinetId },
    include: { refunds: { select: { amount: true } } },
  });
  if (!receipt) throw new Error("Reçu d'espèces introuvable pour ce cabinet");

  const alreadyRefunded = receipt.refunds.reduce((s, r) => s + r.amount, 0);
  if (alreadyRefunded + params.amount > receipt.cadAmount + 0.005) {
    throw new CashComplianceError({
      code: "REFUND_EXCEEDS_RECEIPT",
      message: `Le cumul des remboursements dépasserait la somme reçue (${receipt.cadAmount.toFixed(2)} $).`,
      reference: province === "QC" ? "B-1 r.5, art. 72" : "By-Law 9, s. 6(e)",
      remedy: "Vérifiez le montant : un remboursement ne peut excéder la somme reçue.",
    });
  }

  const rule = getCashRefundRule({
    province,
    originalAmountCad: receipt.cadAmount,
    exemptionInvoked: receipt.exemptionInvoked,
  });

  if (rule.mustBeCash && !params.refundInCash) {
    throw new CashComplianceError({
      code: "REFUND_MUST_BE_CASH",
      message: "Ce remboursement doit être effectué en espèces.",
      reference: rule.reference,
      remedy: rule.noteFr,
    });
  }

  const created = await prisma.cashRefund.create({
    data: {
      cabinetId: params.cabinetId,
      cashReceiptId: params.cashReceiptId,
      date: params.date,
      amount: params.amount,
      recipientName: params.recipientName.trim(),
      clientId: receipt.clientId,
      dossierId: receipt.dossierId,
      signatureDocumentId: params.signatureDocumentId ?? undefined,
    },
    select: { id: true },
  });

  await createAuditLog({
    cabinetId: params.cabinetId,
    userId: params.userId,
    entityType: "TrustTransaction",
    entityId: created.id,
    action: "create",
    newValues: {
      type: "cash_refund",
      cashReceiptId: params.cashReceiptId,
      amount: params.amount,
      inCash: params.refundInCash,
      recipientName: params.recipientName,
    },
    performedBy: params.userId,
    performedAt: new Date(),
  });

  return created;
}

/** Reçus d'espèces d'un cabinet, avec leur état de déclaration. */
export async function listCashReceipts(params: {
  cabinetId: string;
  dossierId?: string | null;
  from?: Date;
  to?: Date;
}) {
  return prisma.cashReceipt.findMany({
    where: {
      cabinetId: params.cabinetId,
      ...(params.dossierId ? { dossierId: params.dossierId } : {}),
      ...(params.from || params.to
        ? { date: { ...(params.from ? { gte: params.from } : {}), ...(params.to ? { lte: params.to } : {}) } }
        : {}),
    },
    orderBy: { receiptNumber: "asc" },
    include: { refunds: true },
  });
}

export { CASH_THRESHOLD_CAD };
