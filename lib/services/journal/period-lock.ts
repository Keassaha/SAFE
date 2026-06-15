/**
 * Verrouillage de période comptable (doctrine §9 — intégrité de période).
 *
 * Une période verrouillée ("YYYY-MM") refuse toute NOUVELLE écriture au journal
 * datée dans ce mois. Les corrections ne sont pas une exception : elles s'écrivent
 * dans la période ouverte courante (date du jour), jamais antidatées dans un mois clos.
 *
 * Le garde-fou réel est appliqué dans `createJournalEntry` (choke point unique).
 */

import type { Prisma, PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/db";

type DbClient = PrismaClient | Prisma.TransactionClient;

/**
 * Dérive la période "YYYY-MM" d'une date. Calendrier local, cohérent avec le
 * rapprochement fidéicommis (`getReconciliationStatus`). Note : une écriture
 * exactement sur une frontière de mois est rattachée au mois local de la date.
 */
export function getPeriodeFromDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

/** La période est-elle verrouillée ? Lecture défensive (mocks partiels → non verrouillée). */
export async function isPeriodLocked(
  cabinetId: string,
  periode: string,
  client: DbClient = prisma,
): Promise<boolean> {
  if (!client?.accountingPeriodLock?.findUnique) return false;
  const lock = await client.accountingPeriodLock.findUnique({
    where: { cabinetId_periode: { cabinetId, periode } },
    select: { id: true },
  });
  return lock != null;
}

/** Verrouille (clôt) une période. Idempotent. */
export async function lockAccountingPeriod(params: {
  cabinetId: string;
  periode: string;
  lockedById?: string | null;
  reason?: string | null;
  client?: DbClient;
}): Promise<void> {
  const { cabinetId, periode, lockedById, reason, client = prisma } = params;
  if (!/^\d{4}-\d{2}$/.test(periode)) {
    throw new Error("La période doit être au format YYYY-MM");
  }
  await client.accountingPeriodLock.upsert({
    where: { cabinetId_periode: { cabinetId, periode } },
    create: { cabinetId, periode, lockedById: lockedById ?? null, reason: reason ?? null },
    update: {},
  });
}

/** Rouvre une période verrouillée (opération sensible — à réserver à un rôle autorisé). */
export async function unlockAccountingPeriod(params: {
  cabinetId: string;
  periode: string;
  client?: DbClient;
}): Promise<void> {
  const { cabinetId, periode, client = prisma } = params;
  await client.accountingPeriodLock.deleteMany({ where: { cabinetId, periode } });
}

/** Liste des périodes verrouillées d'un cabinet (les plus récentes d'abord). */
export async function getLockedPeriods(cabinetId: string): Promise<string[]> {
  const locks = await prisma.accountingPeriodLock.findMany({
    where: { cabinetId },
    orderBy: { periode: "desc" },
    select: { periode: true },
  });
  return locks.map((l) => l.periode);
}
