/**
 * Comptes bancaires en fidéicommis — ouverture, fermeture, soldes.
 *
 * Doctrine PR-6 : **l'ouverture d'un compte en fidéicommis est un acte explicite**.
 * Avant CH-01, un « compte » naissait par effet de bord du premier dépôt
 * (`getOrCreateTrustAccount`). Or ouvrir un compte général est un acte réglementé :
 * choix d'une institution ayant une entente avec le Barreau, succursale québécoise,
 * libellé portant la mention « en fidéicommis », formulaire prescrit transmis sans
 * délai au Barreau et à l'institution (art. 50, 51 QC). Rien de cela ne peut se
 * déduire d'un montant saisi dans un formulaire de dépôt.
 *
 * `TrustAccount` reste ce qu'il a toujours été : la carte-client, c'est-à-dire le
 * sous-compte d'un client pour un dossier. Les deux entités coexistent, elles ne se
 * remplacent pas.
 */

import { prisma } from "@/lib/db";
import { createAuditLog } from "@/lib/services/audit";
import { getCabinetProvince } from "@/lib/cabinet/get-province";
import { resolveProvince, type CabinetProvince } from "@/lib/compliance/rules";
import {
  accountNumberLast4,
  blockingViolations,
  defaultInterestBeneficiary,
  getPostOpeningDuties,
  validateTrustBankAccount,
  type TrustBankAccountType,
  type TrustBankAccountViolation,
} from "@/lib/compliance/trust-bank-account";

/** Refus d'ouverture. Porte la liste complète des manquements (PR-2). */
export class TrustBankAccountInvalidError extends Error {
  readonly code = "TRUST_BANK_ACCOUNT_INVALID" as const;
  readonly violations: TrustBankAccountViolation[];

  constructor(violations: TrustBankAccountViolation[], locale: "fr" | "en") {
    const lines = violations.map(
      (v) => `${locale === "fr" ? v.messageFr : v.messageEn} (${v.reference})`,
    );
    super(lines.join(" "));
    this.name = "TrustBankAccountInvalidError";
    this.violations = violations;
  }

  toJSON() {
    return { code: this.code, violations: this.violations };
  }
}

export interface OpenTrustBankAccountParams {
  cabinetId: string;
  userId: string;
  type?: TrustBankAccountType;
  accountLabel: string;
  institutionName: string;
  institutionBranch?: string | null;
  branchAddress?: string | null;
  branchProvince?: string | null;
  accountNumber: string;
  currency?: string;
  barreauAgreementConfirmed?: boolean;
  /** Comptes particuliers seulement (art. 62 QC). */
  clientId?: string | null;
  dossierId?: string | null;
  initialDeposit?: number | null;
  openedAt?: Date;
}

/**
 * Ouvre un compte bancaire en fidéicommis.
 *
 * Les manquements BLOQUANTS empêchent l'ouverture. Les manquements non bloquants
 * (entente B-1 r.10 non confirmée, succursale hors Québec) sont renvoyés à
 * l'appelant pour affichage : ce sont des démarches qui prennent des jours, les
 * rendre bloquantes empêcherait de saisir un compte qui existe déjà à la banque.
 */
export async function openTrustBankAccount(params: OpenTrustBankAccountParams): Promise<{
  id: string;
  warnings: TrustBankAccountViolation[];
}> {
  const province = resolveProvince(await getCabinetProvince(params.cabinetId));
  const type = params.type ?? "GENERAL";
  const openedAt = params.openedAt ?? new Date();

  const violations = validateTrustBankAccount(province, {
    type,
    accountLabel: params.accountLabel,
    institutionName: params.institutionName,
    branchProvince: params.branchProvince,
    accountNumber: params.accountNumber,
    barreauAgreementConfirmed: params.barreauAgreementConfirmed,
    clientId: params.clientId,
    openedAt,
  });

  const blocking = blockingViolations(violations);
  if (blocking.length > 0) {
    await createAuditLog({
      cabinetId: params.cabinetId,
      userId: params.userId,
      entityType: "TrustAccount",
      entityId: "BLOCKED",
      action: "create",
      metadata: { blocked: true, reason: "TRUST_BANK_ACCOUNT_INVALID" },
      newValues: { codes: blocking.map((b) => b.code), accountLabel: params.accountLabel },
      performedBy: params.userId,
      performedAt: new Date(),
    });
    throw new TrustBankAccountInvalidError(blocking, province === "QC" ? "fr" : "en");
  }

  const account = await prisma.trustBankAccount.create({
    data: {
      cabinetId: params.cabinetId,
      type,
      accountLabel: params.accountLabel.trim(),
      institutionName: params.institutionName.trim(),
      institutionBranch: params.institutionBranch ?? undefined,
      branchAddress: params.branchAddress ?? undefined,
      branchProvince: params.branchProvince ?? (province === "QC" ? "QC" : undefined),
      accountNumber: params.accountNumber.trim(),
      accountNumberLast4: accountNumberLast4(params.accountNumber),
      currency: params.currency ?? "CAD",
      barreauAgreementConfirmed: params.barreauAgreementConfirmed ?? false,
      clientId: params.clientId ?? undefined,
      dossierId: params.dossierId ?? undefined,
      initialDeposit: params.initialDeposit ?? undefined,
      interestBeneficiary: defaultInterestBeneficiary(province, type),
      openedAt,
    },
    select: { id: true },
  });

  await createAuditLog({
    cabinetId: params.cabinetId,
    userId: params.userId,
    entityType: "TrustAccount",
    entityId: account.id,
    action: "create",
    newValues: {
      type: "trust_bank_account",
      accountLabel: params.accountLabel,
      institutionName: params.institutionName,
      last4: accountNumberLast4(params.accountNumber),
      province,
    },
    performedBy: params.userId,
    performedAt: new Date(),
  });

  return { id: account.id, warnings: violations.filter((v) => !v.blocking) };
}

