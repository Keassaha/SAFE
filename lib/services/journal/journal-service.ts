/**
 * Service Journal Général — logique métier centralisée.
 * Append-only : aucune modification ni suppression des écritures.
 */

import type { Prisma, PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/db";
import type {
  JournalEntryCreateInput,
  JournalFiltersInput,
  JournalListParams,
  JournalEntryRow,
  JournalKpiData,
} from "@/types/journal";
import type { JournalTransactionType, JournalSourceModule } from "@prisma/client";
import { computeJournalKpis } from "./kpi";

/**
 * Type du client Prisma accepté : soit le client global, soit un `TransactionClient`
 * issu de `prisma.$transaction(async tx => ...)`. Permet d'enchaîner plusieurs
 * écritures dans la même transaction atomique.
 */
type JournalPrismaClient = PrismaClient | Prisma.TransactionClient;

/**
 * Crée une écriture au journal (append-only). Calcule le solde courant.
 *
 * Le paramètre optionnel `client` permet d'exécuter dans une transaction Prisma —
 * indispensable quand l'écriture journal doit rester atomique avec la création
 * de l'entité métier source (ex: `CabinetExpense` validée).
 */
export async function createJournalEntry(
  input: JournalEntryCreateInput,
  client: JournalPrismaClient = prisma,
): Promise<{ id: string }> {
  if (client === prisma) {
    return prisma.$transaction((tx) => createJournalEntry(input, tx));
  }

  await client.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${input.cabinetId}))`;

  const lastEntry = await client.journalGeneralEntry.findFirst({
    where: { cabinetId: input.cabinetId },
    orderBy: [{ dateTransaction: "desc" }, { createdAt: "desc" }],
    select: { solde: true },
  });
  const previousSolde = lastEntry?.solde ?? 0;
  const solde =
    previousSolde + input.montantEntree - input.montantSortie;

  const entry = await client.journalGeneralEntry.create({
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

  return { entries: rows, totalCount };
}

/**
 * Calcule les indicateurs du journal (période optionnelle = ce mois par défaut).
 *
 * Délègue le classement à `computeJournalKpis` (fonction PURE et testée) : aucun
 * indicateur ne dépend du `solde` cumulé stocké par ligne (qui serait faux si une
 * écriture est antidatée). Les comptes à recevoir proviennent du module facturation
 * (Σ des soldes dus des factures ouvertes), pas du journal.
 *
 * NOTE D'ÉCHELLE : on charge les écritures du cabinet pour reclasser les flux par
 * type en mémoire. Suffisant pour des cabinets solo/petits ; à remplacer par des
 * agrégats SQL groupés par type si le volume d'écritures devient important.
 */
export async function calculateJournalBalance(
  cabinetId: string,
  options?: { dateFrom?: Date; dateTo?: Date }
): Promise<JournalKpiData> {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  const from = options?.dateFrom ?? monthStart;
  const to = options?.dateTo ?? monthEnd;
  // Mois précédent ancré au 1er du mois (évite tout débordement de setMonth si
  // un appelant passe un dateFrom personnalisé tombant un 29/30/31).
  const prevFrom = new Date(from.getFullYear(), from.getMonth() - 1, 1);
  const prevTo = new Date(from.getTime() - 1);

  const [entries, arAgg] = await Promise.all([
    prisma.journalGeneralEntry.findMany({
      where: { cabinetId },
      select: {
        typeTransaction: true,
        sourceModule: true,
        montantEntree: true,
        montantSortie: true,
        dateTransaction: true,
      },
    }),
    // Comptes à recevoir = Σ des soldes dus des factures OUVERTES (source : facturation).
    // R2 : on ne somme que les soldes réellement DUS (> 0). Un surpaiement
    // (balanceDue < 0, crédit client) ne doit JAMAIS réduire les comptes à recevoir.
    prisma.invoice.aggregate({
      where: {
        cabinetId,
        invoiceStatus: { in: ["ISSUED", "PARTIALLY_PAID", "OVERDUE"] },
        balanceDue: { gt: 0 },
      },
      _sum: { balanceDue: true },
    }),
  ]);

  return computeJournalKpis(entries, arAgg._sum.balanceDue ?? 0, {
    from,
    to,
    prevFrom,
    prevTo,
  });
}
