/**
 * Virements électroniques depuis un compte en fiducie, et transferts entre
 * cartes-clients.
 *
 * ⚠️ Les fonctions de virement sont ONTARIENNES. Elles refusent de s'exécuter pour un
 * cabinet québécois : B-1 r.5 n'impose ni réquisition, ni double contrôle, ni
 * formulaire (art. 58). Servir le Form 9A au Québec inventerait une obligation.
 *
 * Réf. By-Law 9 s. 11, 12, 18(4), 18(11), 19.1 · B-1 r.5 art. 39, 56(3), 58.
 */

import { prisma } from "@/lib/db";
import { createAuditLog } from "@/lib/services/audit";
import { getCabinetProvince } from "@/lib/cabinet/get-province";
import { resolveProvince, type CabinetProvince } from "@/lib/compliance/rules";
import {
  electronicTransferRegime,
  evaluateDualControl,
  evaluateRequisitionOrder,
  evaluateSignatory,
  findMissingConfirmationFields,
  getCountersignatureDuty,
  getLedgerTransferRule,
} from "@/lib/compliance/electronic-transfer";

/** Refus motivé, portant son article et sa porte de sortie (PR-2, PR-4). */
export class TransferComplianceError extends Error {
  readonly code: string;
  readonly reference: string;

  constructor(params: { code: string; message: string; reference: string; remedy: string }) {
    super(`${params.message} (${params.reference}) ${params.remedy}`);
    this.name = "TransferComplianceError";
    this.code = params.code;
    this.reference = params.reference;
  }
}

/** Garde province : refuse d'appliquer le régime ontarien hors Ontario. */
async function assertOntarioRegime(cabinetId: string): Promise<CabinetProvince> {
  const province = resolveProvince(await getCabinetProvince(cabinetId));
  const regime = electronicTransferRegime(province);
  if (!regime.applies) {
    throw new TransferComplianceError({
      code: "REGIME_NOT_APPLICABLE",
      message:
        "Le régime des réquisitions de virement électronique ne s'applique pas à ce cabinet.",
      reference: regime.reference,
      remedy: regime.noteFr,
    });
  }
  return province;
}

/* ════════════════════════════════════════════════════════════════
   SOLDE MAXIMAL DE L'EXERCICE PRÉCÉDENT — s. 11(b)
   ════════════════════════════════════════════════════════════════ */

/**
 * Solde maximal en dépôt durant l'exercice précédent, tous comptes délégués.
 *
 * C'est le montant que la s. 11(b) impose comme plancher de cautionnement. Il se
 * calcule sur le registre append-only : on rejoue les écritures dans l'ordre et on
 * retient le point haut.
 *
 * `fiscalYearEnd` vient de `Cabinet.fiscalYearEnd` (format "MM-DD"). Sans lui, on ne
 * sait pas ce qu'est « l'exercice précédent » — c'est précisément pourquoi le champ a
 * été ajouté au chantier CH-00.
 */
export async function getMaxBalancePreviousFiscalYear(params: {
  cabinetId: string;
  trustBankAccountIds: string[];
  now?: Date;
}): Promise<{ amount: number; from: Date; to: Date } | null> {
  const now = params.now ?? new Date();
  const cabinet = await prisma.cabinet.findUnique({
    where: { id: params.cabinetId },
    select: { fiscalYearEnd: true },
  });
  if (!cabinet?.fiscalYearEnd) return null;

  const [mm, dd] = cabinet.fiscalYearEnd.split("-").map(Number);
  if (!mm || !dd) return null;

  // Fin d'exercice la plus récente antérieure à aujourd'hui.
  let end = new Date(Date.UTC(now.getUTCFullYear(), mm - 1, dd, 23, 59, 59, 999));
  if (end.getTime() > now.getTime()) {
    end = new Date(Date.UTC(now.getUTCFullYear() - 1, mm - 1, dd, 23, 59, 59, 999));
  }
  const from = new Date(Date.UTC(end.getUTCFullYear() - 1, mm - 1, dd + 1, 0, 0, 0, 0));

  // Solde d'ouverture, puis rejeu chronologique.
  const opening = await prisma.trustTransaction.aggregate({
    where: {
      cabinetId: params.cabinetId,
      trustBankAccountId: { in: params.trustBankAccountIds },
      date: { lt: from },
    },
    _sum: { amount: true },
  });

  const entries = await prisma.trustTransaction.findMany({
    where: {
      cabinetId: params.cabinetId,
      trustBankAccountId: { in: params.trustBankAccountIds },
      date: { gte: from, lte: end },
    },
    orderBy: [{ date: "asc" }, { createdAt: "asc" }],
    select: { amount: true },
  });

  let running = opening._sum.amount ?? 0;
  let max = running;
  for (const e of entries) {
    running += e.amount;
    if (running > max) max = running;
  }

  return { amount: Math.round(max * 100) / 100, from, to: end };
}

