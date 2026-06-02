/**
 * SAFE — Requêtes Prisma alignées sur la doctrine de facturation.
 *
 * Ce module est server-side (accès Prisma). Il encapsule les règles
 * d'agrégation pour qu'aucun écran ne réimplémente sa propre arithmétique.
 *
 * Voir docs/accounting/SAFE_ACCOUNTING_DOCTRINE.md §3
 *      docs/accounting/BILLING_CORE_MODEL.md §4
 */

import type { Prisma, PrismaClient } from "@prisma/client";
import { BillingStatus } from "@prisma/client";

/**
 * Statuts d'invoice considérés "non envoyés" par le KPI Facturables.
 * Une facture quittant cette liste (passage à ISSUED, etc.) sort automatiquement
 * de Facturables — les lignes qu'elle porte ne sont plus sélectionnables.
 *
 * Exporté pour pouvoir figer l'invariant via test.
 */
export const NOT_SENT_INVOICE_STATUSES = ["DRAFT", "READY_TO_ISSUE"] as const;

export interface BillableTimeAggregate {
  count: number;
  /** Somme du `feeAmount` quand défini, sinon `montant`. Exclut systématiquement les write-offs. */
  total: number;
}

export interface BillableForfaitAggregate {
  count: number;
  total: number;
}

export interface BillableExpenseAggregate {
  count: number;
  total: number;
}

export function billableTimeEntryStatusWhere(): Prisma.TimeEntryWhereInput {
  return {
    OR: [
      { billingStatus: BillingStatus.READY_TO_BILL },
      {
        AND: [
          { billingStatus: BillingStatus.NON_BILLED },
          { feeAmount: { not: null } },
        ],
      },
      {
        AND: [
          { billingStatus: null },
          { feeAmount: { not: null } },
        ],
      },
    ],
  };
}

export function buildBillableTimeEntryWhere(
  cabinetId: string,
  extraAnd: Prisma.TimeEntryWhereInput[] = [],
): Prisma.TimeEntryWhereInput {
  return {
    cabinetId,
    facturable: true,
    invoiceId: null,
    invoiceLineId: null,
    isWrittenOff: false,
    AND: [
      { description: { not: null } },
      { description: { not: "" } },
      billableTimeEntryStatusWhere(),
      ...extraAnd,
    ],
  };
}

export function buildUnsentBillableTimeEntryWhere(
  cabinetId: string,
  extraAnd: Prisma.TimeEntryWhereInput[] = [],
): Prisma.TimeEntryWhereInput {
  return {
    cabinetId,
    facturable: true,
    isWrittenOff: false,
    AND: [
      {
        OR: [
          buildBillableTimeEntryWhere(cabinetId),
          {
            billingStatus: BillingStatus.IN_DRAFT_INVOICE,
            invoice: { invoiceStatus: { in: [...NOT_SENT_INVOICE_STATUSES] } },
          },
        ],
      },
      ...extraAnd,
    ],
  };
}

function buildFacturableKpiExpenseWhere(cabinetId: string): Prisma.ExpenseWhereInput {
  return {
    cabinetId,
    OR: [
      {
        invoiceId: null,
        billingStatus: { in: [BillingStatus.NON_BILLED, BillingStatus.READY_TO_BILL] },
      },
      {
        billingStatus: BillingStatus.IN_DRAFT_INVOICE,
        invoice: { invoiceStatus: { in: [...NOT_SENT_INVOICE_STATUSES] } },
      },
    ],
  };
}

/**
 * RegistreTache facturables : tâches "complete" non rattachées à une ligne,
 * OU rattachées à une facture encore non envoyée.
 *
 * Note schéma : `RegistreTache.dossierId` est non-null et `Dossier.clientId`
 * aussi — chaque tâche a donc toujours un client effectif. Pas besoin de
 * filtrer "lien client présent" au niveau de cette query : tout tâche en a un.
 *
 * Exporté pour les tests d'invariant et la réutilisation côté API honoraires.
 */
export function buildFacturableKpiRegistreTacheWhere(
  cabinetId: string,
): Prisma.RegistreTacheWhereInput {
  return {
    cabinetId,
    OR: [
      { statut: "complete", invoiceLineId: null },
      {
        invoiceLineId: { not: null },
        invoiceLine: {
          invoice: { invoiceStatus: { in: [...NOT_SENT_INVOICE_STATUSES] } },
        },
      },
    ],
  };
}

/**
 * Variante utilisée par l'API /api/facturation/honoraires : applique aussi
 * les filtres optionnels (clientId direct OU via dossier, dossierId, dates,
 * recherche texte). Restructurée en AND-de-OR pour que le filtre métier
 * "non envoyé" ne soit pas écrasé par l'OR de recherche.
 */
