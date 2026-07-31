/**
 * Registre des chèques tirés sur un compte en fidéicommis.
 *
 * Art. 61 B-1 r.5 : les chèques « doivent être NUMÉROTÉS CONSÉCUTIVEMENT ».
 * Art. 57 al. 2 : jamais payables au porteur, à l'ordre de « caisse » ou « cash »,
 * jamais faits en blanc. s. 11(a) By-Law 9 : idem.
 * Art. 41(2) : le rapport comptable mensuel exige la liste des chèques EN CIRCULATION,
 * avec pour chacun le montant, la date d'émission, le numéro, le nom du client et le
 * numéro de dossier.
 *
 * C'est cette dernière obligation qui rend le registre indispensable : sans lui, la
 * liste se réduisait à un nombre saisi à la main, ce qu'elle était effectivement.
 */

import { prisma } from "@/lib/db";
import { createAuditLog } from "@/lib/services/audit";
import { getCabinetProvince } from "@/lib/cabinet/get-province";
import { resolveProvince, type CabinetProvince } from "@/lib/compliance/rules";
import {
  checkChequePayee,
  findChequeSequenceGaps,
  isChequeStale,
} from "@/lib/compliance/trust-records";

/** Refus motivé, portant son article et sa porte de sortie (PR-2, PR-4). */
export class TrustChequeInvalidError extends Error {
  readonly code: "PAYEE_BLANK" | "PAYEE_TO_CASH_OR_BEARER" | "CHEQUE_NUMBER_ALREADY_USED";
  readonly reference: string;

  constructor(params: {
    code: "PAYEE_BLANK" | "PAYEE_TO_CASH_OR_BEARER" | "CHEQUE_NUMBER_ALREADY_USED";
    message: string;
    reference: string;
    remedy: string;
  }) {
    super(`${params.message} (${params.reference}) ${params.remedy}`);
    this.name = "TrustChequeInvalidError";
    this.code = params.code;
    this.reference = params.reference;
  }
}

export interface RegisterChequeParams {
  cabinetId: string;
  trustBankAccountId: string;
  chequeNumber: number;
  issueDate: Date;
  payeeName: string;
  amount: number;
  clientId?: string | null;
  dossierId?: string | null;
  trustTransactionId?: string | null;
  signedById?: string | null;
  userId?: string | null;
}

/**
 * Inscrit un chèque au registre.
 *
 * Deux refus, tous deux fondés sur un article :
 *   1. bénéficiaire au porteur, à « caisse »/« cash », ou en blanc (art. 57 al. 2) ;
 *   2. numéro déjà utilisé sur ce compte — la numérotation consécutive de l'art. 61
 *      suppose l'unicité, et un doublon rendrait la liste de l'art. 41(2) fausse.
 */
export async function registerTrustCheque(
  params: RegisterChequeParams,
): Promise<{ id: string; sequenceGaps: number[] }> {
  const province = resolveProvince(await getCabinetProvince(params.cabinetId));

  const payee = checkChequePayee(params.payeeName, province);
  if (!payee.valid) {
    await createAuditLog({
      cabinetId: params.cabinetId,
      userId: params.userId ?? undefined,
      entityType: "TrustTransaction",
      entityId: "BLOCKED",
      action: "create",
      metadata: { blocked: true, reason: payee.code },
      newValues: { payeeName: params.payeeName, chequeNumber: params.chequeNumber },
      performedBy: params.userId ?? undefined,
      performedAt: new Date(),
    });
    throw new TrustChequeInvalidError({
      code: payee.code!,
      message: (province === "QC" ? payee.messageFr : payee.messageEn) ?? "Bénéficiaire non admis.",
      reference: payee.reference,
      remedy:
        province === "QC"
          ? "Indiquez le nom de la personne ou de l'organisme à qui le chèque est destiné."
          : "Enter the name of the person or entity the cheque is payable to.",
    });
  }

  const existing = await prisma.trustCheque.findUnique({
    where: {
      trustBankAccountId_chequeNumber: {
        trustBankAccountId: params.trustBankAccountId,
        chequeNumber: params.chequeNumber,
      },
    },
    select: { id: true, payeeName: true, issueDate: true },
  });
  if (existing) {
    throw new TrustChequeInvalidError({
      code: "CHEQUE_NUMBER_ALREADY_USED",
      message: `Le chèque n° ${params.chequeNumber} existe déjà sur ce compte (${existing.payeeName}, ${existing.issueDate.toISOString().slice(0, 10)}).`,
      reference: province === "QC" ? "B-1 r.5, art. 61" : "By-Law 9, s. 18(2)",
      remedy: "Vérifiez le numéro inscrit sur le chèque, ou annulez le chèque existant.",
    });
  }

  const cheque = await prisma.trustCheque.create({
    data: {
      cabinetId: params.cabinetId,
      trustBankAccountId: params.trustBankAccountId,
      chequeNumber: params.chequeNumber,
      issueDate: params.issueDate,
      payeeName: params.payeeName.trim(),
      amount: params.amount,
      clientId: params.clientId ?? undefined,
      dossierId: params.dossierId ?? undefined,
      trustTransactionId: params.trustTransactionId ?? undefined,
      signedById: params.signedById ?? undefined,
    },
    select: { id: true },
  });

  await createAuditLog({
    cabinetId: params.cabinetId,
    userId: params.userId ?? undefined,
    entityType: "TrustTransaction",
    entityId: cheque.id,
    action: "create",
    newValues: {
      type: "trust_cheque",
      chequeNumber: params.chequeNumber,
      payeeName: params.payeeName,
      amount: params.amount,
    },
    performedBy: params.userId ?? undefined,
    performedAt: new Date(),
  });

  return { id: cheque.id, sequenceGaps: await getChequeSequenceGaps(params.trustBankAccountId) };
}

