import { requireCabinetAndUser } from "@/lib/auth/session";
import { getLocale, getTranslations } from "next-intl/server";
import { getEffectiveRole, userRoleToEmployeeRole } from "@/lib/auth/rbac";
import type { UserRole } from "@prisma/client";
import { prisma } from "@/lib/db";
import { formatCurrency } from "@/lib/utils/format";
import { toIntlLocale } from "@/lib/i18n/locale";
import { getGlobalTrustBalance } from "@/lib/services/fideicommis";
import { getDashboardVisibility } from "@/lib/dashboard/visibility";
import type {
  DashboardKpis,
  RevenueChartPoint,
  MonthlyComparisonRow,
  LawyerProductivityRow,
  ActiveCaseRow,
  OutstandingAccountRow,
  BillingFollowUpRow,
  DashboardAlert,
  ActivityFeedItem,
  DashboardPayload,
  DashboardTaskItem,
  DashboardEventItem,
  DossierEvolutionItem,
  DashboardIndicators,
  OnboardingChecklist,
} from "@/lib/dashboard/types";
import { routes } from "@/lib/routes";
import { DashboardView } from "@/components/dashboard/DashboardView";

function getMonthRange(year: number, month: number) {
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0, 23, 59, 59, 999);
  return { start, end };
}

