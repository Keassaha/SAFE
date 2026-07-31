/**
 * Service des transactions fidéicommis : dépôt, retrait, correction.
 *
 * Règles structurelles : append-only (aucun update/delete), solde vérifié sous
 * verrou avant tout mouvement, audit systématique. Chaque transaction crée une
 * entrée au Journal Général (module FIDEICOMMIS).
 *
 * Garde-fous réglementaires (CH-00 — docs/compliance/PROGRAMME_INSPECTION_READY.md) :
 *
 *   art. 56 QC / s. 9(1) ON  — trois (QC) ou cinq (ON) motifs de retrait, et rien
 *                              d'autre. Un retrait sans motif est refusé.
 *   art. 56(2) QC / s. 9(1)3 — honoraires retirables uniquement pour une facturation
 *                              ENVOYÉE. Le texte dit « envoyée » / « delivered »,
 *                              pas « préparée » : une facture brouillon ne suffit pas.
 *   art. 57 QC / s. 11 ON    — aucun retrait en espèces d'un compte général.
 *   art. 59 QC / s. 9(3) ON  — jamais plus que le solde détenu pour ce dossier.
 *   art. 60 QC / s. 14 ON    — aucun solde de carte-client ne peut être débiteur ;
 *                              une correction ne peut donc pas en créer un.
 *
 * Toutes les erreurs réglementaires passent par `TrustComplianceError`, qui porte
 * son article et sa porte de sortie (PR-2, PR-4).
 */

import type {
  TrustModePaiement,
  TrustWithdrawalMotive,
  TrustPurposeCode,
  Prisma,
  PrismaClient,
} from "@prisma/client";
import { prisma } from "@/lib/db";
import { createAuditLog } from "@/lib/services/audit";
import { getTrustBalance } from "./trust-balance-service";
import { getOrCreateTrustAccount } from "@/lib/services/billing/trust-service";
import { recalculateInvoiceTotals } from "@/lib/services/billing/invoice-service";
import { createJournalEntry } from "@/lib/services/journal/journal-service";
import { isInvoiceIssued } from "@/lib/billing/invoice-status";
import { getCabinetProvince } from "@/lib/cabinet/get-province";
import { resolveProvince, type CabinetProvince } from "@/lib/compliance/rules";
import { TrustComplianceError } from "./errors";
import { assertIdentityForFundsMovement } from "@/lib/services/identity/identity-gate";
import { resolveDefaultTrustBankAccountId } from "./trust-bank-account-service";
import { registerTrustCheque } from "./trust-cheque-service";
import { checkChequePayee } from "@/lib/compliance/trust-records";
import { CASH_THRESHOLD_CAD, evaluateCashAcceptance } from "@/lib/compliance/cash";
import { getCashAggregateForDossier } from "./cash-service";

type DbClient = PrismaClient | Prisma.TransactionClient;

/**
 * Seuil des sommes en espèces : 7 500 $ CAD.
 *
 * Réexporté depuis `lib/compliance/cash.ts` pour compatibilité des appelants
 * historiques. Le CONTRÔLE, lui, ne vit plus ici : il est agrégé par dossier et
 * porte ses exceptions (CH-05). Voir `evaluateCashAcceptance`.
 */
export const CASH_DEPOSIT_LIMIT = CASH_THRESHOLD_CAD;

/** Motifs de retrait qui exigent obligatoirement une facture rattachée (art. 56(2) QC / s. 9(1)3 ON). */
const MOTIVES_REQUIRING_INVOICE: TrustWithdrawalMotive[] = ["HONORAIRES_DEBOURS_FACTURES"];

/** Clé de verrou consultatif : un compte fidéicommis = une file d'attente sérialisée. */
function trustLockKey(trustAccountId: string): string {
  return `trust:${trustAccountId}`;
}