/** Cette personne peut-elle signer sur ce compte ? (s. 11(b), 12(2)4ii) */
export async function checkSignatory(params: {
  cabinetId: string;
  userId: string;
  trustBankAccountId: string;
  now?: Date;
}) {
  const now = params.now ?? new Date();
  const signatory = await prisma.trustSignatory.findUnique({
    where: {
      userId_trustBankAccountId: {
        userId: params.userId,
        trustBankAccountId: params.trustBankAccountId,
      },
    },
  });

  // Comptes sur lesquels le pouvoir de signature est délégué à cette personne : le
  // plancher de cautionnement se calcule sur l'ENSEMBLE de ces comptes, pas sur le
  // seul compte visé (« in ALL the trust accounts on which signing authority has been
  // delegated to the person »).
  const delegated = await prisma.trustSignatory.findMany({
    where: { cabinetId: params.cabinetId, userId: params.userId },
    select: { trustBankAccountId: true },
  });

  const maxBalance = await getMaxBalancePreviousFiscalYear({
    cabinetId: params.cabinetId,
    trustBankAccountIds: delegated.map((d) => d.trustBankAccountId),
    now,
  });

  return evaluateSignatory({
    isLicensee: signatory?.isLicensee ?? false,
    hasSigningAuthority: Boolean(
      signatory && (!signatory.authorizedTo || signatory.authorizedTo.getTime() >= now.getTime()),
    ),
    bondAmount: signatory?.bondAmount ?? null,
    bondExpiryDate: signatory?.bondExpiryDate ?? null,
    // À défaut d'exercice connu, on ne peut pas calculer le plancher. On retient 0
    // plutôt qu'un chiffre inventé : le manquement réel est l'absence de
    // `fiscalYearEnd`, et il est signalé ailleurs.
    maxBalancePreviousFiscalYear: maxBalance?.amount ?? 0,
    now,
  });
}

/* ════════════════════════════════════════════════════════════════
   RÉQUISITION — Formulaire 9A
   ════════════════════════════════════════════════════════════════ */

export interface CreateRequisitionParams {
  cabinetId: string;
  trustBankAccountId: string;
  signedByUserId: string;
  signedAt: Date;
  clientName: string;
  dossierRef?: string | null;
  amount: number;
  recipientName: string;
  recipientInstitution: string;
  recipientBranch?: string | null;
  recipientBranchAddress?: string | null;
  recipientAccountNumber: string;
  purpose: string;
  formType?: "9A" | "9B" | "9C";
}

/**
 * Crée la réquisition. Elle doit exister et être signée AVANT toute saisie dans le
 * système de virement (s. 12(2)4) : c'est pour cela qu'elle est un objet distinct,
 * créé en premier, et non un champ de la transaction.
 */
