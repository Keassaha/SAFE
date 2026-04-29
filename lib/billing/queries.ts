/**
 * SAFE — Requêtes Prisma alignées sur la doctrine de facturation.
 *
 * Ce module est server-side (accès Prisma). Il encapsule les règles
 * d'agrégation pour qu'aucun écran ne réimplémente sa propre arithmétique.
 *
 * Voir docs/accounting/SAFE_ACCOUNTING_DOCTRINE.md §3
 *      docs/accounting/BILLING_CORE_MODEL.md §4
 */

import type { PrismaClient } from "@prisma/client";
import { BillingStatus } from "@prisma/client";

export interface BillableTimeAggregate {
  count: number;
  /** Somme du `feeAmount` quand défini, sinon `montant`. Exclut systématiquement les write-offs. */
  total: number;
}

/**
 * Agrège les TimeEntry "à facturer" pour un cabinet.
 *
 * Règles canoniques (doctrine §3) :
 *  - `facturable: true`
 *  - `invoiceId: null` (jamais déjà attaché)
 *  - `isWrittenOff: false` (la doctrine exclut les write-offs)
 *  - `billingStatus IN [NON_BILLED, READY_TO_BILL]`
 *
 * Décomposition en deux aggregates pour respecter `feeAmount ?? montant`
 * sans recourir à un `findMany` (qui exploserait la mémoire sur les gros cabinets).
 */
export async function aggregateBillableTimeEntries(
  prisma: PrismaClient,
  cabinetId: string,
): Promise<BillableTimeAggregate> {
  const baseWhere = {
    cabinetId,
    facturable: true,
    invoiceId: null,
    isWrittenOff: false,
    billingStatus: { in: [BillingStatus.NON_BILLED, BillingStatus.READY_TO_BILL] },
  };

  const [withFee, withoutFee] = await Promise.all([
    prisma.timeEntry.aggregate({
      where: { ...baseWhere, feeAmount: { not: null } },
      _count: { _all: true },
      _sum: { feeAmount: true },
    }),
    prisma.timeEntry.aggregate({
      where: { ...baseWhere, feeAmount: null },
      _count: { _all: true },
      _sum: { montant: true },
    }),
  ]);

  return {
    count: (withFee._count?._all ?? 0) + (withoutFee._count?._all ?? 0),
    total: (withFee._sum?.feeAmount ?? 0) + (withoutFee._sum?.montant ?? 0),
  };
}
