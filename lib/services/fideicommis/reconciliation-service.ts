/**
 * Service de rapprochement fidéicommis (By-Law 9 LSO / B-1 r.5 Barreau QC).
 * 3-way reconciliation: solde bancaire vs registre interne vs solde par dossier.
 */

import { prisma } from "@/lib/db";
import { createAuditLog } from "@/lib/services/audit";
import { getGlobalTrustBalance } from "./trust-balance-service";
import { lockAccountingPeriod } from "@/lib/services/journal/period-lock";

export interface CreateReconciliationParams {
  cabinetId: string;
  periode: string; // "YYYY-MM"
  soldeBancaire: number;
  chequesEnCirculation?: number;
  depotsEnTransit?: number;
  interetsLFO?: number;
  notes?: string | null;
  createdById: string;
}

export interface CertifyReconciliationParams {
  reconciliationId: string;
  cabinetId: string;
  certifiedById: string;
}

/** Calculates the total balance across all trust accounts for a cabinet. */
async function getTotalTrustAccountBalances(cabinetId: string): Promise<number> {
  const result = await prisma.trustAccount.aggregate({
    where: { cabinetId },
    _sum: { currentBalance: true },
  });
  return result._sum.currentBalance ?? 0;
}

/** Creates or updates a reconciliation for a given period. */
export async function createReconciliation(params: CreateReconciliationParams) {
  const {
    cabinetId,
    periode,
    soldeBancaire,
    chequesEnCirculation = 0,
    depotsEnTransit = 0,
    interetsLFO = 0,
    notes,
    createdById,
  } = params;

  // Validate period format
  if (!/^\d{4}-\d{2}$/.test(periode)) {
    throw new Error("Period must be in YYYY-MM format");
  }

  // Calculate internal balances
  const soldeRegistre = await getGlobalTrustBalance(cabinetId);
  const soldeParDossier = await getTotalTrustAccountBalances(cabinetId);

  // 3-way calculation
  const soldeRapproche = soldeBancaire - chequesEnCirculation + depotsEnTransit;
  const ecart = Math.round((soldeRapproche - soldeRegistre) * 100) / 100;

  const reconciliation = await prisma.trustReconciliation.upsert({
    where: { cabinetId_periode: { cabinetId, periode } },
    create: {
      cabinetId,
      periode,
      soldeBancaire,
      chequesEnCirculation,
      depotsEnTransit,
      soldeRapproche,
      soldeRegistre,
      soldeParDossier,
      ecart,
      interetsLFO,
      notes,
      status: ecart === 0 ? "complete" : "draft",
    },
    update: {
      soldeBancaire,
      chequesEnCirculation,
      depotsEnTransit,
      soldeRapproche,
      soldeRegistre,
      soldeParDossier,
      ecart,
      interetsLFO,
      notes,
      status: ecart === 0 ? "complete" : "draft",
      certifiedAt: null,
      certifiedById: null,
    },
  });

  await createAuditLog({
    cabinetId,
    userId: createdById,
    entityType: "TrustAccount",
    entityId: reconciliation.id,
    action: "create",
    newValues: {
      type: "reconciliation",
      periode,
      soldeBancaire,
      soldeRegistre,
      soldeParDossier,
      ecart,
    },
    performedBy: createdById,
    performedAt: new Date(),
  });

  return reconciliation;
}

