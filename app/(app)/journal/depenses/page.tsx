import { requirePageAccess } from "@/lib/auth/page-guard";
import { canManageExpenseJournal, canViewComptabilite } from "@/lib/auth/permissions";
import { prisma } from "@/lib/db";
import { ensureExpenseCategories } from "./actions";
import { ExpenseJournalPageView } from "./ExpenseJournalPageView";

export default async function JournalDepensesPage() {
  const { cabinetId, role } = await requirePageAccess(canViewComptabilite);
  await ensureExpenseCategories(cabinetId);

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  const yearStart = new Date(now.getFullYear(), 0, 1);

  const [
    expensesMonth,
    expensesYear,
    uncategorizedCount,
    toValidateCount,
    importedThisMonth,
    expensesByCategory,
    refacturableSum,
    totalValidated,
    sessions,
    categories,
    transactions,
  ] = await Promise.all([
    prisma.cabinetExpense.aggregate({
      where: {
        cabinetId,
        date: { gte: monthStart, lte: monthEnd },
        typeTransaction: "DEPENSE",
      },
      _sum: { montant: true },
    }),
    prisma.cabinetExpense.aggregate({
      where: {
        cabinetId,
        date: { gte: yearStart },
        typeTransaction: "DEPENSE",
      },
      _sum: { montant: true },
    }),
    prisma.bankImportTransaction.count({
      where: {
        cabinetId,
        status: "new",
      },
    }),
    prisma.bankImportTransaction.count({
      where: {
        cabinetId,
        status: { in: ["to_validate", "categorized"] },
      },
    }),
    prisma.bankImportTransaction.count({
      where: {
        cabinetId,
        date: { gte: monthStart, lte: monthEnd },
      },
    }),
    prisma.cabinetExpense.groupBy({
      by: ["categoryName"],
      where: {
        cabinetId,
        date: { gte: monthStart, lte: monthEnd },
        typeTransaction: "DEPENSE",
      },
      _sum: { montant: true },
    }),
    prisma.cabinetExpense.aggregate({
      where: {
        cabinetId,
        date: { gte: monthStart, lte: monthEnd },
        refacturable: true,
      },
      _sum: { montant: true },
    }),
    prisma.cabinetExpense.aggregate({
      where: {
        cabinetId,
        date: { gte: monthStart, lte: monthEnd },
      },
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
  ]);

  const totalMonth = expensesMonth._sum.montant ?? 0;
  const totalYear = expensesYear._sum.montant ?? 0;
  const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
  const prevMonthAgg = await prisma.cabinetExpense.aggregate({
    where: {
      cabinetId,
      date: { gte: prevMonthStart, lte: prevMonthEnd },
      typeTransaction: "DEPENSE",
    },
    _sum: { montant: true },
  });
  const prevMonthTotal = prevMonthAgg._sum.montant ?? 0;
  const variation =
    prevMonthTotal > 0
      ? ((totalMonth - prevMonthTotal) / prevMonthTotal) * 100
      : null;

  const byCategorySorted = [...expensesByCategory].sort(
    (a, b) => (b._sum.montant ?? 0) - (a._sum.montant ?? 0)
  );
  const topCategoryName = byCategorySorted[0]?.categoryName ?? null;
  const topCategoryAmount = byCategorySorted[0]?._sum.montant ?? 0;

  const kpis = {
    totalMonth,
    totalYear,
    uncategorizedCount,
    toValidateCount,
    topCategoryName,
    topCategoryAmount,
    importedThisMonth,
    variation,
    byCategory: expensesByCategory.map((c) => ({
      name: c.categoryName ?? "Sans catégorie",
      total: c._sum.montant ?? 0,
    })),
    refacturableSum: refacturableSum._sum.montant ?? 0,
    totalValidated: totalValidated._sum.montant ?? 0,
  };

  // Lot 1, spec dépenses §2.1 — les dépenses dont la taxe n'est qu'ESTIMÉE.
  //
  // Tant qu'une ligne est ici, la taxe qu'elle porte n'est pas réclamable et le
  // cabinet remet trop. C'est une liste qui se vide, donc elle est bornée et triée
  // du plus ancien au plus récent : on remonte la dette, on ne feuillette pas.
  const aConfirmer = await prisma.cabinetExpense.findMany({
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
  });

  return (
    <ExpenseJournalPageView
      cabinetId={cabinetId}
      kpis={kpis}
      sessions={sessions}
      categories={categories}
      transactions={transactions}
      taxesAConfirmer={aConfirmer.map((d) => ({
        id: d.id,
        date: d.date.toISOString(),
        // Le nom normalisé quand on l'a : « BUREAU EN GROS » se reconnaît mieux
        // que « BUREAU EN GROS #4412 MTL QC 08-14 ».
        libelle: d.fournisseurNormalise ?? d.descriptionBancaire,
        categorieName: d.categoryName,
        montant: d.montant,
        tps: d.tps ?? 0,
        tvq: d.tvq ?? 0,
      }))}
      canWrite={canManageExpenseJournal(role)}
    />
  );
}
