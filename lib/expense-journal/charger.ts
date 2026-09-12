/**
 * SAFE — Chargement du journal des dépenses, en un seul endroit.
 *
 * Ces requêtes vivaient EN DOUBLE, recopiées entre `/journal/depenses` et
 * l'onglet de `/comptabilite`. Les deux entrées mènent au même écran : deux
 * copies, c'est la garantie qu'un jour l'une dira autre chose que l'autre.
 *
 * Et surtout : aucune des deux ne chargeait les DÉPENSES. Le tableau central
 * lisait `BankImportTransaction`, la file d'attente d'un relevé bancaire
 * importé. Un cabinet qui n'importe pas de relevé voyait donc « aucune
 * transaction » avec treize dépenses en base.
 */

import { prisma } from "@/lib/db";
import type { ExpenseJournalValidationStatus } from "@prisma/client";
import { ensureExpenseCategories } from "@/app/(app)/journal/depenses/actions";

/** Une dépense telle que le tableau la montre. Sérialisée : elle traverse le réseau. */
export interface DepenseListe {
  id: string;
  date: string;
  libelle: string;
  categoryId: string | null;
  categoryName: string | null;
  montant: number;
  tps: number;
  tvq: number;
  taxOrigin: "DECLAREE" | "ESTIMEE" | "AUCUNE" | null;
  statutValidation: ExpenseJournalValidationStatus;
  aUnePiece: boolean;
  /** Cochée « refacturable » : une somme avancée pour un client. */
  refacturable: boolean;
  dossierId: string | null;
}