/**
 * Annule un chèque. Il est CONSERVÉ, jamais supprimé : un trou dans la séquence est
 * exactement ce qu'un inspecteur cherche, et un chèque annulé compte dans la
 * numérotation consécutive de l'art. 61.
 */
export async function voidTrustCheque(params: {
  cabinetId: string;
  chequeId: string;
  reason: string;
  userId?: string | null;
}): Promise<void> {
  await prisma.trustCheque.updateMany({
    where: { id: params.chequeId, cabinetId: params.cabinetId, voidedAt: null },
    data: { status: "VOIDED", voidedAt: new Date(), voidReason: params.reason },
  });

  await createAuditLog({
    cabinetId: params.cabinetId,
    userId: params.userId ?? undefined,
    entityType: "TrustTransaction",
    entityId: params.chequeId,
    action: "update",
    newValues: { type: "trust_cheque_voided", reason: params.reason },
    performedBy: params.userId ?? undefined,
    performedAt: new Date(),
  });
}

/** Trous dans la numérotation d'un compte (art. 61). */
export async function getChequeSequenceGaps(trustBankAccountId: string): Promise<number[]> {
  const cheques = await prisma.trustCheque.findMany({
    where: { trustBankAccountId },
    select: { chequeNumber: true },
  });
  return findChequeSequenceGaps(cheques.map((c) => c.chequeNumber));
}

/**
 * Chèques en circulation à une date donnée — la liste de l'art. 41(2).
 *
 * Alimente directement le rapport comptable mensuel : montant, date d'émission,
 * numéro, client et dossier, exactement les champs énumérés par le texte.
 */
export async function getOutstandingCheques(params: {
  cabinetId: string;
  trustBankAccountId?: string | null;
  asOf: Date;
}) {
  const cheques = await prisma.trustCheque.findMany({
    where: {
      cabinetId: params.cabinetId,
      ...(params.trustBankAccountId ? { trustBankAccountId: params.trustBankAccountId } : {}),
      status: { in: ["ISSUED", "STALE"] },
      issueDate: { lte: params.asOf },
    },
    orderBy: { chequeNumber: "asc" },
    include: {
      trustBankAccount: { select: { accountLabel: true } },
    },
  });

  return cheques.map((c) => ({
    id: c.id,
    chequeNumber: c.chequeNumber,
    issueDate: c.issueDate,
    amount: c.amount,
    payeeName: c.payeeName,
    clientId: c.clientId,
    dossierId: c.dossierId,
    accountLabel: c.trustBankAccount.accountLabel,
    /** Signalé, jamais bloquant : le seuil de six mois vient de la pratique
     *  bancaire, pas du règlement. */
    stale: isChequeStale(c.issueDate, params.asOf),
  }));
}

/** Total des chèques en circulation, pour le rapprochement. */
export async function getOutstandingChequesTotal(params: {
  cabinetId: string;
  trustBankAccountId?: string | null;
  asOf: Date;
}): Promise<number> {
  const list = await getOutstandingCheques(params);
  return Math.round(list.reduce((s, c) => s + c.amount, 0) * 100) / 100;
}

/** Marque compensés les chèques dont la banque a confirmé le paiement. */
export async function markChequesCleared(params: {
  cabinetId: string;
  chequeIds: string[];
  clearedAt: Date;
  userId?: string | null;
}): Promise<number> {
  const result = await prisma.trustCheque.updateMany({
    where: { id: { in: params.chequeIds }, cabinetId: params.cabinetId, status: "ISSUED" },
    data: { status: "CLEARED", clearedAt: params.clearedAt },
  });
  return result.count;
}

/** Province, exposée pour les surfaces qui affichent une référence d'article. */
export async function getChequeRegisterProvince(cabinetId: string): Promise<CabinetProvince> {
  return resolveProvince(await getCabinetProvince(cabinetId));
}