/**
 * Pose le verrou consultatif transactionnel et renvoie le solde du dossier relu
 * DANS la transaction, depuis le registre append-only (PR-1 : le registre est la
 * seule autorité, jamais `TrustAccount.currentBalance` qui n'est qu'un cache).
 *
 * Sans ce verrou, deux mouvements concurrents lisent le même solde et le dépassent
 * tous les deux : c'est le chemin le plus court vers un solde débiteur, donc vers
 * l'utilisation des fonds d'un autre client.
 */
async function lockAndReadBalance(
  db: DbClient,
  params: {
    cabinetId: string;
    clientId: string;
    dossierId: string;
    trustAccountId: string;
    /**
     * Compte bancaire visé (CH-01). Quand il est connu, le solde est borné à CE
     * compte. C'est la formulation exacte de la s. 9(3) By-Law 9 : « shall not at
     * any time with respect to a client withdraw from a trust account more money
     * than is held on behalf of that client IN THAT TRUST ACCOUNT at that time ».
     *
     * Un client peut détenir des fonds dans deux comptes ; le plafond de retrait
     * est celui du compte d'où sort l'argent, jamais la somme des deux. Sans ce
     * bornage, un retrait sur le compte A pourrait être autorisé par des fonds qui
     * dorment sur le compte B, et le compte A passerait en découvert.
     *
     * `null` quand le cabinet n'a pas encore saisi ses comptes : on retombe alors
     * sur le solde tous comptes confondus, comportement d'avant CH-01.
     */
    trustBankAccountId?: string | null;
  },
): Promise<number> {
  await db.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${trustLockKey(params.trustAccountId)}))`;
  const agg = await db.trustTransaction.aggregate({
    where: {
      cabinetId: params.cabinetId,
      clientId: params.clientId,
      dossierId: params.dossierId,
      ...(params.trustBankAccountId ? { trustBankAccountId: params.trustBankAccountId } : {}),
    },
    _sum: { amount: true },
  });
  return agg._sum.amount ?? 0;
}

/**
 * Détermine le compte bancaire d'une écriture.
 *
 * Art. 36 QC impose des livres distincts par compte général, et la s. 18(8)ii ON un
 * rapprochement détaillé de CHAQUE compte : une écriture sans compte est une
 * écriture qu'aucun des deux rapports ne peut classer.
 *
 * Quand le cabinet n'a qu'un compte général ouvert, on le retient sans rien
 * demander. Dès qu'il en a deux, on refuse de choisir : imputer de l'argent client
 * au mauvais compte produit un écart qui ne se verra qu'au rapprochement suivant.
 */
async function resolveTrustBankAccountId(
  cabinetId: string,
  provided: string | null | undefined,
  province: CabinetProvince,
): Promise<string | null> {
  if (provided) return provided;
  const resolved = await resolveDefaultTrustBankAccountId(cabinetId);
  if (resolved) return resolved;
  // Aucun compte, ou plusieurs : on laisse passer sans rattachement plutôt que de
  // bloquer un cabinet qui n'a pas encore saisi ses comptes. Le manquement est
  // visible au rapprochement, où il devient bloquant.
  return null;
}

/** Province du cabinet, pour localiser les messages réglementaires (PR-7). */
async function resolveCabinetProvince(cabinetId: string): Promise<CabinetProvince> {
  return resolveProvince(await getCabinetProvince(cabinetId));
}

/** Journalise une tentative bloquée. Un refus doit laisser une trace, pas disparaître. */
async function logBlockedAttempt(params: {
  cabinetId: string;
  createdById?: string | null;
  reason: string;
  values: Record<string, unknown>;
}): Promise<void> {
  await createAuditLog({
    cabinetId: params.cabinetId,
    userId: params.createdById ?? undefined,
    entityType: "TrustTransaction",
    entityId: "BLOCKED",
    action: "create",
    metadata: { blocked: true, reason: params.reason },
    newValues: params.values,
    performedBy: params.createdById ?? undefined,
    performedAt: new Date(),
  });
}

export interface CreateTrustDepositParams {
  cabinetId: string;
  /**
   * Compte bancaire en fidéicommis concerné (CH-01). Facultatif quand le cabinet
   * n'a qu'un seul compte général ouvert ; obligatoire dès qu'il en a plusieurs.
   */
  trustBankAccountId?: string | null;
  clientId: string;
  dossierId: string;
  montant: number;
  dateTransaction: Date;
  modePaiement: TrustModePaiement;
  reference?: string | null;
  description?: string | null;
  createdById?: string | null;

  // ── CH-02 — champs du journal de caisse (art. 38(1) QC / s. 18(1) ON) ──────
  /** « Le nom de la personne de qui la somme est reçue » (art. 38(1)c). */
  payerName?: string | null;
  /** « L'objet pour lequel la somme est reçue » (art. 38(1)f). */
  purposeCode?: TrustPurposeCode | null;
  purposeText?: string | null;
  /** Art. 48 — affectation des sommes reçues. */
  fundAllocation?: string | null;
  /** Art. 49 — les fonds viennent d'un tiers : le client doit en être informé. */
  fromThirdParty?: boolean;
  /** Art. 50 / s. 7(1) — date de RÉCEPTION, distincte de la date de dépôt. */
  receivedAt?: Date | null;
  /**
   * Exception au seuil des espèces (art. 69 QC / s. 6 ON), le cas échéant.
   * Validée contre le régime de la province : une exception ontarienne invoquée par
   * un cabinet québécois est refusée.
   */
  cashExemption?: string | null;
}

export interface CreateTrustWithdrawalParams {
  cabinetId: string;
  /**
   * Compte bancaire en fidéicommis concerné (CH-01). Facultatif quand le cabinet
   * n'a qu'un seul compte général ouvert ; obligatoire dès qu'il en a plusieurs.
   */
  trustBankAccountId?: string | null;
  clientId: string;
  dossierId: string;
  montant: number;
  dateTransaction: Date;
  /** Motif réglementaire. OBLIGATOIRE (art. 56 QC / s. 9(1) ON). */
  motive: TrustWithdrawalMotive;
  factureId?: string | null;
  modePaiement?: TrustModePaiement | null;
  reference?: string | null;
  description?: string | null;
  createdById?: string | null;

  // ── CH-02 — champs du journal de caisse (art. 38(2) QC / s. 18(2) ON) ──────
  /** « Le nom du bénéficiaire du débours » (art. 38(2)c). */
  payeeName?: string | null;
  /** « L'objet pour lequel le débours est effectué » (art. 38(2)f). */
  purposeCode?: TrustPurposeCode | null;
  purposeText?: string | null;
  /** « Le numéro de chèque, le cas échéant » (art. 38(2)h). Alimente le registre. */
  chequeNumber?: number | null;
}

export interface CreateTrustCorrectionParams {
  cabinetId: string;
  /**
   * Compte bancaire en fidéicommis concerné (CH-01). Facultatif quand le cabinet
   * n'a qu'un seul compte général ouvert ; obligatoire dès qu'il en a plusieurs.
   */
  trustBankAccountId?: string | null;
  clientId: string;
  dossierId: string;
  montant: number; // positif ou négatif
  dateTransaction: Date;
  correctionOfId: string;
  description: string;
  reference?: string | null;
  createdById?: string | null;
}

/* ════════════════════════════════════════════════════════════════
   DÉPÔT
   ════════════════════════════════════════════════════════════════ */

/** Enregistre un dépôt. Montant > 0, client et dossier obligatoires. */
export async function createTrustDeposit(params: CreateTrustDepositParams): Promise<{ transactionId: string }> {
  const {
    cabinetId,
    trustBankAccountId: providedBankAccountId,
    clientId,
    dossierId,
    montant,
    dateTransaction,
    modePaiement,
    reference,
    description,
    createdById,
    payerName,
    purposeCode,
    purposeText,
    fundAllocation,
    fromThirdParty,
    receivedAt,
  } = params;

  if (montant <= 0) throw new Error("Le montant du dépôt doit être strictement positif");
  if (!clientId || !dossierId) throw new Error("Client et dossier sont obligatoires");

  const province = await resolveCabinetProvince(cabinetId);

  // ── Espèces : seuil AGRÉGÉ par dossier, avec exceptions (CH-05) ────────────
  //
  // Le contrôle antérieur refusait tout versement isolé de 7 500 $ ou plus, ce qui
  // était faux dans les deux sens : il bloquait l'avance d'honoraires que l'art. 69(6)
  // autorise expressément, et laissait passer trois versements de 3 000 $ que la
  // s. 4(1) interdit en cumul (« an aggregate amount »).
  //
  // `params.cashExemption` permet d'invoquer l'exception applicable. Elle est validée
  // contre le régime de la province : accorder une dispense qui n'existe pas ici
  // serait pire que l'absence de contrôle.
  if (modePaiement === "ESPECES") {
    const alreadyReceivedCad = await getCashAggregateForDossier({
      cabinetId,
      dossierId,
      province,
    });
    const verdict = evaluateCashAcceptance(province, {
      amountCad: montant,
      alreadyReceivedCad,
      exemption: params.cashExemption ?? null,
      intoTrust: true,
    });
    if (verdict.status === "REFUSED") {
      await logBlockedAttempt({
        cabinetId,
        createdById,
        reason: verdict.code,
        values: { montant, alreadyReceivedCad, aggregateCad: verdict.aggregateCad, dossierId },
      });
      throw new TrustComplianceError("CASH_DEPOSIT_LIMIT_EXCEEDED", {
        province,
        detail: `${verdict.messageFr} ${verdict.remedyFr}`,
      });
    }
  }

  // CH-06 — art. 20, 26 B-1 r.5 / s. 22(1)(b), 23(5)-(6) By-Law 7.1 : recevoir des
  // fonds déclenche l'obligation de vérification d'identité. Au Québec, pour une
  // personne physique, elle doit être faite AVANT la réception : le dépôt est refusé.
  await assertIdentityForFundsMovement({ cabinetId, clientId, userId: createdById, province });

  const bankAccountId = await resolveTrustBankAccountId(cabinetId, providedBankAccountId, province);
  const { id: trustAccountId } = await getOrCreateTrustAccount({ cabinetId, clientId, matterId: dossierId });
  const now = new Date();

  // R-3 (CH-00) : le solde du dépôt était calculé HORS transaction. Deux dépôts
  // concurrents lisaient le même solde de départ et écrivaient tous deux un
  // `balanceAfter` faux, rendant la colonne inutilisable comme piste d'audit —
  // or c'est précisément le « solde du compte après chaque inscription » exigé par
  // l'art. 38(1)h. Même verrou que le retrait.
  let newBalance = 0;
  const tx = await prisma.$transaction(async (db) => {
    const balance = await lockAndReadBalance(db, {
      cabinetId,
      clientId,
      dossierId,
      trustAccountId,
      trustBankAccountId: bankAccountId,
    });
    newBalance = balance + montant;

    const created = await db.trustTransaction.create({
      data: {
        cabinetId,
        trustAccountId,
        trustBankAccountId: bankAccountId ?? undefined,
        clientId,
        dossierId,
        date: dateTransaction,
        amount: montant,
        type: "deposit",
        transactionType: "deposit",
        balanceAfter: newBalance,
        modePaiement,
        // CH-02 — art. 38(1) : ce que chaque recette doit porter.
        payerName: payerName ?? undefined,
        purposeCode: purposeCode ?? undefined,
        purposeText: purposeText ?? undefined,
        // Art. 38(1)g — indicateur normalisé, dérivé du mode plutôt que ressaisi.
        isCash: modePaiement === "ESPECES",
        // Art. 50 / s. 7(1) — sans les DEUX dates, le délai de dépôt est invérifiable.
        receivedAt: receivedAt ?? dateTransaction,
        depositedAt: dateTransaction,
        fundAllocation: fundAllocation ?? undefined,
        fromThirdParty: fromThirdParty ?? false,
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
    await db.client.update({ where: { id: clientId }, data: { lastTrustTransactionDate: now } });
    await db.dossier.update({ where: { id: dossierId }, data: { soldeFiducieDossier: newBalance } });
    await createJournalEntry(
      {
        cabinetId,
        dateTransaction,
        typeTransaction: "DEPOT_FIDEICOMMIS",
        reference: reference ?? null,
        clientId,
        dossierId,
        description: description ?? `Dépôt fidéicommis — ${montant.toFixed(2)} $`,
        montantEntree: montant,
        montantSortie: 0,
        sourceModule: "FIDEICOMMIS",
        sourceId: created.id,
        utilisateurId: createdById ?? null,
      },
      db,
    );
    return created;
  });

  await createAuditLog({
    cabinetId,
    userId: createdById ?? undefined,
    entityType: "TrustTransaction",
    entityId: tx.id,
    action: "create",
    newValues: { type: "deposit", amount: montant, balanceAfter: newBalance, clientId, dossierId, modePaiement },
    performedBy: createdById ?? undefined,
    performedAt: now,
  });

  return { transactionId: tx.id };
}

/* ════════════════════════════════════════════════════════════════
   RETRAIT
   ════════════════════════════════════════════════════════════════ */

/**
 * Contrôle de la facture rattachée à un retrait d'honoraires.
 *
 * Avant CH-00, cette fonction ne vérifiait que l'appartenance au client. Une
 * facture au statut brouillon, jamais envoyée, permettait donc de sortir des fonds
 * du fidéicommis : c'est exactement le scénario que l'art. 56(2) QC et la s. 9(1)3
 * ON interdisent, et le premier échantillon qu'un inspecteur prélève.
 */
async function validateInvoiceForWithdrawal(params: {
  cabinetId: string;
  clientId: string;
  factureId: string;
  montant: number;
  dateTransaction: Date;
  province: CabinetProvince;
  createdById?: string | null;
}): Promise<void> {
  const { cabinetId, clientId, factureId, montant, dateTransaction, province, createdById } = params;

  const invoice = await prisma.invoice.findFirst({
    where: { id: factureId, cabinetId },
    select: {
      clientId: true,
      numero: true,
      invoiceStatus: true,
      paymentStatus: true,
      dateEcheance: true,
      dateEmission: true,
      sentAt: true,
      balanceDue: true,
    },
  });
  if (!invoice) throw new Error("Facture introuvable ou n'appartient pas à ce cabinet");

  // Interdiction de l'allocation croisée : les fonds d'un client ne paient jamais
  // la facture d'un autre (art. 48, 59 QC / s. 9(3) ON).
  if (invoice.clientId !== clientId) {
    await logBlockedAttempt({
      cabinetId,
      createdById,
      reason: "TRUST_CROSS_ALLOCATION_BLOCKED",
      values: { attemptedClientId: clientId, invoiceClientId: invoice.clientId, factureId },
    });
    throw new TrustComplianceError("TRUST_CROSS_ALLOCATION_BLOCKED", { province });
  }

  // art. 56(2) QC / s. 9(1)3 ON — la facture doit être ÉMISE.
  if (!isInvoiceIssued(invoice)) {
    await logBlockedAttempt({
      cabinetId,
      createdById,
      reason: "INVOICE_NOT_ISSUED",
      values: { factureId, invoiceStatus: invoice.invoiceStatus },
    });
    throw new TrustComplianceError("INVOICE_NOT_ISSUED", {
      province,
      detail: `Facture ${invoice.numero} — état : ${invoice.invoiceStatus ?? "inconnu"}.`,
    });
  }

  // ... et ENVOYÉE. « la facturation a été envoyée » (QC) / « a billing has been
  // delivered » (ON). Une facture émise mais restée au cabinet ne satisfait ni l'un
  // ni l'autre.
  if (!invoice.sentAt) {
    await logBlockedAttempt({
      cabinetId,
      createdById,
      reason: "INVOICE_NOT_DELIVERED",
      values: { factureId, numero: invoice.numero },
    });
    throw new TrustComplianceError("INVOICE_NOT_DELIVERED", {
      province,
      detail: `Facture ${invoice.numero} — aucune date d'envoi enregistrée.`,
    });
  }

  // Le retrait ne peut excéder ce qui est réellement dû : le surplus resterait de
  // l'argent du client (art. 56(2), 59 QC / s. 9(1)3, 9(3) ON).
  const balanceDue = invoice.balanceDue ?? 0;
  if (montant > balanceDue + 0.005) {
    throw new TrustComplianceError("INVOICE_AMOUNT_EXCEEDED", {
      province,
      detail: `Solde dû : ${balanceDue.toFixed(2)} $ ; montant demandé : ${montant.toFixed(2)} $.`,
    });
  }

  // Chronologie : la facturation précède le retrait, jamais l'inverse.
  if (invoice.dateEmission.getTime() > dateTransaction.getTime()) {
    throw new TrustComplianceError("INVOICE_DATED_AFTER_WITHDRAWAL", {
      province,
      detail: `Facture émise le ${invoice.dateEmission.toISOString().slice(0, 10)} ; retrait daté du ${dateTransaction.toISOString().slice(0, 10)}.`,
    });
  }
}

