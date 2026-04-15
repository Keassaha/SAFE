/**
 * Service de génération de rapports de conformité fidéicommis.
 * Format By-Law 9 LSO / B-1 r.5 Barreau QC.
 */

import { prisma } from "@/lib/db";
import { createAuditLog } from "@/lib/services/audit";

export interface GenerateReportParams {
  cabinetId: string;
  periode: string; // "YYYY-MM"
  type?: "monthly" | "quarterly" | "annual";
  generatedById: string;
}

interface TransactionRow {
  date: string;
  type: string;
  description: string | null;
  dossier: string | null;
  client: string | null;
  amount: number;
  balance: number;
}

interface ReportData {
  cabinetName: string;
  periode: string;
  type: string;
  generatedAt: string;
  generatedBy: string;
  soldeOuverture: number;
  soldeFermeture: number;
  totalDeposits: number;
  totalWithdrawals: number;
  transactions: TransactionRow[];
  reconciliation: {
    soldeBancaire: number;
    soldeRegistre: number;
    ecart: number;
    status: string;
    certifiedAt: string | null;
    certifiedBy: string | null;
  } | null;
  interetsLFO: number;
  nbTransactions: number;
}

/** Generate compliance report data for a given period. */
export async function generateReportData(params: GenerateReportParams): Promise<ReportData> {
  const { cabinetId, periode, type = "monthly" } = params;

  // Parse period to date range
  const [year, month] = periode.split("-").map(Number);
  let startDate: Date;
  let endDate: Date;

  if (type === "monthly") {
    startDate = new Date(year, month - 1, 1);
    endDate = new Date(year, month, 0, 23, 59, 59, 999);
  } else if (type === "quarterly") {
    const quarterStart = Math.floor((month - 1) / 3) * 3;
    startDate = new Date(year, quarterStart, 1);
    endDate = new Date(year, quarterStart + 3, 0, 23, 59, 59, 999);
  } else {
    startDate = new Date(year, 0, 1);
    endDate = new Date(year, 11, 31, 23, 59, 59, 999);
  }

  // Get cabinet info
  const cabinet = await prisma.cabinet.findUnique({
    where: { id: cabinetId },
    select: { nom: true },
  });

  // Get user who generated
  const user = await prisma.user.findUnique({
    where: { id: params.generatedById },
    select: { nom: true },
  });

  // Get all transactions for the period
  const transactions = await prisma.trustTransaction.findMany({
    where: {
      cabinetId,
      date: { gte: startDate, lte: endDate },
    },
    orderBy: { date: "asc" },
    include: {
      dossier: { select: { intitule: true, numeroDossier: true } },
      client: { select: { raisonSociale: true } },
    },
  });

  // Calculate opening balance (sum of all transactions before the period)
  const openingBalanceResult = await prisma.trustTransaction.aggregate({
    where: {
      cabinetId,
      date: { lt: startDate },
    },
    _sum: { amount: true },
  });
  const soldeOuverture = openingBalanceResult._sum.amount ?? 0;

  // Calculate totals
  let runningBalance = soldeOuverture;
  const transactionRows: TransactionRow[] = transactions.map((tx) => {
    runningBalance += tx.amount;
    return {
      date: tx.date.toISOString().split("T")[0],
      type: tx.type,
      description: tx.description,
      dossier: tx.dossier
        ? `${tx.dossier.numeroDossier || ""} — ${tx.dossier.intitule}`
        : null,
      client: tx.client?.raisonSociale ?? null,
      amount: tx.amount,
      balance: runningBalance,
    };
  });

  const totalDeposits = transactions
    .filter((t) => t.amount > 0)
    .reduce((sum, t) => sum + t.amount, 0);
  const totalWithdrawals = Math.abs(
    transactions.filter((t) => t.amount < 0).reduce((sum, t) => sum + t.amount, 0)
  );

  // Get reconciliation for this period
  const reconciliation = await prisma.trustReconciliation.findUnique({
    where: { cabinetId_periode: { cabinetId, periode } },
    include: { certifiedBy: { select: { nom: true } } },
  });

  return {
    cabinetName: cabinet?.nom ?? "Unknown",
    periode,
    type,
    generatedAt: new Date().toISOString(),
    generatedBy: user?.nom ?? "Unknown",
    soldeOuverture,
    soldeFermeture: runningBalance,
    totalDeposits,
    totalWithdrawals,
    transactions: transactionRows,
    reconciliation: reconciliation
      ? {
          soldeBancaire: reconciliation.soldeBancaire,
          soldeRegistre: reconciliation.soldeRegistre,
          ecart: reconciliation.ecart,
          status: reconciliation.status,
          certifiedAt: reconciliation.certifiedAt?.toISOString() ?? null,
          certifiedBy: reconciliation.certifiedBy?.nom ?? null,
        }
      : null,
    interetsLFO: reconciliation?.interetsLFO ?? 0,
    nbTransactions: transactions.length,
  };
}

/** Create and save a compliance report. */
export async function createComplianceReport(params: GenerateReportParams) {
  const { cabinetId, periode, type = "monthly", generatedById } = params;

  const reportData = await generateReportData(params);

  const reconciliation = await prisma.trustReconciliation.findUnique({
    where: { cabinetId_periode: { cabinetId, periode } },
  });

  const report = await prisma.trustComplianceReport.create({
    data: {
      cabinetId,
      periode,
      type,
      generatedById,
      status: "draft",
      data: JSON.stringify(reportData),
      reconciliationId: reconciliation?.id ?? null,
    },
  });

  await createAuditLog({
    cabinetId,
    userId: generatedById,
    entityType: "TrustAccount",
    entityId: report.id,
    action: "create",
    newValues: {
      type: "compliance_report",
      periode,
      reportType: type,
      nbTransactions: reportData.nbTransactions,
    },
    performedBy: generatedById,
    performedAt: new Date(),
  });

  return { report, data: reportData };
}

/** List compliance reports for a cabinet. */
export async function getComplianceReports(cabinetId: string) {
  return prisma.trustComplianceReport.findMany({
    where: { cabinetId },
    orderBy: { generatedAt: "desc" },
    include: {
      generatedBy: { select: { nom: true } },
      reconciliation: { select: { status: true, certifiedAt: true } },
    },
  });
}
