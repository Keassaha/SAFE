/**
 * Trust Reconciliation Status Service
 *
 * Determines whether a cabinet is overdue on monthly trust account reconciliation
 * per LSO By-Law 9 (Ontario) or Règlement B-1, r.5 (Quebec).
 *
 * Rule: Reconciliation must be certified within 25 days of period (month) end.
 *       Beyond that, the cabinet is non-compliant and exposed to sanctions.
 *
 * Returns null if there are no trust transactions at all (no trust account in use).
 */
import { prisma } from "@/lib/db";

export type TrustReconciliationStatus = {
  isOverdue: boolean;
  daysOverdue: number;
  expectedPeriode: string;
  lastCertifiedPeriode: string | null;
  hasNeverReconciled: boolean;
  hasTrustActivity: boolean;
};

const RECONCILIATION_DEADLINE_DAYS = 25; // LSO By-Law 9 sec. 9.01

/**
 * Get the current expected reconciliation period (last month).
 * If today is April 15, expected = "2026-03" (March).
 */
function getExpectedPeriode(now: Date = new Date()): string {
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const year = lastMonth.getFullYear();
  const month = String(lastMonth.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

/**
 * Get how many days have passed since the deadline for the expected reconciliation.
 * Deadline = end of expected period + 25 days.
 *
 * Example: expected = "2026-03" → period ends Mar 31 → deadline = Apr 25.
 *          If today = Apr 22 → daysOverdue = -3 (not yet overdue)
 *          If today = May 5  → daysOverdue = 10 (10 days overdue)
 */
function getDaysOverdue(periode: string, now: Date = new Date()): number {
  const [year, month] = periode.split("-").map(Number);
  const periodEnd = new Date(year, month, 0); // last day of that month
  const deadline = new Date(periodEnd.getTime() + RECONCILIATION_DEADLINE_DAYS * 24 * 60 * 60 * 1000);
  const diffMs = now.getTime() - deadline.getTime();
  return Math.floor(diffMs / (24 * 60 * 60 * 1000));
}

export async function getTrustReconciliationStatus(cabinetId: string): Promise<TrustReconciliationStatus | null> {
  // Check if the cabinet has any trust activity at all
  const trustTxCount = await prisma.trustTransaction.count({
    where: { cabinetId },
  });

  // Also check if any trust accounts exist
  const trustAccountsCount = await prisma.trustAccount.count({
    where: { cabinetId },
  });

  const hasTrustActivity = trustTxCount > 0 || trustAccountsCount > 0;

  if (!hasTrustActivity) {
    // No trust activity at all — no reconciliation required
    return null;
  }

  const now = new Date();
  const expectedPeriode = getExpectedPeriode(now);
  const daysOverdue = getDaysOverdue(expectedPeriode, now);

  // Find the most recent certified reconciliation
  const lastCertified = await prisma.trustReconciliation.findFirst({
    where: {
      cabinetId,
      status: "certified",
      certifiedAt: { not: null },
    },
    orderBy: { periode: "desc" },
    select: { periode: true },
  });

  const hasNeverReconciled = lastCertified === null;

  // Check whether the expected period is already certified
  if (lastCertified?.periode && lastCertified.periode >= expectedPeriode) {
    // Up-to-date
    return {
      isOverdue: false,
      daysOverdue: 0,
      expectedPeriode,
      lastCertifiedPeriode: lastCertified.periode,
      hasNeverReconciled,
      hasTrustActivity: true,
    };
  }

  // Either never reconciled, or last reconciliation is older than expected period
  // → overdue if past the 25-day window
  const isOverdue = daysOverdue > 0 || hasNeverReconciled;

  return {
    isOverdue,
    daysOverdue: Math.max(daysOverdue, 0),
    expectedPeriode,
    lastCertifiedPeriode: lastCertified?.periode ?? null,
    hasNeverReconciled,
    hasTrustActivity: true,
  };
}
