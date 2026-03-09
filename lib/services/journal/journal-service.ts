/**
 * Service Journal Général — logique métier centralisée.
 * Append-only : aucune modification ni suppression des écritures.
 */

import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import type {
  JournalEntryCreateInput,
  JournalFiltersInput,
  JournalListParams,
  JournalEntryRow,
  JournalKpiData,
} from "@/types/journal";
import type { JournalTransactionType, JournalSourceModule } from "@prisma/client";

/** Crée une écriture au journal (append-only). Calcule le solde courant. */
export async function createJournalEntry(
  input: JournalEntryCreateInput
): Promise<{ id: string }> {
  const lastEntry = await prisma.journalGeneralEntry.findFirst({
    where: { cabinetId: input.cabinetId },
    orderBy: [{ dateTransaction: "desc" }, { createdAt: "desc" }],
    select: { solde: true },
  });
  const previousSolde = lastEntry?.solde ?? 0;
  const solde =
    previousSolde + input.montantEntree - input.montantSortie;

  const entry = await prisma.journalGeneralEntry.create({
    data: {
      cabinetId: input.cabinetId,
      dateTransaction: input.dateTransaction,
      typeTransaction: input.typeTransaction,
      reference: input.reference ?? null,
      clientId: input.clientId ?? null,
      dossierId: input.dossierId ?? null,
      description: input.description,
      categorie: input.categorie ?? null,
      montantEntree: input.montantEntree,
      montantSortie: input.montantSortie,
      solde,
      sourceModule: input.sourceModule,
      sourceId: input.sourceId ?? null,
      utilisateurId: input.utilisateurId ?? null,
    },
    select: { id: true },
  });
  return { id: entry.id };
}

/** Crée une écriture corrective (type CORRECTION). Ne modifie jamais une ligne existante. */
export async function createCorrectiveJournalEntry(
  cabinetId: string,
  params: {
    dateTransaction: Date;
    description: string;
    montantEntree: number;
    montantSortie: number;
    reference?: string | null;
    sourceId?: string | null;
    utilisateurId?: string | null;
  }
): Promise<{ id: string }> {
  return createJournalEntry({
    cabinetId,
    dateTransaction: params.dateTransaction,
    typeTransaction: "CORRECTION",
    description: params.description,
    montantEntree: params.montantEntree,
    montantSortie: params.montantSortie,
    reference: params.reference ?? null,
    sourceModule: "CORRECTION_SYSTEME",
    sourceId: params.sourceId ?? null,
    utilisateurId: params.utilisateurId ?? null,
  });
}

function buildWhere(
  cabinetId: string,
  filters: Omit<JournalFiltersInput, "cabinetId">
): Prisma.JournalGeneralEntryWhereInput {
  const where: Prisma.JournalGeneralEntryWhereInput = { cabinetId };

  if (filters.dateFrom)
    where.dateTransaction = { ...((where.dateTransaction as object) ?? {}), gte: filters.dateFrom };
  if (filters.dateTo) {
    const endOfDay = new Date(filters.dateTo);
    endOfDay.setHours(23, 59, 59, 999);
    where.dateTransaction = {
      ...((where.dateTransaction as object) ?? {}),
      lte: endOfDay,
    };
  }
  if (filters.clientId) where.clientId = filters.clientId;
  if (filters.dossierId) where.dossierId = filters.dossierId;
  if (filters.typeTransaction) where.typeTransaction = filters.typeTransaction;
  if (filters.categorie) where.categorie = filters.categorie;
  if (filters.sourceModule) where.sourceModule = filters.sourceModule;
  if (filters.utilisateurId) where.utilisateurId = filters.utilisateurId;

  if (filters.entreesOnly) {
    where.montantEntree = { gt: 0 };
    where.montantSortie = 0;
  }
  if (filters.sortiesOnly) {
    where.montantSortie = { gt: 0 };
    where.montantEntree = 0;
  }

  if (filters.montantMin != null) {
    where.OR = [
      { montantEntree: { gte: filters.montantMin } },
      { montantSortie: { gte: filters.montantMin } },
    ];
  }
  if (filters.montantMax != null) {
    where.AND = [
      ...((where.AND as Prisma.JournalGeneralEntryWhereInput[]) ?? []),
      { montantEntree: { lte: filters.montantMax } },
      { montantSortie: { lte: filters.montantMax } },
    ];
  }

  if (filters.search?.trim()) {
    const q = filters.search.trim();
    where.OR = [
      { reference: { contains: q } },
      { description: { contains: q } },
      { categorie: { contains: q } },
      { client: { raisonSociale: { contains: q } } },
      { dossier: { intitule: { contains: q }, numeroDossier: { contains: q } } },
    ];
  }

  return where;
}

export interface GetJournalEntriesResult {
  entries: JournalEntryRow[];
  totalCount: number;
  soldeGlobal: number;
}