export default async function TableauDeBordPage() {
  const { cabinetId, userId, role } = await requireCabinetAndUser();
  const locale = await getLocale();
  const intlLocale = toIntlLocale(locale);
  const t = await getTranslations("dashboard");
  const userRole = role as UserRole;

  const employee = await prisma.employee.findFirst({
    where: { cabinetId, userId },
    select: { role: true },
  });
  const effectiveRole = getEffectiveRole({ role: userRole }, employee);
  const visibility = getDashboardVisibility(effectiveRole);

  const now = new Date();
  const thisMonth = getMonthRange(now.getFullYear(), now.getMonth());
  const lastMonth = getMonthRange(
    now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear(),
    now.getMonth() === 0 ? 11 : now.getMonth() - 1
  );
  const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1);

  const [
    trustBalance,
    payments,
    recentPaymentsWithInvoice,
    invoiceThisMonth,
    invoiceLastMonth,
    paymentsThisMonthAgg,
    paymentsLastMonthAgg,
    outstandingInvoicesAgg,
    unbilledTimeEntriesAgg,
    expensesThisMonthAgg,
    expensesLastMonthAgg,
    invoicesForRevenueByMonth,
    timeEntriesForProductivity,
    activeDossiers,
    billingFollowUpInvoices,
    overdueInvoicesCount,
    auditLogs,
    deboursARefacturerAgg,
    deboursNonRemboursesAgg,
    rawTasks,
    rawEvents,
    dossiersForEvolution,
    cabinetForOnboarding,
    clientsCount,
    dossiersCount,
    timeEntriesCount,
    invoicesCount,
    invoicesSentCount,
    invoicesPendingCount,
    unbilledTimeEntriesCount,
    activeTrustAccountsCount,
    overdueInvoicesForInterest,
    outstandingByClient,
  ] = await Promise.all([
    getGlobalTrustBalance(cabinetId),
    prisma.payment.findMany({
      where: { cabinetId },
      select: { datePaiement: true, montant: true },
      orderBy: { datePaiement: "desc" },
      take: 500,
    }),
    prisma.payment.findMany({
      where: { cabinetId },
      select: {
        id: true,
        datePaiement: true,
        montant: true,
        invoice: { select: { numero: true, client: { select: { raisonSociale: true } } } },
      },
      orderBy: { datePaiement: "desc" },
      take: 10,
    }),
    prisma.invoice.aggregate({
      where: {
        cabinetId,
        statut: { not: "brouillon" },
        dateEmission: { gte: thisMonth.start, lte: thisMonth.end },
      },
      _sum: { montantTotal: true },
    }),
    prisma.invoice.aggregate({
      where: {
        cabinetId,
        statut: { not: "brouillon" },
        dateEmission: { gte: lastMonth.start, lte: lastMonth.end },
      },
      _sum: { montantTotal: true },
    }),
    prisma.payment.aggregate({
      where: {
        cabinetId,
        datePaiement: { gte: thisMonth.start, lte: thisMonth.end },
      },
      _sum: { montant: true },
    }),
    prisma.payment.aggregate({
      where: {
        cabinetId,
        datePaiement: { gte: lastMonth.start, lte: lastMonth.end },
      },
      _sum: { montant: true },
    }),
    prisma.invoice.aggregate({
      where: {
        cabinetId,
        statut: { in: ["envoyee", "partiellement_payee", "en_retard"] },
      },
      _sum: { balanceDue: true },
    }),
    prisma.timeEntry.aggregate({
      where: {
        cabinetId,
        statut: { not: "facture" },
        facturable: true,
        ...(visibility.personalScope ? { userId } : {}),
      },
      _sum: { montant: true, dureeMinutes: true },
    }),
    prisma.expense.aggregate({
      where: {
        cabinetId,
        expenseDate: { gte: thisMonth.start, lte: thisMonth.end },
      },
      _sum: { amount: true },
    }),
    prisma.expense.aggregate({
      where: {
        cabinetId,
        expenseDate: { gte: lastMonth.start, lte: lastMonth.end },
      },
      _sum: { amount: true },
    }),
    prisma.invoice.findMany({
      where: {
        cabinetId,
        statut: { not: "brouillon" },
        dateEmission: { gte: twelveMonthsAgo },
      },
      select: { dateEmission: true, montantTotal: true, montantPaye: true },
    }),
    prisma.timeEntry.findMany({
      where: {
        cabinetId,
        ...(visibility.personalScope ? { userId } : {}),
      },
      select: {
        userId: true,
        dureeMinutes: true,
        montant: true,
        facturable: true,
        statut: true,
      },
    }),
    prisma.dossier.findMany({
      where: {
        cabinetId,
        statut: "actif",
        ...(visibility.personalScope ? { avocatResponsableId: userId } : {}),
      },
      include: {
        client: { select: { raisonSociale: true } },
        avocatResponsable: { select: { nom: true } },
      },
      orderBy: { updatedAt: "desc" },
      take: 10,
    }),
    prisma.invoice.findMany({
      where: {
        cabinetId,
        statut: { in: ["brouillon", "envoyee", "en_retard"] },
      },
      include: { client: { select: { raisonSociale: true } } },
      orderBy: { dateEmission: "desc" },
      take: 10,
    }),
    prisma.invoice.count({
      where: { cabinetId, statut: "en_retard" },
    }),
    prisma.auditLog.findMany({
      where: {
        cabinetId,
        ...(visibility.personalScope ? { userId } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true,
        createdAt: true,
        action: true,
        entityType: true,
        entityId: true,
        user: { select: { nom: true } },
      },
    }),
    prisma.deboursDossier.aggregate({
      where: { cabinetId, refacturable: true, factureId: null },
      _sum: { montant: true },
    }),
    prisma.deboursDossier.aggregate({
      where: {
        cabinetId,
        payeParCabinet: true,
        OR: [
          { factureId: null },
          { facture: { paymentStatus: { not: "PAID" } } },
        ],
      },
      _sum: { montant: true },
    }),
    prisma.dossierTache.findMany({
      where: {
        dossier: { cabinetId },
        statut: { in: ["a_faire", "en_cours"] },
        ...(visibility.personalScope ? { assigneeId: userId } : {}),
      },
      include: {
        assignee: { select: { nom: true } },
        dossier: { select: { intitule: true } },
      },
      orderBy: [{ dateEcheance: "asc" }, { priorite: "desc" }],
      take: 20,
    }),
    prisma.dossierEvenement.findMany({
      where: {
        dossier: { cabinetId },
        date: { gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()) },
      },
      include: {
        dossier: { select: { intitule: true } },
      },
      orderBy: { date: "asc" },
      take: 20,
    }),
    prisma.dossier.findMany({
      where: {
        cabinetId,
        statut: "actif",
        ...(visibility.personalScope ? { avocatResponsableId: userId } : {}),
      },
      include: {
        client: { select: { raisonSociale: true } },
        avocatResponsable: { select: { nom: true } },
        taches: { select: { statut: true, dateEcheance: true } },
        evenements: { select: { date: true }, orderBy: { date: "asc" } },
      },
      orderBy: { updatedAt: "desc" },
      take: 30,
    }),
    prisma.cabinet.findUnique({
      where: { id: cabinetId },
      select: { nom: true, adresse: true },
    }),
    prisma.client.count({ where: { cabinetId } }),
    prisma.dossier.count({ where: { cabinetId } }),
    prisma.timeEntry.count({ where: { cabinetId } }),
    prisma.invoice.count({ where: { cabinetId } }),
    prisma.invoice.count({
      where: { cabinetId, statut: "envoyee" },
    }),
    prisma.invoice.count({
      where: { cabinetId, statut: "brouillon" },
    }),
    prisma.timeEntry.count({
      where: { cabinetId, statut: { not: "facture" }, facturable: true },
    }),
    prisma.trustAccount.count({
      where: { cabinetId },
    }).catch(() => 0 as number),
    prisma.invoice.findMany({
      where: { cabinetId, statut: "en_retard" },
      select: { balanceDue: true, dateEcheance: true },
    }),
    prisma.invoice.findMany({
      where: {
        cabinetId,
        statut: { in: ["envoyee", "partiellement_payee", "en_retard"] },
        balanceDue: { gt: 0 },
      },
      select: {
        clientId: true,
        balanceDue: true,
        dateEmission: true,
        client: { select: { id: true, raisonSociale: true } },
      },
      orderBy: { dateEmission: "asc" },
    }),
  ]);

  // ── Basic aggregates ──
  const revenueThisMonth = invoiceThisMonth._sum.montantTotal ?? 0;
  const revenueLastMonth = invoiceLastMonth._sum.montantTotal ?? 0;
  const paymentsThisMonth = paymentsThisMonthAgg._sum.montant ?? 0;
  const paymentsLastMonth = paymentsLastMonthAgg._sum.montant ?? 0;
  const outstandingTotal = outstandingInvoicesAgg._sum.balanceDue ?? 0;
  const unbilledValue = unbilledTimeEntriesAgg._sum.montant ?? 0;
  const unbilledMinutes = unbilledTimeEntriesAgg._sum.dureeMinutes ?? 0;
  const expensesThisMonth = expensesThisMonthAgg._sum.amount ?? 0;
  const expensesLastMonth = expensesLastMonthAgg._sum.amount ?? 0;

  // ── New metrics ──
  const cashNotReceived = revenueThisMonth - paymentsThisMonth;
  const recoveryRate = revenueThisMonth > 0 ? Math.round((paymentsThisMonth / revenueThisMonth) * 100) : 0;

  // Total hours worked and billed (all time entries)
  const totalMinutesWorked = timeEntriesForProductivity.reduce((sum, e) => sum + e.dureeMinutes, 0);
  const totalMinutesBilled = timeEntriesForProductivity
    .filter((e) => e.statut === "facture")
    .reduce((sum, e) => sum + e.dureeMinutes, 0);
  const totalHoursWorked = Math.round((totalMinutesWorked / 60) * 100) / 100;
  const totalHoursBilled = Math.round((totalMinutesBilled / 60) * 100) / 100;
  const billingRate = totalHoursWorked > 0 ? Math.round((totalHoursBilled / totalHoursWorked) * 100) : 0;

  // Revenue per lawyer
  const uniqueLawyerIds = [...new Set(timeEntriesForProductivity.map((e) => e.userId))];
  const lawyerCount = uniqueLawyerIds.length || 1;
  const revenuePerLawyer = revenueThisMonth / lawyerCount;

  // ── Interest calculation (14% annual on overdue) ──
  let accruedInterest = 0;
  for (const inv of overdueInvoicesForInterest) {
    if (inv.balanceDue > 0 && inv.dateEcheance) {
      const daysOverdue = Math.max(0, Math.floor((now.getTime() - new Date(inv.dateEcheance).getTime()) / (1000 * 60 * 60 * 24)));
      accruedInterest += inv.balanceDue * 0.14 * (daysOverdue / 365);
    }
  }
  accruedInterest = Math.round(accruedInterest * 100) / 100;

  // ── Outstanding accounts (Top 10) ──
  const clientBalanceMap = new Map<string, { clientName: string; balanceDue: number; firstInvoiceDate: Date }>();
  for (const inv of outstandingByClient) {
    const existing = clientBalanceMap.get(inv.clientId);
    const invDate = new Date(inv.dateEmission);
    if (existing) {
      existing.balanceDue += inv.balanceDue;
      if (invDate < existing.firstInvoiceDate) {
        existing.firstInvoiceDate = invDate;
      }
    } else {
      clientBalanceMap.set(inv.clientId, {
        clientName: inv.client.raisonSociale,
        balanceDue: inv.balanceDue,
        firstInvoiceDate: invDate,
      });
    }
  }
  const outstandingAccounts: OutstandingAccountRow[] = Array.from(clientBalanceMap.entries())
    .sort((a, b) => b[1].balanceDue - a[1].balanceDue)
    .slice(0, 10)
    .map(([clientId, data]) => {
      const daysSince = Math.floor((now.getTime() - data.firstInvoiceDate.getTime()) / (1000 * 60 * 60 * 24));
      let agingCategory = "Courant";
      if (daysSince > 120) agingCategory = "Critique";
      else if (daysSince > 90) agingCategory = "90+ jours";
      else if (daysSince > 60) agingCategory = "60+ jours";
      else if (daysSince > 30) agingCategory = "30+ jours";
      return {
        clientId,
        clientName: data.clientName,
        balanceDue: data.balanceDue,
        firstInvoiceDate: data.firstInvoiceDate,
        daysSinceFirstInvoice: daysSince,
        agingCategory,
      };
    });

  // ── Indicators ──
  const indicators: DashboardIndicators = {
    invoicesSent: invoicesSentCount,
    invoicesPending: invoicesPendingCount,
    timeEntries: timeEntriesCount,
    unbilledEntries: unbilledTimeEntriesCount,
    accruedInterest,
    activeTrustAccounts: activeTrustAccountsCount,
  };

  // ── Onboarding ──
  const allKpisZero =
    revenueThisMonth === 0 &&
    paymentsThisMonth === 0 &&
    outstandingTotal === 0 &&
    unbilledValue === 0 &&
    trustBalance === 0 &&
    expensesThisMonth === 0;

  const hasCabinetIdentity = Boolean(
    cabinetForOnboarding?.nom && cabinetForOnboarding?.adresse
  );
  const onboardingChecklist: OnboardingChecklist = {
    cabinetConfigured: hasCabinetIdentity,
    hasClient: clientsCount >= 1,
    hasDossier: dossiersCount >= 1,
    hasTimeEntry: timeEntriesCount >= 1,
    hasInvoice: invoicesCount >= 1,
  };

  // ── Trend helper ──
  const trend = (current: number, previous: number) =>
    previous === 0 ? (current > 0 ? 100 : 0) : Math.round(((current - previous) / previous) * 100);

  // ── KPIs (extended to 12) ──
  const unbilledHoursFormatted = Math.round((unbilledMinutes / 60) * 100) / 100;
  const kpis: DashboardKpis = {
    revenueThisMonth: {
      value: formatCurrency(revenueThisMonth, "CAD", locale),
      subtitle: t("billedThisMonth"),
      trend: trend(revenueThisMonth, revenueLastMonth),
      trendLabel: t("vsLastMonth"),
    },
    paymentsReceived: {
      value: formatCurrency(paymentsThisMonth, "CAD", locale),
      subtitle: t("collectedThisMonth"),
      trend: trend(paymentsThisMonth, paymentsLastMonth),
      trendLabel: t("vsLastMonth"),
    },
    outstandingInvoices: {
      value: formatCurrency(outstandingTotal, "CAD", locale),
      subtitle: t("unpaidInvoices"),
    },
    unbilledHoursValue: {
      value: formatCurrency(unbilledValue, "CAD", locale),
      subtitle: t("unbilledHours", { hours: unbilledHoursFormatted }),
    },
    trustBalance: {
      value: formatCurrency(trustBalance, "CAD", locale),
      subtitle: t("trustBalanceLabel"),
    },
    expensesThisMonth: {
      value: formatCurrency(expensesThisMonth, "CAD", locale),
      subtitle: t("expensesThisMonth"),
      trend: trend(expensesThisMonth, expensesLastMonth),
      trendLabel: t("vsLastMonth"),
    },
    cashNotReceived: {
      value: formatCurrency(cashNotReceived, "CAD", locale),
      subtitle: t("cashNotReceivedSub"),
    },
    recoveryRate: {
      value: `${recoveryRate}%`,
      subtitle: t("recoveryRateSub"),
    },
    hoursWorked: {
      value: `${totalHoursWorked} h`,
      subtitle: t("hoursWorkedSub"),
    },
    hoursBilled: {
      value: `${totalHoursBilled} h`,
      subtitle: t("hoursBilledSub"),
    },
    billingRate: {
      value: `${billingRate}%`,
      subtitle: t("billingRateSub"),
    },
    revenuePerLawyer: {
      value: formatCurrency(revenuePerLawyer, "CAD", locale),
      subtitle: t("revenuePerLawyerSub"),
    },
  };

  // ── Revenue chart (12 months) ──
  const byMonth: Record<string, number> = {};
  for (const p of payments) {
    const d = new Date(p.datePaiement);
    const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    byMonth[monthKey] = (byMonth[monthKey] ?? 0) + p.montant;
  }

  // Invoiced by month
  const invoicedByMonth: Record<string, number> = {};
  for (const inv of invoicesForRevenueByMonth) {
    const d = new Date(inv.dateEmission);
    const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    invoicedByMonth[monthKey] = (invoicedByMonth[monthKey] ?? 0) + inv.montantTotal;
  }

  const revenueChartData: RevenueChartPoint[] = Array.from({ length: 12 }, (_, i) => {
    const date = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    const label = new Intl.DateTimeFormat(intlLocale, { month: "short" }).format(date);
    return { monthKey: key, label, value: byMonth[key] ?? 0, invoiced: invoicedByMonth[key] ?? 0 };
  });

  // ── Monthly comparison table (Facturé vs Encaissé) ──
  const monthlyComparison: MonthlyComparisonRow[] = revenueChartData.map((point, i) => {
    const invoiced = point.invoiced ?? 0;
    const collected = point.value;
    const gap = invoiced - collected;
    const rate = invoiced > 0 ? Math.round((collected / invoiced) * 100) : 0;
    const prevCollected = i > 0 ? revenueChartData[i - 1].value : 0;
    const delta = prevCollected > 0 ? Math.round(((collected - prevCollected) / prevCollected) * 100) : 0;
    return { month: point.label, invoiced, collected, gap, rate, delta };
  });

  // ── Lawyer productivity ──
  const userIds = [...new Set(timeEntriesForProductivity.map((e) => e.userId))];
  const users = userIds.length
    ? await prisma.user.findMany({
        where: { id: { in: userIds }, cabinetId },
        select: { id: true, nom: true },
      })
    : [];
  const userMap = Object.fromEntries(users.map((u) => [u.id, u.nom]));

  const byUser = new Map<
    string,
    { totalMinutes: number; totalMontant: number; billableMinutes: number; billableMontant: number; unbilledMontant: number }
  >();
  for (const e of timeEntriesForProductivity) {
    const cur = byUser.get(e.userId) ?? {
      totalMinutes: 0,
      totalMontant: 0,
      billableMinutes: 0,
      billableMontant: 0,
      unbilledMontant: 0,
    };
    cur.totalMinutes += e.dureeMinutes;
    cur.totalMontant += e.montant;
    if (e.facturable) {
      cur.billableMinutes += e.dureeMinutes;
      cur.billableMontant += e.montant;
    }
    if (e.statut !== "facture") {
      cur.unbilledMontant += e.montant;
    }
    byUser.set(e.userId, cur);
  }
  const lawyerProductivity: LawyerProductivityRow[] = Array.from(byUser.entries()).map(
    ([uid, data]) => {
      const hw = Math.round((data.totalMinutes / 60) * 100) / 100;
      const bh = Math.round((data.billableMinutes / 60) * 100) / 100;
      return {
        userId: uid,
        lawyerName: userMap[uid] ?? "—",
        hoursWorked: hw,
        billableHours: bh,
        valueBillable: data.billableMontant,
        unbilledHours: data.unbilledMontant,
        billingRate: hw > 0 ? Math.round((bh / hw) * 100) : 0,
      };
    }
  );

  // ── Active cases ──
  const dossierIds = activeDossiers.map((d) => d.id);
  const [hoursByDossierRows, invoicedByDossierRows] =
    dossierIds.length > 0
      ? await Promise.all([
          prisma.timeEntry.groupBy({
            by: ["dossierId"],
            where: { cabinetId, dossierId: { in: dossierIds } },
            _sum: { dureeMinutes: true, montant: true },
          }),
          prisma.invoice.groupBy({
            by: ["dossierId"],
            where: { cabinetId, dossierId: { in: dossierIds } },
            _sum: { montantTotal: true },
          }),
        ])
      : [[], []];

  const hoursByDossierMap = new Map(
    (hoursByDossierRows as { dossierId: string | null; _sum: { dureeMinutes: number | null; montant: number | null } }[]).map((g) => [
      g.dossierId ?? "",
      { minutes: g._sum.dureeMinutes ?? 0, montant: g._sum.montant ?? 0 },
    ])
  );
  const invoicedByDossierMap = new Map(
    (invoicedByDossierRows as { dossierId: string | null; _sum: { montantTotal: number | null } }[]).map((r) => [
      r.dossierId ?? "",
      r._sum.montantTotal ?? 0,
    ])
  );

  const activeCases: ActiveCaseRow[] = activeDossiers.map((d) => {
    const h = hoursByDossierMap.get(d.id);
    const inv = invoicedByDossierMap.get(d.id) ?? 0;
    return {
      id: d.id,
      caseName: d.intitule,
      clientName: d.client.raisonSociale,
      lawyerName: d.avocatResponsable?.nom ?? null,
      hoursLogged: (h?.minutes ?? 0) / 60,
      amountInvoiced: inv,
      lastActivity: d.updatedAt,
    };
  });

  // ── Billing follow-up ──
  const billingFollowUp: BillingFollowUpRow[] = billingFollowUpInvoices.map((inv) => ({
    id: inv.id,
    clientName: inv.client.raisonSociale,
    invoiceNumber: inv.numero,
    amount: inv.montantTotal,
    dateIssued: inv.dateEmission,
    status:
      inv.statut === "brouillon"
        ? t("draft")
        : inv.statut === "envoyee"
          ? t("issued")
          : inv.statut === "en_retard"
            ? t("overdue")
            : inv.statut,
  }));

  // ── Alerts ──
  const alerts: DashboardAlert[] = [];
  if (overdueInvoicesCount > 0) {
    alerts.push({
      type: t("overdueInvoices"),
      message: t("overdueInvoicesCount", { count: overdueInvoicesCount }),
      href: routes.facturationSuivi,
    });
  }
  if (trustBalance < 0) {
    alerts.push({
      type: t("trustBalanceLabel"),
      message: t("trustBalanceNegative"),
      href: routes.comptes,
    });
  }
  if (unbilledValue > 0) {
    alerts.push({
      type: t("unbilledHours", { hours: "" }).trim(),
      message: t("unbilledHoursAlert", { amount: formatCurrency(unbilledValue, "CAD", locale) }),
      href: routes.temps,
    });
  }

  // ── Activity feed ──
  const activityFeed: ActivityFeedItem[] = auditLogs.map((log) => ({
    id: log.id,
    timestamp: log.createdAt,
    action: log.action,
    entityType: log.entityType,
    entityId: log.entityId,
    userDisplayName: log.user?.nom ?? null,
  }));

  const transactionItems = recentPaymentsWithInvoice
    .filter((p): p is typeof p & { invoice: NonNullable<typeof p.invoice> } => p.invoice != null)
    .map((p) => ({
      id: p.id,
      label: p.invoice.client.raisonSociale ?? `Facture ${p.invoice.numero}`,
      date: new Date(p.datePaiement).toLocaleDateString(intlLocale, {
        year: "2-digit",
        month: "2-digit",
        day: "2-digit",
      }),
      amount: p.montant,
      href: routes.rapports,
    }));

  const deboursARefacturer = deboursARefacturerAgg._sum.montant ?? 0;
  const deboursNonRembourses = deboursNonRemboursesAgg._sum.montant ?? 0;

  // ── Tasks & Events ──
  const upcomingTasks: DashboardTaskItem[] = rawTasks.map((t) => ({
    id: t.id,
    titre: t.titre,
    description: t.description,
    priorite: t.priorite,
    statut: t.statut,
    dateEcheance: t.dateEcheance ? t.dateEcheance.toISOString() : null,
    assigneeName: t.assignee?.nom ?? null,
    dossierIntitule: t.dossier.intitule,
    dossierId: t.dossierId,
  }));

  const upcomingEvents: DashboardEventItem[] = rawEvents.map((e) => ({
    id: e.id,
    type: e.type,
    titre: e.titre,
    date: e.date.toISOString(),
    lieu: e.lieu,
    dossierIntitule: e.dossier.intitule,
    dossierId: e.dossierId,
  }));

  // ── Dossier evolution ──
  const dossierEvolution: DossierEvolutionItem[] = dossiersForEvolution.map((d) => {
    const tasksDone = d.taches.filter((t) => t.statut === "terminee").length;
    const futureDeadlines = d.taches
      .map((t) => t.dateEcheance)
      .filter((dt): dt is Date => dt != null && new Date(dt) >= now)
      .sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
    const futureEvents = d.evenements
      .filter((e) => new Date(e.date) >= now)
      .map((e) => e.date);
    const allFutureDates = [...futureDeadlines.map((d) => new Date(d)), ...futureEvents.map((d) => new Date(d))]
      .sort((a, b) => a.getTime() - b.getTime());

    return {
      id: d.id,
      intitule: d.intitule,
      statut: d.statut,
      clientName: d.client.raisonSociale,
      avocatName: d.avocatResponsable?.nom ?? null,
      createdAt: d.createdAt.toISOString(),
      updatedAt: d.updatedAt.toISOString(),
      taskCount: d.taches.length,
      tasksDone,
      eventCount: d.evenements.length,
      nextDeadline: allFutureDates.length > 0 ? allFutureDates[0].toISOString() : null,
    };
  });

  // ── Final payload ──
  const payload: DashboardPayload = {
    visibility,
    kpis,
    revenueChartData,
    monthlyComparison,
    lawyerProductivity,
    activeCases,
    outstandingAccounts,
    billingFollowUp,
    alerts,
    activityFeed,
    transactionItems,
    soldeFideicommis: formatCurrency(trustBalance, "CAD", locale),
    deboursARefacturer: formatCurrency(deboursARefacturer, "CAD", locale),
    deboursNonRembourses: formatCurrency(deboursNonRembourses, "CAD", locale),
    upcomingTasks,
    upcomingEvents,
    dossierEvolution,
    indicators,
    allKpisZero,
    onboardingChecklist,
  };

  return <DashboardView payload={payload} />;
}