/**
 * Consigne une démarche post-ouverture accomplie.
 *
 * ⚠️ CE QUE CETTE FONCTION CORRIGE. `getPostOpeningDuties` LISAIT
 * `regulatorNotifiedAt` et `clientCopySentAt` depuis le premier jour, mais rien au
 * dépôt ne les ÉCRIVAIT. Les deux obligations de l'art. 51 et de l'art. 64 restaient
 * donc « à faire » pour toujours, quoi que le cabinet accomplisse.
 *
 * C'est le motif que le programme combat partout : une exigence sans porte de sortie
 * (PR-2). Une case qu'on ne peut jamais cocher finit par être ignorée, et l'écran
 * entier avec elle.
 *
 * SAFE NE TRANSMET RIEN. Le formulaire est prescrit par le Barreau, SAFE ne l'a pas
 * obtenu (dépendance E-1), et l'envoi est l'acte de l'avocate. La fonction consigne
 * la date qu'elle déclare, et la pièce quand elle en joint une (PR-8).
 */
export async function recordPostOpeningDuty(params: {
  cabinetId: string;
  accountId: string;
  duty: "REGULATOR_FORM_SENT" | "CLIENT_COPY_SENT";
  at: Date;
  documentId?: string | null;
  userId: string;
}): Promise<void> {
  const account = await prisma.trustBankAccount.findFirst({
    where: { id: params.accountId, cabinetId: params.cabinetId },
    select: { id: true, type: true },
  });
  if (!account) throw new Error("Compte introuvable pour ce cabinet");

  // L'art. 64 ne vise que le compte particulier : la copie au client n'existe pas
  // pour un compte général, et l'accepter inventerait une obligation.
  if (params.duty === "CLIENT_COPY_SENT" && account.type !== "PARTICULIER") {
    throw new Error(
      "La remise d'un exemplaire au client ne concerne que le compte particulier (B-1 r.5, art. 64).",
    );
  }

  await prisma.trustBankAccount.update({
    where: { id: account.id },
    data:
      params.duty === "REGULATOR_FORM_SENT"
        ? {
            regulatorNotifiedAt: params.at,
            regulatorFormDocumentId: params.documentId ?? undefined,
          }
        : { clientCopySentAt: params.at },
  });

  await createAuditLog({
    cabinetId: params.cabinetId,
    userId: params.userId,
    entityType: "TrustAccount",
    entityId: account.id,
    action: "update",
    newValues: {
      type: "trust_bank_account_duty",
      duty: params.duty,
      at: params.at.toISOString(),
      reference: account.type === "PARTICULIER" ? "B-1 r.5, art. 64" : "B-1 r.5, art. 51",
    },
    performedBy: params.userId,
    performedAt: new Date(),
  });
}

/**
 * Confirme après coup que l'institution a conclu l'entente B-1 r.10.
 *
 * L'information manque souvent le jour de l'ouverture : c'est une démarche de
 * plusieurs jours auprès de la banque. La rendre bloquante empêcherait de saisir un
 * compte qui existe déjà, ce qui pousserait à ne rien saisir du tout.
 */
export async function confirmBarreauAgreement(params: {
  cabinetId: string;
  accountId: string;
  confirmed: boolean;
  userId: string;
}): Promise<void> {
  await prisma.trustBankAccount.updateMany({
    where: { id: params.accountId, cabinetId: params.cabinetId },
    data: { barreauAgreementConfirmed: params.confirmed },
  });

  await createAuditLog({
    cabinetId: params.cabinetId,
    userId: params.userId,
    entityType: "TrustAccount",
    entityId: params.accountId,
    action: "update",
    newValues: {
      type: "barreau_agreement",
      confirmed: params.confirmed,
      reference: "B-1 r.5, art. 50",
    },
    performedBy: params.userId,
    performedAt: new Date(),
  });
}