export async function createTransferRequisition(
  params: CreateRequisitionParams,
): Promise<{ id: string }> {
  await assertOntarioRegime(params.cabinetId);

  const signatory = await checkSignatory({
    cabinetId: params.cabinetId,
    userId: params.signedByUserId,
    trustBankAccountId: params.trustBankAccountId,
    now: params.signedAt,
  });
  if (signatory.status === "REFUSED") {
    await createAuditLog({
      cabinetId: params.cabinetId,
      userId: params.signedByUserId,
      entityType: "TrustTransaction",
      entityId: "BLOCKED",
      action: "create",
      metadata: { blocked: true, reason: signatory.code },
      newValues: { trustBankAccountId: params.trustBankAccountId, amount: params.amount },
      performedBy: params.signedByUserId,
      performedAt: new Date(),
    });
    throw new TransferComplianceError({
      code: signatory.code,
      message: signatory.messageFr,
      reference: signatory.reference,
      remedy: signatory.remedyFr,
    });
  }

  const created = await prisma.electronicTrustTransferRequisition.create({
    data: {
      cabinetId: params.cabinetId,
      trustBankAccountId: params.trustBankAccountId,
      formType: params.formType ?? "9A",
      clientName: params.clientName,
      dossierRef: params.dossierRef ?? undefined,
      amount: params.amount,
      recipientName: params.recipientName,
      recipientInstitution: params.recipientInstitution,
      recipientBranch: params.recipientBranch ?? undefined,
      recipientBranchAddress: params.recipientBranchAddress ?? undefined,
      recipientAccountNumber: params.recipientAccountNumber,
      purpose: params.purpose,
      signedByUserId: params.signedByUserId,
      signedAt: params.signedAt,
    },
    select: { id: true },
  });

  await createAuditLog({
    cabinetId: params.cabinetId,
    userId: params.signedByUserId,
    entityType: "TrustTransaction",
    entityId: created.id,
    action: "create",
    newValues: {
      type: "transfer_requisition",
      formType: params.formType ?? "9A",
      amount: params.amount,
      recipientName: params.recipientName,
    },
    performedBy: params.signedByUserId,
    performedAt: new Date(),
  });

  return created;
}

/**
 * Consigne la saisie puis l'autorisation, et vérifie le double contrôle.
 *
 * Les deux étapes sont enregistrées ensemble pour que la vérification porte sur le
 * couple, mais chacune porte sa date : c'est l'ordre par rapport à la signature de la
 * réquisition qui est contrôlé (s. 12(2)4).
 */
export async function recordTransferExecution(params: {
  cabinetId: string;
  requisitionId: string;
  dataEnteredByUserId: string;
  dataEnteredAt: Date;
  authorizedByUserId: string;
  authorizedAt: Date;
  userId: string;
}): Promise<void> {
  await assertOntarioRegime(params.cabinetId);

  const requisition = await prisma.electronicTrustTransferRequisition.findFirst({
    where: { id: params.requisitionId, cabinetId: params.cabinetId },
    select: { id: true, signedAt: true },
  });
  if (!requisition) throw new Error("Réquisition introuvable pour ce cabinet");

  // s. 12(2)4 — la réquisition doit précéder la saisie.
  const order = evaluateRequisitionOrder({
    signedAt: requisition.signedAt,
    dataEnteredAt: params.dataEnteredAt,
  });
  if (order.status === "REFUSED") {
    throw new TransferComplianceError({
      code: order.code,
      message: order.messageFr,
      reference: order.reference,
      remedy: order.remedyFr,
    });
  }

  // s. 12(3) — le praticien VÉRITABLEMENT seul : aucun autre titulaire, aucun autre
  // employé. Un avocat avec une adjointe n'en est pas un.
  const userCount = await prisma.user.count({ where: { cabinetId: params.cabinetId } });
  const isSolePractitioner = userCount === 1;

  const dual = evaluateDualControl({
    dataEnteredByUserId: params.dataEnteredByUserId,
    authorizedByUserId: params.authorizedByUserId,
    isSolePractitioner,
  });
  if (dual.status === "REFUSED") {
    await createAuditLog({
      cabinetId: params.cabinetId,
      userId: params.userId,
      entityType: "TrustTransaction",
      entityId: "BLOCKED",
      action: "update",
      metadata: { blocked: true, reason: dual.code },
      newValues: { requisitionId: params.requisitionId },
      performedBy: params.userId,
      performedAt: new Date(),
    });
    throw new TransferComplianceError({
      code: dual.code,
      message: dual.messageFr,
      reference: dual.reference,
      remedy: dual.remedyFr,
    });
  }

  await prisma.electronicTrustTransferRequisition.update({
    where: { id: params.requisitionId },
    data: {
      dataEnteredByUserId: params.dataEnteredByUserId,
      dataEnteredAt: params.dataEnteredAt,
      authorizedByUserId: params.authorizedByUserId,
      authorizedAt: params.authorizedAt,
      solePractitionerExemption: dual.reason === "sole_practitioner_exemption",
    },
  });

  await createAuditLog({
    cabinetId: params.cabinetId,
    userId: params.userId,
    entityType: "TrustTransaction",
    entityId: params.requisitionId,
    action: "update",
    newValues: {
      type: "transfer_executed",
      dualControl: dual.reason,
      // L'exemption du praticien seul est consignée comme telle : à l'inspection,
      // elle doit être assumée, pas découverte.
      solePractitionerExemption: dual.reason === "sole_practitioner_exemption",
    },
    performedBy: params.userId,
    performedAt: new Date(),
  });
}

