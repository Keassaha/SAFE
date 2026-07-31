/**
 * Pièces justificatives des opérations en fidéicommis.
 *
 * Art. 32 B-1 r.5 : conservation d'au moins 7 ans après la fin de l'exercice de
 * « toutes les pièces justificatives ou de contrôle relatives aux inscriptions dans
 * les journaux et registres », nommément les copies de reçus émis, les relevés
 * d'institutions financières, les copies de chèques compensés, les bordereaux de
 * dépôt détaillés et les documents confirmant les virements électroniques — plus,
 * à l'art. 32(2), « une copie de tout chèque ou autre ordre de paiement reçu en
 * fidéicommis ».
 *
 * s. 18(10) By-Law 9 : « Bank statements or pass books, cashed cheques and detailed
 * duplicate deposit slips for all trust and general accounts. »
 *
 * DOCTRINE PR-8 — ce module SIGNALE, il ne bloque jamais. Refuser un dépôt parce que
 * le bordereau n'est pas encore scanné pousserait l'utilisateur à ne pas enregistrer
 * l'opération, ce qui est infiniment pire : une opération non consignée est invisible
 * au rapprochement, alors qu'une pièce manquante est une ligne dans une liste.
 */

import { prisma } from "@/lib/db";
import { createAuditLog } from "@/lib/services/audit";
import { getCabinetProvince } from "@/lib/cabinet/get-province";
import { resolveProvince, type CabinetProvince } from "@/lib/compliance/rules";
import {
  findMissingDocuments,
  getExpectedDocuments,
  type ExpectedDocument,
  type SupportingDocumentRole,
  type TrustEntryDirection,
} from "@/lib/compliance/trust-records";

/** Rattache une pièce déjà stockée à une opération en fidéicommis. */
export async function attachSupportingDocument(params: {
  cabinetId: string;
  trustTransactionId: string;
  documentId: string;
  role: SupportingDocumentRole;
  userId?: string | null;
}): Promise<{ id: string }> {
  // Vérification d'appartenance : une pièce d'un autre cabinet ne doit jamais se
  // retrouver au dossier de celui-ci.
  const [tx, doc] = await Promise.all([
    prisma.trustTransaction.findFirst({
      where: { id: params.trustTransactionId, cabinetId: params.cabinetId },
      select: { id: true },
    }),
    prisma.document.findFirst({
      where: { id: params.documentId, cabinetId: params.cabinetId },
      select: { id: true },
    }),
  ]);
  if (!tx) throw new Error("Opération en fidéicommis introuvable pour ce cabinet");
  if (!doc) throw new Error("Pièce introuvable pour ce cabinet");

  const link = await prisma.trustTransactionDocument.upsert({
    where: {
      trustTransactionId_documentId_role: {
        trustTransactionId: params.trustTransactionId,
        documentId: params.documentId,
        role: params.role,
      },
    },
    create: {
      trustTransactionId: params.trustTransactionId,
      documentId: params.documentId,
      role: params.role,
    },
    update: {},
    select: { id: true },
  });

  await createAuditLog({
    cabinetId: params.cabinetId,
    userId: params.userId ?? undefined,
    entityType: "TrustTransaction",
    entityId: params.trustTransactionId,
    action: "update",
    newValues: { type: "supporting_document_attached", role: params.role, documentId: params.documentId },
    performedBy: params.userId ?? undefined,
    performedAt: new Date(),
  });

  return link;
}

export interface TransactionDocumentStatus {
  trustTransactionId: string;
  date: Date;
  amount: number;
  direction: TrustEntryDirection;
  modePaiement: string | null;
  expected: ExpectedDocument[];
  attachedRoles: SupportingDocumentRole[];
  missing: ExpectedDocument[];
}

/** État des pièces d'une opération : attendues, présentes, manquantes. */
export async function getTransactionDocumentStatus(params: {
  cabinetId: string;
  trustTransactionId: string;
  province?: CabinetProvince;
}): Promise<TransactionDocumentStatus> {
  const tx = await prisma.trustTransaction.findFirst({
    where: { id: params.trustTransactionId, cabinetId: params.cabinetId },
    select: {
      id: true,
      date: true,
      amount: true,
      modePaiement: true,
      supportingDocuments: { select: { role: true } },
    },
  });
  if (!tx) throw new Error("Opération en fidéicommis introuvable pour ce cabinet");

  const province =
    params.province ?? resolveProvince(await getCabinetProvince(params.cabinetId));
  const direction: TrustEntryDirection = tx.amount >= 0 ? "RECEIPT" : "DISBURSEMENT";
  const expected = getExpectedDocuments(direction, tx.modePaiement, province);
  const attachedRoles = tx.supportingDocuments.map((d) => d.role as SupportingDocumentRole);

  return {
    trustTransactionId: tx.id,
    date: tx.date,
    amount: tx.amount,
    direction,
    modePaiement: tx.modePaiement,
    expected,
    attachedRoles,
    missing: findMissingDocuments(expected, attachedRoles),
  };
}

export interface MissingDocumentsReport {
  province: CabinetProvince;
  periodFrom: Date;
  periodTo: Date;
  /** Opérations dont au moins une pièce attendue manque. */
  lines: Array<{
    trustTransactionId: string;
    date: Date;
    amount: number;
    modePaiement: string | null;
    clientId: string;
    dossierId: string | null;
    missing: ExpectedDocument[];
  }>;
  /** Nombre d'opérations examinées sur la période. */
  totalExamined: number;
}

/**
 * Pièces manquantes sur une période.
 *
 * Destiné à figurer en tête du rapport comptable mensuel (CH-03) : un inspecteur qui
 * pointe une opération et demande le bordereau doit trouver la réponse. Ce rapport
 * dit au cabinet, avant l'inspection, exactement ce qu'il ne pourra pas produire.
 */
export async function buildMissingDocumentsReport(params: {
  cabinetId: string;
  trustBankAccountId?: string | null;
  periodFrom: Date;
  periodTo: Date;
  province?: CabinetProvince;
}): Promise<MissingDocumentsReport> {
  const province =
    params.province ?? resolveProvince(await getCabinetProvince(params.cabinetId));

  const transactions = await prisma.trustTransaction.findMany({
    where: {
      cabinetId: params.cabinetId,
      ...(params.trustBankAccountId ? { trustBankAccountId: params.trustBankAccountId } : {}),
      date: { gte: params.periodFrom, lte: params.periodTo },
    },
    orderBy: { date: "asc" },
    select: {
      id: true,
      date: true,
      amount: true,
      modePaiement: true,
      clientId: true,
      dossierId: true,
      supportingDocuments: { select: { role: true } },
    },
  });

  const lines: MissingDocumentsReport["lines"] = [];
  for (const tx of transactions) {
    const direction: TrustEntryDirection = tx.amount >= 0 ? "RECEIPT" : "DISBURSEMENT";
    const expected = getExpectedDocuments(direction, tx.modePaiement, province);
    if (expected.length === 0) continue;
    const missing = findMissingDocuments(
      expected,
      tx.supportingDocuments.map((d) => d.role as SupportingDocumentRole),
    );
    if (missing.length === 0) continue;
    lines.push({
      trustTransactionId: tx.id,
      date: tx.date,
      amount: tx.amount,
      modePaiement: tx.modePaiement,
      clientId: tx.clientId,
      dossierId: tx.dossierId,
      missing,
    });
  }

  return {
    province,
    periodFrom: params.periodFrom,
    periodTo: params.periodTo,
    lines,
    totalExamined: transactions.length,
  };
}