/** Enregistre un retrait. Motif obligatoire, solde vérifié sous verrou, facture contrôlée. */
export async function createTrustWithdrawal(params: CreateTrustWithdrawalParams): Promise<{ transactionId: string }> {
  const {
    cabinetId,
    trustBankAccountId: providedBankAccountId,
    clientId,
    dossierId,
    montant,
    dateTransaction,
    motive,
    factureId,
    modePaiement,
    reference,
    description,
    createdById,
    payeeName,
    purposeCode,
    purposeText,
    chequeNumber,
  } = params;

  if (montant <= 0) throw new Error("Le montant du retrait doit être strictement positif");
  if (!clientId || !dossierId) throw new Error("Client et dossier sont obligatoires");

  const province = await resolveCabinetProvince(cabinetId);

  // art. 56 QC / s. 9(1) ON — le motif n'est pas une donnée d'agrément : c'est ce
  // qui rend le retrait licite. Sans lui, un retrait est indistinguable d'un autre
  // à l'inspection, et le rapport mensuel ne peut pas indiquer « l'objet pour lequel
  // le débours est effectué » (art. 38(2)f).
  if (!motive) {
    throw new TrustComplianceError("WITHDRAWAL_MOTIVE_REQUIRED", { province });
  }
  if (MOTIVES_REQUIRING_INVOICE.includes(motive) && !factureId) {
    throw new TrustComplianceError("WITHDRAWAL_MOTIVE_REQUIRES_INVOICE", { province });
  }

  // art. 57 QC / s. 11 ON — aucun retrait en espèces sur un compte général.
  if (modePaiement === "ESPECES") {
    await logBlockedAttempt({
      cabinetId,
      createdById,
      reason: "CASH_WITHDRAWAL_PROHIBITED",
      values: { clientId, dossierId, montant },
    });
    throw new TrustComplianceError("CASH_WITHDRAWAL_PROHIBITED", { province });
  }

  // art. 57 al. 2 QC / s. 11(a) ON — le bénéficiaire d'un chèque en fidéicommis ne
  // peut être ni vide, ni « caisse », ni « cash », ni le porteur. Contrôlé AVANT
  // toute écriture : un chèque irrégulier ne doit pas exister au registre.
  if (modePaiement === "CHEQUE") {
    const payee = checkChequePayee(payeeName, province);
    if (!payee.valid) {
      await logBlockedAttempt({
        cabinetId,
        createdById,
        reason: payee.code ?? "PAYEE_INVALID",
        values: { payeeName, chequeNumber, montant },
      });
      throw new TrustComplianceError("CHEQUE_PAYEE_INVALID", {
        province,
        detail: (province === "QC" ? payee.messageFr : payee.messageEn) ?? null,
      });
    }
  }

  if (factureId) {
    await validateInvoiceForWithdrawal({
      cabinetId,
      clientId,
      factureId,
      montant,
      dateTransaction,
      province,
      createdById,
    });
  }

  // CH-06 — « débourse ou vire des fonds » déclenche la même obligation que la
  // réception (art. 20 B-1 r.5 / s. 22(1)(b) By-Law 7.1).
  await assertIdentityForFundsMovement({ cabinetId, clientId, userId: createdById, province });

  const bankAccountId = await resolveTrustBankAccountId(cabinetId, providedBankAccountId, province);
  const { id: trustAccountId } = await getOrCreateTrustAccount({ cabinetId, clientId, matterId: dossierId });
  const now = new Date();

  // R-2 : le solde est relu À L'INTÉRIEUR de la transaction, sous verrou. Auparavant
  // il était lu hors transaction (TOCTOU) : deux retraits concurrents passaient tous
  // deux le contrôle et rendaient le solde du dossier négatif.
  let newBalance = 0;
  const tx = await prisma.$transaction(async (db) => {
    const balance = await lockAndReadBalance(db, {
      cabinetId,
      clientId,
      dossierId,
      trustAccountId,
      trustBankAccountId: bankAccountId,
    });
    if (montant > balance + 0.005) {
      throw new TrustComplianceError("INSUFFICIENT_TRUST_BALANCE", {
        province,
        detail: `Solde disponible : ${balance.toFixed(2)} $ ; montant demandé : ${montant.toFixed(2)} $.`,
      });
    }
    newBalance = balance - montant;

    const created = await db.trustTransaction.create({
      data: {
        cabinetId,
        trustAccountId,
        trustBankAccountId: bankAccountId ?? undefined,
        clientId,
        dossierId,
        date: dateTransaction,
        amount: -montant,
        type: "withdrawal",
        transactionType: factureId ? "transfer_to_invoice" : "withdrawal",
        balanceAfter: newBalance,
        withdrawalMotive: motive,
        invoiceId: factureId ?? undefined,
        modePaiement: modePaiement ?? undefined,
        // CH-02 — art. 38(2) : ce que chaque débours doit porter.
        payeeName: payeeName ?? undefined,
        purposeCode: purposeCode ?? undefined,
        purposeText: purposeText ?? undefined,
        chequeNumber: chequeNumber ?? undefined,
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
    await db.client.update({ where: { id: clientId }, data: { lastTrustTransactionDate: now } });
    await db.dossier.update({ where: { id: dossierId }, data: { soldeFiducieDossier: newBalance } });
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
    await createJournalEntry(
      {
        cabinetId,
        dateTransaction,
        typeTransaction: "RETRAIT_FIDEICOMMIS",
        reference: reference ?? null,
        clientId,
        dossierId,
        description:
          description ??
          (factureId
            ? `Retrait fidéicommis → facture — ${montant.toFixed(2)} $`
            : `Retrait fidéicommis — ${montant.toFixed(2)} $`),
        montantEntree: 0,
        montantSortie: montant,
        sourceModule: "FIDEICOMMIS",
        sourceId: created.id,
        utilisateurId: createdById ?? null,
      },
      db,
    );
    return created;
  });

  if (factureId) await recalculateInvoiceTotals(factureId);

  // Art. 61 — inscription au registre des chèques. Faite APRÈS l'écriture : le
  // mouvement de fonds existe indépendamment du registre, qui en est le suivi. Une
  // erreur d'inscription ne doit pas annuler un décaissement déjà parti à la banque.
  if (modePaiement === "CHEQUE" && chequeNumber != null && bankAccountId) {
    await registerTrustCheque({
      cabinetId,
      trustBankAccountId: bankAccountId,
      chequeNumber,
      issueDate: dateTransaction,
      payeeName: payeeName ?? "",
      amount: montant,
      clientId,
      dossierId,
      trustTransactionId: tx.id,
      userId: createdById,
    });
  }

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
      motive,
      clientId,
      dossierId,
      invoiceId: factureId ?? undefined,
    },
    performedBy: createdById ?? undefined,
    performedAt: now,
  });

  return { transactionId: tx.id };
}

