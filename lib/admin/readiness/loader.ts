import { prisma } from "@/lib/db";
import { parseCabinetConfig } from "@/lib/cabinet-config";
import { getTrustReconciliationStatus } from "@/lib/services/trust-reconciliation-status";
import type { CabinetReadinessSnapshot } from "./snapshot";

/**
 * Assemble le `CabinetReadinessSnapshot` depuis Prisma + parseCabinetConfig.
 * Seul endroit qui touche la base : le moteur reste pur et testable.
 */
export async function loadCabinetReadinessSnapshot(
  cabinetId: string,
): Promise<CabinetReadinessSnapshot | null> {
  const [cabinet, policies, employees, adminUserCount, lastAudit, totalUsers, trust] = await Promise.all([
    prisma.cabinet.findUnique({
      where: { id: cabinetId },
      select: {
        nom: true,
        adresse: true,
        email: true,
        barreauNumero: true,
        config: true,
        plan: true,
        stripeSubscriptionStatus: true,
        stripeCurrentPeriodEnd: true,
        stripeCancelAtPeriodEnd: true,
        stripeTrialEnd: true,
      },
    }),
    prisma.documentRetentionPolicy.findMany({
      where: { cabinetId },
      select: { documentType: true, retentionYears: true },
    }),
    prisma.employee.findMany({
      where: { cabinetId },
      select: { role: true, status: true, userId: true },
    }),
    prisma.user.count({ where: { cabinetId, role: "admin_cabinet" } }),
    prisma.auditLog.findFirst({
      where: { cabinetId },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true },
    }),
    prisma.user.count({ where: { cabinetId } }),
    getTrustReconciliationStatus(cabinetId),
  ]);

  if (!cabinet) return null;
  const config = parseCabinetConfig(cabinet.config ?? null);
  const linkedUsers = employees.filter((e) => e.userId !== null).length;

  return {
    identity: {
      nom: cabinet.nom ?? null,
      adresse: cabinet.adresse ?? null,
      email: cabinet.email ?? null,
      barreauNumero: cabinet.barreauNumero ?? null,
    },
    province: config.province ?? null,
    subscription: {
      plan: cabinet.plan ?? null,
      stripeSubscriptionStatus: cabinet.stripeSubscriptionStatus ?? null,
      stripeCurrentPeriodEnd: cabinet.stripeCurrentPeriodEnd ?? null,
      stripeCancelAtPeriodEnd: cabinet.stripeCancelAtPeriodEnd ?? null,
      stripeTrialEnd: cabinet.stripeTrialEnd ?? null,
    },
    taxNumbers: config.taxNumbers ?? {},
    team: { employees, adminUserCount },
    audit: { lastEntryAt: lastAudit?.createdAt ?? null },
    billing: {
      hasInvoiceConfig: Boolean(config.invoice),
      template: config.invoice?.template ?? null,
      hasNotice: Boolean(config.invoice?.notice),
      hasSignature: Boolean(config.invoice?.signature),
    },
    trust,
    userAccess: {
      totalUsers,
      usersWithoutEmployee: Math.max(0, totalUsers - linkedUsers),
    },
    // isSafeIncCabinet == (cabinet.nom === "SAFE") : on évite une requête de plus.
    console: { isSafeInc: cabinet.nom === "SAFE" },
    retention: { policies },
  };
}
