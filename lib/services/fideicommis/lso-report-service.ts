/**
 * Service de génération de rapports de conformité fidéicommis.
 * Format By-Law 9 LSO / B-1 r.5 Barreau QC.
 */

import { prisma } from "@/lib/db";
import { createAuditLog } from "@/lib/services/audit";
import { clientDisplayName } from "@/lib/clients/normalize-name";

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

interface MonthlyReconciliationRow {
  periode: string; // "YYYY-MM"
  status: string;
  certified: boolean;
  certifiedAt: string | null;
  ecart: number;
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
  /** Nombre de comptes fidéicommis avec un solde non nul (exigence rapport annuel Barreau). */
  nbActiveTrustAccounts: number;
  /**
   * Rapport annuel uniquement : état des 12 rapprochements mensuels de l'exercice.
   * `null` pour les rapports mensuels/trimestriels.
   */
  annualReconciliations: {
    months: MonthlyReconciliationRow[];
    allCertified: boolean;
    /** Mois (YYYY-MM) sans rapprochement certifié — bloquants pour le dépôt au Barreau. */
    missingOrUncertifiedMonths: string[];
    totalEcart: number;
  } | null;
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
      client: { select: { raisonSociale: true, prenom: true, nom: true } },
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
      client: tx.client ? clientDisplayName(tx.client, "") || null : null,
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

  // Nombre de comptes fidéicommis actifs (solde non nul) — exigence rapport annuel Barreau.
  const nbActiveTrustAccounts = await prisma.trustAccount.count({
    where: { cabinetId, currentBalance: { not: 0 } },
  });

  // Rapport annuel : vérifier les 12 rapprochements mensuels de l'exercice.
  let annualReconciliations: ReportData["annualReconciliations"] = null;
  if (type === "annual") {
    const yearReconciliations = await prisma.trustReconciliation.findMany({
      where: { cabinetId, periode: { startsWith: `${year}-` } },
    });
    const byPeriode = new Map(yearReconciliations.map((r) => [r.periode, r]));
    const months: MonthlyReconciliationRow[] = [];
    const missingOrUncertifiedMonths: string[] = [];
    let totalEcart = 0;
    for (let m = 1; m <= 12; m++) {
      const mPeriode = `${year}-${String(m).padStart(2, "0")}`;
      const rec = byPeriode.get(mPeriode);
      const certified = rec?.status === "certified" && rec?.certifiedAt != null;
      months.push({
        periode: mPeriode,
        status: rec?.status ?? "missing",
        certified,
        certifiedAt: rec?.certifiedAt?.toISOString() ?? null,
        ecart: rec?.ecart ?? 0,
      });
      if (!certified) missingOrUncertifiedMonths.push(mPeriode);
      totalEcart += rec?.ecart ?? 0;
    }
    annualReconciliations = {
      months,
      allCertified: missingOrUncertifiedMonths.length === 0,
      missingOrUncertifiedMonths,
      totalEcart,
    };
  }

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
    nbActiveTrustAccounts,
    annualReconciliations,
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
    // select explicite (sans les colonnes de certification) pour rester
    // compatible avant l'application de la migration de certification.
    select: { id: true, periode: true, type: true, status: true, generatedAt: true },
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

/**
 * Certifie (signe) la déclaration de conformité d'un rapport fidéicommis.
 *
 * Conformité Barreau (B-1 r.5) : pour un rapport ANNUEL, la certification est
 * refusée tant que les 12 rapprochements mensuels de l'exercice ne sont pas tous
 * certifiés (règle bloquante). La signature est posée par l'avocat responsable.
 */
export async function certifyComplianceReport(params: {
  cabinetId: string;
  reportId: string;
  certifiedById: string;
  declarationText?: string;
}): Promise<{ id: string }> {
  const { cabinetId, reportId, certifiedById, declarationText } = params;

  const report = await prisma.trustComplianceReport.findFirst({
    where: { id: reportId, cabinetId },
    select: { id: true, status: true, type: true, data: true, periode: true },
  });
  if (!report) throw new Error("Rapport introuvable");
  if (report.status === "final") throw new Error("Ce rapport est déjà certifié");

  // Règle bloquante pour le rapport annuel : tous les rapprochements certifiés.
  if (report.type === "annual") {
    let parsed: ReportData | null = null;
    try {
      parsed = report.data ? (JSON.parse(report.data) as ReportData) : null;
    } catch {
      parsed = null;
    }
    const annual = parsed?.annualReconciliations;
    if (!annual || !annual.allCertified) {
      const missing = annual?.missingOrUncertifiedMonths ?? [];
      throw new Error(
        `Certification refusée : les 12 rapprochements mensuels doivent être certifiés avant de signer le rapport annuel.${
          missing.length ? ` Mois manquants ou non certifiés : ${missing.join(", ")}.` : ""
        }`
      );
    }
  }

  const now = new Date();
  const updated = await prisma.trustComplianceReport.update({
    where: { id: reportId },
    data: {
      status: "final",
      certifiedById,
      certifiedAt: now,
      declarationText:
        declarationText ??
        "J'atteste, à titre d'avocat responsable, que les registres et rapprochements fidéicommis de la période sont exacts et conformes au règlement sur la comptabilité (B-1 r.5).",
    },
  });

  await createAuditLog({
    cabinetId,
    userId: certifiedById,
    entityType: "TrustAccount",
    entityId: reportId,
    action: "update",
    newValues: {
      type: "compliance_report_certified",
      periode: report.periode,
      reportType: report.type,
      certifiedAt: now.toISOString(),
    },
    performedBy: certifiedById,
    performedAt: now,
  });

  return { id: updated.id };
}

/** List compliance reports for a cabinet. */
export async function getComplianceReports(cabinetId: string) {
  // select explicite (sans les colonnes de certification) pour rester compatible
  // avant l'application de la migration de certification.
  return prisma.trustComplianceReport.findMany({
    where: { cabinetId },
    orderBy: { generatedAt: "desc" },
    select: {
      id: true,
      periode: true,
      type: true,
      status: true,
      generatedAt: true,
      generatedBy: { select: { nom: true } },
      reconciliation: { select: { status: true, certifiedAt: true } },
    },
  });
}