export function buildHonorairesRegistreTacheWhere(
  cabinetId: string,
  filters: {
    clientId?: string;
    dossierId?: string;
    dateFrom?: Date;
    dateTo?: Date;
    q?: string;
  },
): Prisma.RegistreTacheWhereInput {
  const and: Prisma.RegistreTacheWhereInput[] = [];

  // Filtre métier (toujours appliqué) : libre OU dans une facture non envoyée.
  and.push({
    OR: [
      { statut: "complete", invoiceLineId: null },
      {
        invoiceLineId: { not: null },
        invoiceLine: {
          invoice: { invoiceStatus: { in: [...NOT_SENT_INVOICE_STATUSES] } },
        },
      },
    ],
  });

  // Filtre client : direct OU via dossier (les deux chemins acceptés).
  if (filters.clientId) {
    and.push({
      OR: [
        { clientId: filters.clientId },
        { dossier: { clientId: filters.clientId } },
      ],
    });
  }

  if (filters.dossierId) and.push({ dossierId: filters.dossierId });

  if (filters.dateFrom || filters.dateTo) {
    and.push({
      date: {
        ...(filters.dateFrom && { gte: filters.dateFrom }),
        ...(filters.dateTo && { lte: filters.dateTo }),
      },
    });
  }

  if (filters.q?.trim()) {
    const q = filters.q.trim();
    and.push({
      OR: [
        { description: { contains: q, mode: "insensitive" as const } },
        {
          dossier: {
            client: { raisonSociale: { contains: q, mode: "insensitive" as const } },
          },
        },
      ],
    });
  }

  return { cabinetId, AND: and };
}

/**
 * Agrège les TimeEntry "à facturer" pour un cabinet.
 *
 * Règles canoniques (doctrine §3) :
 *  - `facturable: true`
 *  - `invoiceId: null` (jamais déjà attaché)
 *  - `isWrittenOff: false` (la doctrine exclut les write-offs)
 *  - `billingStatus IN [NON_BILLED, READY_TO_BILL]` ou `billingStatus: null`
 *
 * Décomposition en deux aggregates pour respecter `feeAmount ?? montant`
 * sans recourir à un `findMany` (qui exploserait la mémoire sur les gros cabinets).
 */
export async function aggregateBillableTimeEntries(
  prisma: PrismaClient,
  cabinetId: string,
): Promise<BillableTimeAggregate> {
  const baseWhere = buildUnsentBillableTimeEntryWhere(cabinetId);

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

export async function aggregateBillableExpenses(
  prisma: PrismaClient,
  cabinetId: string,
): Promise<BillableExpenseAggregate> {
  const result = await prisma.expense.aggregate({
    where: buildFacturableKpiExpenseWhere(cabinetId),
    _count: { _all: true },
    _sum: { amount: true },
  });

  return {
    count: result._count?._all ?? 0,
    total: result._sum?.amount ?? 0,
  };
}

/**
 * Agrège les tâches forfaitaires prêtes à facturer.
 *
 * Une tâche du registre est facturable tant qu'elle est complétée et qu'elle
 * n'est pas déjà attachée à une ligne de facture.
 */
export async function aggregateBillableRegistreTaches(
  prisma: PrismaClient,
  cabinetId: string,
): Promise<BillableForfaitAggregate> {
  const result = await prisma.registreTache.aggregate({
    where: buildFacturableKpiRegistreTacheWhere(cabinetId),
    _count: { _all: true },
    _sum: { montantFinal: true },
  });

  return {
    count: result._count?._all ?? 0,
    total: result._sum?.montantFinal ?? 0,
  };
}

/**
 * Compte les clients distincts qui ont au moins un élément à facturer.
 *
 * Le KPI principal "Facturables" affiche des clients à traiter, pas le
 * nombre de lignes sous-jacentes.
 */
export async function countBillableClients(
  prisma: PrismaClient,
  cabinetId: string,
): Promise<number> {
  const [timeEntries, expenses, registreTaches] = await Promise.all([
    prisma.timeEntry.findMany({
      where: buildUnsentBillableTimeEntryWhere(cabinetId),
      select: {
        clientId: true,
        dossier: { select: { clientId: true } },
      },
    }),
    prisma.expense.findMany({
      where: buildFacturableKpiExpenseWhere(cabinetId),
      select: { clientId: true },
    }),
    prisma.registreTache.findMany({
      where: buildFacturableKpiRegistreTacheWhere(cabinetId),
      select: {
        clientId: true,
        dossier: { select: { clientId: true } },
      },
    }),
  ]);

  const clientIds = new Set<string>();
  for (const entry of timeEntries) {
    const clientId = entry.clientId ?? entry.dossier?.clientId;
    if (clientId) clientIds.add(clientId);
  }
  for (const expense of expenses) {
    if (expense.clientId) clientIds.add(expense.clientId);
  }
  for (const tache of registreTaches) {
    const clientId = tache.clientId ?? tache.dossier?.clientId;
    if (clientId) clientIds.add(clientId);
  }

  return clientIds.size;
}