/* ════════════════════════════════════════════════════════════════
   CORRECTION
   ════════════════════════════════════════════════════════════════ */

/**
 * Enregistre une correction (on ne modifie jamais une transaction existante).
 *
 * CH-00 : la correction n'avait ni verrou ni garde de signe. Une correction
 * négative pouvait donc rendre le solde d'un dossier débiteur, et rien ne le
 * signalait avant la certification de fin de mois — jusqu'à trois semaines
 * d'utilisation des fonds d'un autre client (art. 59-60 QC / s. 9(3), 14 ON).
 */
export async function createTrustCorrection(params: CreateTrustCorrectionParams): Promise<{ transactionId: string }> {
  const {
    cabinetId,
    trustBankAccountId: providedBankAccountId,
    clientId,
    dossierId,
    montant,
    dateTransaction,
    correctionOfId,
    description,
    reference,
    createdById,
  } = params;

  if (!clientId || !dossierId) throw new Error("Client et dossier sont obligatoires");

  const province = await resolveCabinetProvince(cabinetId);

  const original = await prisma.trustTransaction.findFirst({
    where: { id: correctionOfId, cabinetId, clientId, dossierId },
    select: { id: true },
  });
  if (!original) throw new TrustComplianceError("CORRECTION_TARGET_NOT_FOUND", { province });

  const bankAccountId = await resolveTrustBankAccountId(cabinetId, providedBankAccountId, province);
  const { id: trustAccountId } = await getOrCreateTrustAccount({ cabinetId, clientId, matterId: dossierId });
  const now = new Date();

  let newBalance = 0;
  const tx = await prisma.$transaction(async (db) => {
    const balance = await lockAndReadBalance(db, {
      cabinetId,
      clientId,
      dossierId,
      trustAccountId,
      trustBankAccountId: bankAccountId,
    });
    newBalance = balance + montant;

    if (newBalance < -0.005) {
      throw new TrustComplianceError("CORRECTION_WOULD_CREATE_DEBIT_BALANCE", {
        province,
        detail: `Solde actuel : ${balance.toFixed(2)} $ ; correction : ${montant.toFixed(2)} $ ; solde résultant : ${newBalance.toFixed(2)} $.`,
      });
    }

    const created = await db.trustTransaction.create({
      data: {
        cabinetId,
        trustAccountId,
        trustBankAccountId: bankAccountId ?? undefined,
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
    await db.client.update({ where: { id: clientId }, data: { lastTrustTransactionDate: now } });
    await db.dossier.update({ where: { id: dossierId }, data: { soldeFiducieDossier: newBalance } });
    await createJournalEntry(
      {
        cabinetId,
        dateTransaction,
        typeTransaction: "CORRECTION",
        reference: reference ?? null,
        clientId,
        dossierId,
        description: description ?? `Correction fidéicommis — ${montant > 0 ? "+" : ""}${montant.toFixed(2)} $`,
        montantEntree: montant > 0 ? montant : 0,
        montantSortie: montant < 0 ? Math.abs(montant) : 0,
        // Une correction de fidéicommis corrige de l'argent CLIENT : on l'attribue au
        // module FIDEICOMMIS (et non CORRECTION_SYSTEME) pour qu'elle ajuste le solde
        // fidéicommis et JAMAIS le solde opérationnel du cabinet (cf. computeJournalKpis).
        sourceModule: "FIDEICOMMIS",
        sourceId: created.id,
        utilisateurId: createdById ?? null,
      },
      db,
    );
    return created;
  });

  await createAuditLog({
    cabinetId,
    userId: createdById ?? undefined,
    entityType: "TrustTransaction",
    entityId: tx.id,
    action: "create",
    newValues: { type: "correction", amount: montant, correctionOfId, balanceAfter: newBalance, clientId, dossierId },
    performedBy: createdById ?? undefined,
    performedAt: now,
  });

  return { transactionId: tx.id };
}

// Ré-export utilitaire conservé pour les appelants historiques.
export { getTrustBalance };