/** Certifies a reconciliation (lawyer signs off). Only allowed if ecart === 0. */
export async function certifyReconciliation(params: CertifyReconciliationParams) {
  const { reconciliationId, cabinetId, certifiedById } = params;

  const reconciliation = await prisma.trustReconciliation.findFirst({
    where: { id: reconciliationId, cabinetId },
  });

  if (!reconciliation) throw new Error("Reconciliation not found");
  if (reconciliation.ecart !== 0) {
    throw new Error(
      `Cannot certify: discrepancy of $${reconciliation.ecart.toFixed(2)} exists. ` +
      "The reconciled balance must match the register balance exactly."
    );
  }
  if (reconciliation.status === "certified") {
    throw new Error("This reconciliation has already been certified");
  }

  // R-1 : la 3e voie (soldeParDossier) est un _sum agrégé — un compte à -200 $
  // masqué par un autre à +200 $ donnerait un agrégat sain. On vérifie donc CHAQUE
  // compte fidéicommis : aucun solde client ne peut être négatif (B-1 r.5 Barreau QC
  // / By-Law 9 LSO). Une certification sur un compte négatif masquerait un commingling.
  const comptesNegatifs = await prisma.trustAccount.findMany({
    where: { cabinetId, currentBalance: { lt: 0 } },
    select: { id: true, clientId: true, currentBalance: true },
  });
  if (comptesNegatifs.length > 0) {
    const details = comptesNegatifs
      .map((c) => `${c.id} (${c.currentBalance.toFixed(2)} $)`)
      .join(", ");
    throw new Error(
      `Cannot certify: ${comptesNegatifs.length} trust account(s) have a negative balance. ` +
      "No client trust balance may be negative (B-1 r.5 / By-Law 9). " +
      `Accounts to correct: ${details}.`
    );
  }

  const now = new Date();
  const updated = await prisma.trustReconciliation.update({
    where: { id: reconciliationId },
    data: {
      status: "certified",
      certifiedAt: now,
      certifiedById,
    },
  });

  // Doctrine §9 — une fois le mois certifié, on verrouille la période : plus aucune
  // écriture ne peut être antidatée dedans (cf. createJournalEntry).
  await lockAccountingPeriod({
    cabinetId,
    periode: reconciliation.periode,
    lockedById: certifiedById,
    reason: "reconciliation_certified",
  });

  await createAuditLog({
    cabinetId,
    userId: certifiedById,
    entityType: "TrustAccount",
    entityId: reconciliationId,
    action: "update",
    newValues: { type: "reconciliation_certified", periode: reconciliation.periode },
    performedBy: certifiedById,
    performedAt: now,
  });

  return updated;
}

/** Gets the latest reconciliation for a cabinet. */
export async function getLatestReconciliation(cabinetId: string) {
  return prisma.trustReconciliation.findFirst({
    where: { cabinetId },
    orderBy: { periode: "desc" },
    include: { certifiedBy: { select: { id: true, nom: true } } },
  });
}

/** Gets all reconciliations for a cabinet. */
export async function getReconciliations(cabinetId: string) {
  return prisma.trustReconciliation.findMany({
    where: { cabinetId },
    orderBy: { periode: "desc" },
    include: { certifiedBy: { select: { id: true, nom: true } } },
  });
}

/** Gets a single reconciliation by id. */
export async function getReconciliation(id: string, cabinetId: string) {
  return prisma.trustReconciliation.findFirst({
    where: { id, cabinetId },
    include: { certifiedBy: { select: { id: true, nom: true } } },
  });
}

/**
 * Checks if reconciliation is overdue for the current period.
 * By-Law 9: must be completed within 25 days of month-end.
 * Returns { overdue: boolean, daysSinceMonthEnd: number, lastPeriode: string | null }
 */
export async function getReconciliationStatus(cabinetId: string) {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0-indexed

  // Previous month period (what needs to be reconciled)
  const prevMonth = currentMonth === 0 ? 12 : currentMonth;
  const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
  const expectedPeriode = `${prevYear}-${String(prevMonth).padStart(2, "0")}`;

  // Days since end of previous month
  const monthEndDate = new Date(prevYear, prevMonth, 0); // last day of prev month
  const daysSinceMonthEnd = Math.floor(
    (now.getTime() - monthEndDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  const latest = await getLatestReconciliation(cabinetId);
  const lastCertifiedPeriode = latest?.status === "certified" ? latest.periode : null;
  const isCurrentPeriodDone = latest?.periode === expectedPeriode && latest?.status === "certified";

  return {
    expectedPeriode,
    daysSinceMonthEnd,
    overdue: !isCurrentPeriodDone && daysSinceMonthEnd > 20, // alert at J+20 (5-day margin)
    critical: !isCurrentPeriodDone && daysSinceMonthEnd > 25, // non-compliant at J+25
    lastCertifiedPeriode,
    lastReconciliation: latest,
  };
}