/**
 * Ferme un compte. Le compte n'est JAMAIS supprimé : l'art. 42(7) QC exige la liste
 * des comptes fermés durant la période au rapport annuel.
 *
 * Art. 67 QC : le solde d'un compte particulier doit être viré au compte général
 * « sans délai » lorsqu'il n'est plus requis. On refuse donc de fermer un compte qui
 * détient encore des fonds : la fermeture masquerait de l'argent client.
 */
export async function closeTrustBankAccount(params: {
  cabinetId: string;
  accountId: string;
  userId: string;
  reason: string;
  closedAt?: Date;
}): Promise<void> {
  const balance = await getTrustBankAccountBalance(params.cabinetId, params.accountId);
  if (Math.abs(balance) > 0.005) {
    throw new Error(
      `Impossible de fermer ce compte : il détient encore ${balance.toFixed(2)} $. ` +
        "Virez le solde avant de fermer (B-1 r.5, art. 67 pour un compte particulier).",
    );
  }

  await prisma.trustBankAccount.updateMany({
    where: { id: params.accountId, cabinetId: params.cabinetId, closedAt: null },
    data: { closedAt: params.closedAt ?? new Date(), closureReason: params.reason },
  });

  await createAuditLog({
    cabinetId: params.cabinetId,
    userId: params.userId,
    entityType: "TrustAccount",
    entityId: params.accountId,
    action: "update",
    newValues: { type: "trust_bank_account_closed", reason: params.reason },
    performedBy: params.userId,
    performedAt: new Date(),
  });
}

/** Comptes d'un cabinet, ouverts d'abord. */
export async function listTrustBankAccounts(cabinetId: string, options?: { includeClosed?: boolean }) {
  return prisma.trustBankAccount.findMany({
    where: { cabinetId, ...(options?.includeClosed ? {} : { closedAt: null }) },
    orderBy: [{ closedAt: "asc" }, { type: "asc" }, { openedAt: "asc" }],
  });
}

/**
 * Compte à utiliser quand l'appelant n'en précise pas.
 *
 * Un seul compte général ouvert : on le retient, c'est sans ambiguïté. Plusieurs :
 * on renvoie `null` et l'appelant doit trancher. Choisir « le premier » quand il y
 * en a deux reviendrait à imputer de l'argent client au mauvais compte, et l'écart
 * ne se verrait qu'au rapprochement du mois suivant.
 */
export async function resolveDefaultTrustBankAccountId(cabinetId: string): Promise<string | null> {
  const generals = await prisma.trustBankAccount.findMany({
    where: { cabinetId, type: "GENERAL", closedAt: null },
    select: { id: true },
    take: 2,
  });
  return generals.length === 1 ? generals[0]!.id : null;
}

/**
 * Solde d'un compte bancaire, dérivé du registre append-only (PR-1).
 * `TrustBankAccount.currentBalance` n'est qu'un cache d'affichage.
 */
export async function getTrustBankAccountBalance(
  cabinetId: string,
  accountId: string,
): Promise<number> {
  const agg = await prisma.trustTransaction.aggregate({
    where: { cabinetId, trustBankAccountId: accountId },
    _sum: { amount: true },
  });
  return Math.round((agg._sum.amount ?? 0) * 100) / 100;
}

/**
 * Solde détenu pour un client DANS UN COMPTE donné.
 *
 * C'est la formulation exacte de la s. 9(3) By-Law 9 : « shall not at any time with
 * respect to a client withdraw from a trust account more money than is held on
 * behalf of that client IN THAT TRUST ACCOUNT at that time ». Un client peut avoir
 * des fonds dans deux comptes ; le plafond de retrait est celui du compte visé, pas
 * la somme des deux.
 */
export async function getClientBalanceInAccount(params: {
  cabinetId: string;
  accountId: string;
  clientId: string;
  dossierId?: string | null;
}): Promise<number> {
  const agg = await prisma.trustTransaction.aggregate({
    where: {
      cabinetId: params.cabinetId,
      trustBankAccountId: params.accountId,
      clientId: params.clientId,
      ...(params.dossierId !== undefined ? { dossierId: params.dossierId } : {}),
    },
    _sum: { amount: true },
  });
  return Math.round((agg._sum.amount ?? 0) * 100) / 100;
}

/** État réglementaire d'un compte : démarches faites, démarches en attente. */
export async function getTrustBankAccountCompliance(params: {
  cabinetId: string;
  accountId: string;
  province?: CabinetProvince;
}) {
  const account = await prisma.trustBankAccount.findFirst({
    where: { id: params.accountId, cabinetId: params.cabinetId },
  });
  if (!account) throw new Error("Compte introuvable");

  const province =
    params.province ?? resolveProvince(await getCabinetProvince(params.cabinetId));

  const duties = getPostOpeningDuties(province, account.type as TrustBankAccountType, {
    regulatorNotifiedAt: account.regulatorNotifiedAt,
    clientCopySentAt: account.clientCopySentAt,
  });

  return {
    account,
    province,
    duties,
    outstandingDuties: duties.filter((d) => !d.done),
    barreauAgreementConfirmed: account.barreauAgreementConfirmed,
  };
}