export async function chargerJournalDepenses(cabinetId: string) {
  await ensureExpenseCategories(cabinetId);

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  const yearStart = new Date(now.getFullYear(), 0, 1);
  const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

  const [
    expensesMonth,
    expensesYear,
    expensesPrevMonth,
    uncategorizedCount,
    toValidateCount,
    importedThisMonth,
    expensesByCategory,
    refacturableSum,
    totalValidated,
    sessions,
    categories,
    transactions,
    depenses,
    sansOrigine,
    aConfirmer,
  ] = await Promise.all([
    prisma.cabinetExpense.aggregate({
      where: { cabinetId, date: { gte: monthStart, lte: monthEnd }, typeTransaction: "DEPENSE" },
      _sum: { montant: true },
    }),
    prisma.cabinetExpense.aggregate({
      where: { cabinetId, date: { gte: yearStart }, typeTransaction: "DEPENSE" },
      _sum: { montant: true },
    }),
    prisma.cabinetExpense.aggregate({
      where: {
        cabinetId,
        date: { gte: prevMonthStart, lte: prevMonthEnd },
        typeTransaction: "DEPENSE",
      },
      _sum: { montant: true },
    }),
    prisma.bankImportTransaction.count({ where: { cabinetId, status: "new" } }),
    prisma.bankImportTransaction.count({
      where: { cabinetId, status: { in: ["to_validate", "categorized"] } },
    }),
    prisma.bankImportTransaction.count({
      where: { cabinetId, date: { gte: monthStart, lte: monthEnd } },
    }),
    prisma.cabinetExpense.groupBy({
      by: ["categoryName"],
      where: { cabinetId, date: { gte: monthStart, lte: monthEnd }, typeTransaction: "DEPENSE" },
      _sum: { montant: true },
    }),
    prisma.cabinetExpense.aggregate({
      where: { cabinetId, date: { gte: monthStart, lte: monthEnd }, refacturable: true },
      _sum: { montant: true },
    }),
    prisma.cabinetExpense.aggregate({
      where: { cabinetId, date: { gte: monthStart, lte: monthEnd } },
      _sum: { montant: true },
    }),
    prisma.bankImportSession.findMany({
      where: { cabinetId },
      orderBy: { importedAt: "desc" },
      take: 5,
      include: { _count: { select: { transactions: true } } },
    }),
    prisma.expenseCategory.findMany({
      where: { cabinetId, isActive: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    }),
    prisma.bankImportTransaction.findMany({
      where: { cabinetId },
      orderBy: { date: "desc" },
      take: 200,
    }),
    /* LA LISTE QUI MANQUAIT. Le journal des dépenses montre les dépenses.
       Plafonné à 400 : au-delà, c'est un export qu'il faut, pas une page. */
    prisma.cabinetExpense.findMany({
      where: { cabinetId, typeTransaction: "DEPENSE" },
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      take: 400,
      select: {
        id: true,
        date: true,
        descriptionBancaire: true,
        fournisseurNormalise: true,
        categoryId: true,
        categoryName: true,
        montant: true,
        tps: true,
        tvq: true,
        taxOrigin: true,
        statutValidation: true,
        pieceStorageKey: true,
        refacturable: true,
        dossierId: true,
      },
    }),
    // Dépenses antérieures au calcul de taxe : leur taxe n'a jamais été établie.
    prisma.cabinetExpense.count({
      where: { cabinetId, taxOrigin: null, typeTransaction: "DEPENSE" },
    }),
    prisma.cabinetExpense.findMany({
      where: { cabinetId, taxOrigin: "ESTIMEE", typeTransaction: "DEPENSE" },
      orderBy: { date: "asc" },
      take: 200,
      select: {
        id: true,
        date: true,
        descriptionBancaire: true,
        fournisseurNormalise: true,
        categoryName: true,
        montant: true,
        tps: true,
        tvq: true,
      },
    }),
  ]);

  const totalMonth = expensesMonth._sum.montant ?? 0;
  const prevMonthTotal = expensesPrevMonth._sum.montant ?? 0;
  const byCategorySorted = [...expensesByCategory].sort(
    (a, b) => (b._sum.montant ?? 0) - (a._sum.montant ?? 0),
  );

  return {
    kpis: {
      totalMonth,
      totalYear: expensesYear._sum.montant ?? 0,
      uncategorizedCount,
      toValidateCount,
      topCategoryName: byCategorySorted[0]?.categoryName ?? null,
      topCategoryAmount: byCategorySorted[0]?._sum.montant ?? 0,
      importedThisMonth,
      variation:
        prevMonthTotal > 0 ? ((totalMonth - prevMonthTotal) / prevMonthTotal) * 100 : null,
      byCategory: expensesByCategory.map((c) => ({
        name: c.categoryName ?? "Sans catégorie",
        total: c._sum.montant ?? 0,
      })),
      refacturableSum: refacturableSum._sum.montant ?? 0,
      totalValidated: totalValidated._sum.montant ?? 0,
    },
    sessions,
    categories,
    transactions,
    depenses: depenses.map(
      (d): DepenseListe => ({
        id: d.id,
        date: d.date.toISOString(),
        /* Le nom normalisé quand on l'a : « BUREAU EN GROS » se reconnaît
           mieux que « BUREAU EN GROS #4412 MTL QC 08-14 ». */
        libelle: d.fournisseurNormalise ?? d.descriptionBancaire,
        categoryId: d.categoryId,
        categoryName: d.categoryName,
        montant: d.montant,
        tps: d.tps ?? 0,
        tvq: d.tvq ?? 0,
        taxOrigin: d.taxOrigin,
        statutValidation: d.statutValidation,
        aUnePiece: Boolean(d.pieceStorageKey),
        refacturable: d.refacturable,
        dossierId: d.dossierId,
      }),
    ),
    taxesSansOrigine: sansOrigine,
    taxesAConfirmer: aConfirmer.map((d) => ({
      id: d.id,
      date: d.date.toISOString(),
      libelle: d.fournisseurNormalise ?? d.descriptionBancaire,
      categorieName: d.categoryName,
      montant: d.montant,
      tps: d.tps ?? 0,
      tvq: d.tvq ?? 0,
    })),
  };
}