/**
 * Enregistre la confirmation de l'institution et ouvre l'échéance de contresignature.
 *
 * Les éléments manquants sont SIGNALÉS, pas bloquants : la confirmation vient de la
 * banque, le cabinet ne la fabrique pas. Refuser de l'enregistrer parce qu'elle est
 * incomplète priverait le dossier de la seule preuve disponible.
 */
export async function recordTransferConfirmation(params: {
  cabinetId: string;
  requisitionId: string;
  confirmation: {
    documentId?: string | null;
    sourceAccountNumber?: string | null;
    recipientInstitution?: string | null;
    recipientName?: string | null;
    recipientAccountNumber?: string | null;
    institutionReceivedAt?: Date | null;
    confirmationSentAt: Date;
  };
  isBankingDay?: (d: Date) => boolean;
  userId: string;
}): Promise<{ missingFields: string[]; countersignDueAt: Date }> {
  await assertOntarioRegime(params.cabinetId);

  const c = params.confirmation;
  const missing = findMissingConfirmationFields({
    sourceAccountNumber: c.sourceAccountNumber,
    recipientInstitution: c.recipientInstitution,
    recipientName: c.recipientName,
    recipientAccountNumber: c.recipientAccountNumber,
    institutionReceivedAt: c.institutionReceivedAt,
    confirmationSentAt: c.confirmationSentAt,
  });

  const duty = getCountersignatureDuty({
    confirmationSentAt: c.confirmationSentAt,
    isBankingDay: params.isBankingDay,
  });

  await prisma.electronicTrustTransferRequisition.updateMany({
    where: { id: params.requisitionId, cabinetId: params.cabinetId },
    data: {
      confirmationDocumentId: c.documentId ?? undefined,
      confirmationReceivedAt: new Date(),
      confirmationSourceAccount: c.sourceAccountNumber ?? undefined,
      confirmationRecipientInstitution: c.recipientInstitution ?? undefined,
      confirmationRecipientName: c.recipientName ?? undefined,
      confirmationRecipientAccount: c.recipientAccountNumber ?? undefined,
      confirmationInstitutionReceivedAt: c.institutionReceivedAt ?? undefined,
      confirmationSentAt: c.confirmationSentAt,
      countersignDueAt: duty.dueAt,
    },
  });

  await createAuditLog({
    cabinetId: params.cabinetId,
    userId: params.userId,
    entityType: "TrustTransaction",
    entityId: params.requisitionId,
    action: "update",
    newValues: {
      type: "transfer_confirmation",
      missingFields: missing.map((f) => f.key),
      countersignDueAt: duty.dueAt.toISOString(),
    },
    performedBy: params.userId,
    performedAt: new Date(),
  });

  return { missingFields: missing.map((f) => f.key), countersignDueAt: duty.dueAt };
}

