import { requireCabinetId } from "@/lib/auth/session";
import { calculateJournalBalance } from "@/lib/services/journal";
import { prisma } from "@/lib/db";
import { ensureExpenseCategories } from "@/app/(app)/journal/depenses/actions";
import { ComptabilitePageView } from "./ComptabilitePageView";

export default async function ComptabilitePage() {
  const cabinetId = await requireCabinetId();

  const [journalKpis, expenseData] = await Promise.all([
    calculateJournalBalance(cabinetId),
    loadExpenseJournalData(cabinetId),
  ]);

  return (
    <ComptabilitePageView
      cabinetId={cabinetId}
      initialJournalKpis={journalKpis}
      expenseData={expenseData}
    />
  );
}

async function loadExpenseJournalData(cabinetId: string) {
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
      where: { cabinetId, status: "new" },
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

  return {
    kpis: {
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
    },
    sessions,
    categories,
    transactions,
  };
}