/** Liste les écritures du journal avec filtres et pagination. */
export async function getJournalEntries(
  params: JournalListParams
): Promise<GetJournalEntriesResult> {
  const where = buildWhere(params.cabinetId, params);
  const page = Math.max(1, params.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, params.pageSize ?? 50));
  const orderBy: Prisma.JournalGeneralEntryOrderByWithRelationInput[] = [
    { dateTransaction: params.orderDir ?? "desc" },
    { createdAt: params.orderDir ?? "desc" },
  ];

  const [entries, totalCount] = await Promise.all([
    prisma.journalGeneralEntry.findMany({
      where,
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        client: { select: { id: true, raisonSociale: true } },
        dossier: { select: { id: true, intitule: true, numeroDossier: true } },
        utilisateur: { select: { id: true, nom: true } },
      },
    }),
    prisma.journalGeneralEntry.count({ where }),
  ]);

  const lastSoldeEntry = await prisma.journalGeneralEntry.findFirst({
    where: { cabinetId: params.cabinetId },
    orderBy: [{ dateTransaction: "desc" }, { createdAt: "desc" }],
    select: { solde: true },
  });
  const soldeGlobal = lastSoldeEntry?.solde ?? 0;

  const rows: JournalEntryRow[] = entries.map((e) => ({
    id: e.id,
    dateTransaction: e.dateTransaction,
    typeTransaction: e.typeTransaction,
    reference: e.reference,
    clientId: e.clientId,
    clientName: e.client?.raisonSociale ?? null,
    dossierId: e.dossierId,
    dossierLabel: e.dossier ? `${e.dossier.numeroDossier ?? ""} ${e.dossier.intitule}`.trim() || e.dossier.intitule : null,
    description: e.description,
    categorie: e.categorie,
    montantEntree: e.montantEntree,
    montantSortie: e.montantSortie,
    solde: e.solde,
    sourceModule: e.sourceModule,
    sourceId: e.sourceId,
    utilisateurId: e.utilisateurId,
    utilisateurName: e.utilisateur?.nom ?? null,
    createdAt: e.createdAt,
  }));

  return { entries: rows, totalCount, soldeGlobal };
}

/** Calcule les agrégats pour les KPIs (période optionnelle = ce mois par défaut). */
export async function calculateJournalBalance(
  cabinetId: string,
  options?: { dateFrom?: Date; dateTo?: Date }
): Promise<JournalKpiData> {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  const dateFrom = options?.dateFrom ?? monthStart;
  const dateTo = options?.dateTo ?? monthEnd;

  const prevMonthStart = new Date(monthStart);
  prevMonthStart.setMonth(prevMonthStart.getMonth() - 1);
  const prevMonthEnd = new Date(monthStart.getTime() - 1);

  const wherePeriod: Prisma.JournalGeneralEntryWhereInput = {
    cabinetId,
    dateTransaction: { gte: dateFrom, lte: dateTo },
  };
  const wherePrevMonth: Prisma.JournalGeneralEntryWhereInput = {
    cabinetId,
    dateTransaction: { gte: prevMonthStart, lte: prevMonthEnd },
  };

  const [
    revTypes,
    depTypes,
    payTypes,
    trustTypes,
    allTypes,
    countThisMonth,
    prevRevenus,
    prevDepenses,
    lastSolde,
  ] = await Promise.all([
    prisma.journalGeneralEntry.aggregate({
      where: {
        ...wherePeriod,
        typeTransaction: { in: ["FACTURE", "PAIEMENT"] },
      },
      _sum: { montantEntree: true, montantSortie: true },
    }),
    prisma.journalGeneralEntry.aggregate({
      where: {
        ...wherePeriod,
        typeTransaction: { in: ["DEPENSE", "DEBOURS"] },
      },
      _sum: { montantEntree: true, montantSortie: true },
    }),
    prisma.journalGeneralEntry.aggregate({
      where: { ...wherePeriod, typeTransaction: "PAIEMENT" },
      _sum: { montantEntree: true },
    }),
    prisma.journalGeneralEntry.aggregate({
      where: {
        ...wherePeriod,
        typeTransaction: { in: ["DEPOT_FIDEICOMMIS", "RETRAIT_FIDEICOMMIS"] },
      },
      _sum: { montantEntree: true, montantSortie: true },
    }),
    prisma.journalGeneralEntry.aggregate({
      where: wherePeriod,
      _sum: { montantEntree: true, montantSortie: true },
    }),
    prisma.journalGeneralEntry.count({ where: wherePeriod }),
    prisma.journalGeneralEntry.aggregate({
      where: {
        ...wherePrevMonth,
        typeTransaction: { in: ["FACTURE", "PAIEMENT"] },
      },
      _sum: { montantEntree: true, montantSortie: true },
    }),
    prisma.journalGeneralEntry.aggregate({
      where: {
        ...wherePrevMonth,
        typeTransaction: { in: ["DEPENSE", "DEBOURS"] },
      },
      _sum: { montantEntree: true, montantSortie: true },
    }),
    prisma.journalGeneralEntry.findFirst({
      where: { cabinetId },
      orderBy: [{ dateTransaction: "desc" }, { createdAt: "desc" }],
      select: { solde: true },
    }),
  ]);

  const totalRevenus = (revTypes._sum.montantEntree ?? 0) - (revTypes._sum.montantSortie ?? 0);
  const totalDepenses = (depTypes._sum.montantSortie ?? 0) - (depTypes._sum.montantEntree ?? 0);
  const totalEncaisse = payTypes._sum.montantEntree ?? 0;
  const totalFideicommis =
    (trustTypes._sum.montantEntree ?? 0) - (trustTypes._sum.montantSortie ?? 0);
  const soldeGlobal = lastSolde?.solde ?? 0;

  return {
    totalRevenus,
    totalDepenses,
    totalEncaisse,
    totalFideicommis,
    soldeGlobal,
    nbTransactionsCeMois: countThisMonth,
    totalRevenusMoisPrecedent: (prevRevenus._sum.montantEntree ?? 0) - (prevRevenus._sum.montantSortie ?? 0),
    totalDepensesMoisPrecedent: (prevDepenses._sum.montantSortie ?? 0) - (prevDepenses._sum.montantEntree ?? 0),
  };
}