/** Les quatre gestes de la s. 12(5) : imprimer, comparer, annoter, signer et dater. */
export async function countersignTransferConfirmation(params: {
  cabinetId: string;
  requisitionId: string;
  countersignedByUserId: string;
  countersignedAt: Date;
  annotatedClientId: string;
  annotatedDossierId?: string | null;
}): Promise<void> {
  await assertOntarioRegime(params.cabinetId);

  await prisma.electronicTrustTransferRequisition.updateMany({
    where: { id: params.requisitionId, cabinetId: params.cabinetId },
    data: {
      printedAt: params.countersignedAt,
      comparedAt: params.countersignedAt,
      annotatedClientId: params.annotatedClientId,
      annotatedDossierId: params.annotatedDossierId ?? undefined,
      countersignedByUserId: params.countersignedByUserId,
      countersignedAt: params.countersignedAt,
    },
  });

  await createAuditLog({
    cabinetId: params.cabinetId,
    userId: params.countersignedByUserId,
    entityType: "TrustTransaction",
    entityId: params.requisitionId,
    action: "update",
    newValues: { type: "transfer_countersigned", at: params.countersignedAt.toISOString() },
    performedBy: params.countersignedByUserId,
    performedAt: new Date(),
  });
}

/** Réquisitions dont la contresignature de la s. 12(5) est due ou en retard. */
export async function getPendingCountersignatures(params: { cabinetId: string; now?: Date }) {
  const now = params.now ?? new Date();
  const rows = await prisma.electronicTrustTransferRequisition.findMany({
    where: {
      cabinetId: params.cabinetId,
      confirmationSentAt: { not: null },
      countersignedAt: null,
    },
    orderBy: { countersignDueAt: "asc" },
  });

  return rows.map((r) => ({
    id: r.id,
    amount: r.amount,
    clientName: r.clientName,
    recipientName: r.recipientName,
    dueAt: r.countersignDueAt,
    overdue: r.countersignDueAt ? now.getTime() > r.countersignDueAt.getTime() : false,
  }));
}

/* ════════════════════════════════════════════════════════════════
   TRANSFERT ENTRE CARTES-CLIENTS — s. 18(4) / art. 56(3)
   ════════════════════════════════════════════════════════════════ */

/**
 * Enregistre un transfert entre cartes-clients.
 *
 * SAFE les interdisait de façon absolue. C'est plus strict que les deux règlements :
 * la s. 18(4) en exige le REGISTRE, donc les suppose, et l'art. 56(3) permet le
 * transfert direct vers un autre compte en fidéicommis. Le sur-blocage poussait au
 * contournement par un retrait suivi d'un dépôt, deux opérations qui cassent le lien
 * et rendent le registre de la s. 18(4) impossible à produire.
 *
 * Le contrôle qui compte est donc l'OBJET, pas l'interdiction : « explaining the
 * purpose for which each transfer is made ».
 */
export async function recordClientLedgerTransfer(params: {
  cabinetId: string;
  trustBankAccountId: string;
  date: Date;
  amount: number;
  fromClientId: string;
  fromDossierId?: string | null;
  toClientId: string;
  toDossierId?: string | null;
  purpose: string;
  userId: string;
}): Promise<{ id: string }> {
  const province = resolveProvince(await getCabinetProvince(params.cabinetId));
  const rule = getLedgerTransferRule(province);

  if (rule.purposeRequired && !params.purpose.trim()) {
    throw new TransferComplianceError({
      code: "TRANSFER_PURPOSE_REQUIRED",
      message: "L'objet du transfert entre cartes-clients est obligatoire.",
      reference: rule.reference,
      remedy: rule.noteFr,
    });
  }

  if (params.amount <= 0) {
    throw new Error("Le montant du transfert doit être strictement positif");
  }

  // Un transfert vers la même carte-client n'est pas un transfert.
  if (
    params.fromClientId === params.toClientId &&
    (params.fromDossierId ?? null) === (params.toDossierId ?? null)
  ) {
    throw new TransferComplianceError({
      code: "TRANSFER_SAME_LEDGER",
      message: "La carte-client de départ et celle d'arrivée sont identiques.",
      reference: rule.reference,
      remedy: "Choisissez deux cartes-clients distinctes.",
    });
  }

  const created = await prisma.clientLedgerTransfer.create({
    data: {
      cabinetId: params.cabinetId,
      trustBankAccountId: params.trustBankAccountId,
      date: params.date,
      amount: params.amount,
      fromClientId: params.fromClientId,
      fromDossierId: params.fromDossierId ?? undefined,
      toClientId: params.toClientId,
      toDossierId: params.toDossierId ?? undefined,
      purpose: params.purpose.trim(),
      createdById: params.userId,
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
      type: "client_ledger_transfer",
      amount: params.amount,
      fromClientId: params.fromClientId,
      toClientId: params.toClientId,
      purpose: params.purpose,
    },
    performedBy: params.userId,
    performedAt: new Date(),
  });

  return created;
}

/* ════════════════════════════════════════════════════════════════
   FRAIS DE RENVOI — s. 19.1
   ════════════════════════════════════════════════════════════════ */

/** Consigne un frais de renvoi reçu ou payé. Ontario seulement. */
export async function recordReferralFee(params: {
  cabinetId: string;
  direction: "RECEIVED" | "PAID";
  date: Date;
  method: string;
  amount: number;
  counterpartyLicensee: string;
  clientId?: string | null;
  documentIdentifier?: string | null;
  agreementDocumentId?: string | null;
  userId: string;
}): Promise<{ id: string }> {
  const province = resolveProvince(await getCabinetProvince(params.cabinetId));
  if (province !== "ON") {
    throw new TransferComplianceError({
      code: "REFERRAL_REGISTER_NOT_APPLICABLE",
      message: "Le registre des frais de renvoi est propre au régime ontarien.",
      reference: "By-Law 9, s. 19.1",
      remedy: "B-1 r.5 ne traite pas des frais de renvoi. Aucun registre distinct n'est exigé au Québec.",
    });
  }

  // s. 19.1(2) : le mode ET l'identifiant du document sont exigés pour un frais PAYÉ.
  // Pour un frais REÇU, la s. 19.1(1) n'exige que le mode.
  if (params.direction === "PAID" && !params.documentIdentifier?.trim()) {
    throw new TransferComplianceError({
      code: "REFERRAL_DOCUMENT_IDENTIFIER_REQUIRED",
      message: "L'identifiant du document utilisé pour payer le frais de renvoi est exigé.",
      reference: "By-Law 9, s. 19.1(2)",
      remedy: "Indiquez le numéro de chèque ou l'identifiant du document de paiement.",
    });
  }

  const created = await prisma.referralFee.create({
    data: {
      cabinetId: params.cabinetId,
      direction: params.direction,
      date: params.date,
      method: params.method,
      amount: params.amount,
      counterpartyLicensee: params.counterpartyLicensee,
      clientId: params.clientId ?? undefined,
      documentIdentifier: params.documentIdentifier ?? undefined,
      agreementDocumentId: params.agreementDocumentId ?? undefined,
    },
    select: { id: true },
  });

  await createAuditLog({
    cabinetId: params.cabinetId,
    userId: params.userId,
    entityType: "TrustTransaction",
    entityId: created.id,
    action: "create",
    newValues: { type: "referral_fee", direction: params.direction, amount: params.amount },
    performedBy: params.userId,
    performedAt: new Date(),
  });

  return created;
}
