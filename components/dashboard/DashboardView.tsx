"use client";

import type { ComponentType, ReactNode } from "react";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  Banknote,
  BriefcaseBusiness,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  FileCheck2,
  FileText,
  Landmark,
  ListTodo,
  Receipt,
  UserCheck,
  Wallet,
} from "lucide-react";
import { routes } from "@/lib/routes";
import { PageHeader } from "@/components/ui/PageHeader";
import {
  staggerContainer,
  staggerItem,
  staggerContainerReduced,
  staggerItemReduced,
  useSafeMotion,
} from "@/lib/motion";
import type {
  BillingFollowUpRow,
  DashboardPayload,
  DossierEvolutionItem,
  MonthlyComparisonRow,
  OutstandingAccountRow,
  TrustReconciliationSummary,
} from "@/lib/dashboard/types";
import { MarkSignalReadButton } from "./MarkSignalReadButton";

export interface DashboardViewProps {
  payload: DashboardPayload;
}

const TRUST_RECONCILIATION_ROUTE = "/comptes/rapprochement";
const OVERDUE_INVOICES_ROUTE = `${routes.facturationSuivi}?retard=1`;
const ACTIVE_CLIENTS_ROUTE = `${routes.clients}?status=actif`;

type Tone = "ok" | "warn" | "danger" | "neutral";

type ActionItem = {
  key: string;
  title: string;
  context: string;
  reason: string;
  href: string;
  tone: Tone;
  rank: number;
  icon: ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  extra?: ReactNode;
};

type PipelineColumn = {
  key: string;
  title: string;
  count: number;
  href: string;
  items: Array<{ id: string; label: string; sub?: string; href: string }>;
};

type TrustRisk = {
  severity: "danger" | "warn" | "ok";
  label: string;
  detail: string;
};

type HealthCard = {
  key: string;
  title: string;
  value: string;
  sub?: string;
  href: string;
  icon: ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  iconBg: string;
};

function toneBorder(tone: Tone) {
  if (tone === "danger") return "bg-[#FBE4DF] text-[#8A342A] border-[#EAB9AF]";
  if (tone === "warn") return "bg-[#FFF4D8] text-[#94620C] border-[#E7C66F]";
  if (tone === "ok") return "bg-[#E7F2EA] text-[#1F3A2E] border-[#BED6C6]";
  return "bg-[#F3F6F4] text-[#3B4A43] border-[#DCE5E0]";
}

function toneAccent(tone: Tone) {
  if (tone === "danger") return "border-l-[#C9655A]";
  if (tone === "warn") return "border-l-[#D2A53F]";
  if (tone === "ok") return "border-l-[#6FA383]";
  return "border-l-[#A9B6AF]";
}

function LinkLabel({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-[#1F3A2E] hover:underline"
    >
      {children}
      <ChevronRight className="h-3.5 w-3.5" aria-hidden />
    </Link>
  );
}

function SectionTitle({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-4 flex items-end justify-between gap-3">
      <div className="min-w-0">
        <h2 className="text-base font-semibold tracking-tight safe-text-title">{title}</h2>
        {subtitle && <p className="mt-0.5 text-xs leading-5 safe-text-secondary">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

function formatShortDate(value: Date | string | null, locale: string) {
  if (!value) return "—";
  return new Intl.DateTimeFormat(locale, { day: "2-digit", month: "short" }).format(new Date(value));
}

function daysUntil(value: Date | string | null) {
  if (!value) return null;
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const target = new Date(value);
  target.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - start.getTime()) / 86_400_000);
}

function parseFormattedMoney(value?: string) {
  if (!value) return 0;
  const normalized = value.replace(/[^\d,.-]/g, "").replace(/\s/g, "").replace(",", ".");
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function getTrustRisk(
  lastReconciliation: TrustReconciliationSummary | null | undefined,
  locale: string,
  t: ReturnType<typeof useTranslations>,
): TrustRisk {
  if (!lastReconciliation) {
    return {
      severity: "danger",
      label: t("trustNeverReconciled"),
      detail: t("trustNeverReconciledDetail"),
    };
  }
  if (Math.abs(lastReconciliation.ecart) > 0.01) {
    const amount = new Intl.NumberFormat(locale, {
      style: "currency",
      currency: "CAD",
      maximumFractionDigits: 2,
    }).format(Math.abs(lastReconciliation.ecart));
    return {
      severity: "danger",
      label: t("trustGap", { amount }),
      detail: t("trustGapDetail"),
    };
  }
  if (lastReconciliation.daysSince > 35) {
    return {
      severity: "warn",
      label: t("trustDaysSince", { days: lastReconciliation.daysSince }),
      detail: t("trustOutdatedDetail"),
    };
  }
  return {
    severity: "ok",
    label: t("trustUpToDate", { days: lastReconciliation.daysSince }),
    detail: t("trustOkDetail"),
  };
}

function isOverdueInvoice(row: BillingFollowUpRow) {
  const status = row.status.toLowerCase();
  return status.includes("retard") || status.includes("overdue");
}

function detectRisk(
  d: DossierEvolutionItem,
  t: ReturnType<typeof useTranslations>,
): { label: string; tone: Tone; rank: number } | null {
  const daysInactive = Math.round((Date.now() - new Date(d.updatedAt).getTime()) / 86_400_000);
  const deadlineDays = daysUntil(d.nextDeadline);
  if (deadlineDays !== null && deadlineDays < 0) {
    return { label: t("riskOverdueDeadline", { days: Math.abs(deadlineDays) }), tone: "danger", rank: 1 };
  }
  if (deadlineDays !== null && deadlineDays <= 7) {
    return {
      label: deadlineDays === 0 ? t("riskDeadlineToday") : t("riskDeadlineSoon", { days: deadlineDays }),
      tone: "warn",
      rank: 3,
    };
  }
  if (daysInactive > 30) {
    return { label: t("riskNoActivity", { days: daysInactive }), tone: "warn", rank: 3 };
  }
  if (d.taskCount > 0 && d.tasksDone / d.taskCount < 0.5) {
    return { label: t("riskChecklist", { done: d.tasksDone, total: d.taskCount }), tone: "warn", rank: 4 };
  }
  return null;
}

function buildActionItems(
  payload: DashboardPayload,
  trustRisk: TrustRisk,
  locale: string,
  t: ReturnType<typeof useTranslations>,
): ActionItem[] {
  const items: ActionItem[] = [];

  if (payload.visibility.showTrustBalance && trustRisk.severity !== "ok") {
    items.push({
      key: "trust-reconciliation",
      title: t("actionTrust"),
      context: t("actionTrustContext"),
      reason: trustRisk.detail,
      href: TRUST_RECONCILIATION_ROUTE,
      tone: trustRisk.severity === "danger" ? "danger" : "warn",
      rank: 1,
      icon: Landmark,
    });
  }

  if (payload.visibility.showBillingFollowUp) {
    payload.billingFollowUp
      .filter(isOverdueInvoice)
      .slice(0, 2)
      .forEach((invoice) => {
        items.push({
          key: `invoice-${invoice.id}`,
          title: t("actionInvoiceFollowup"),
          context: `${invoice.clientName} · ${invoice.invoiceNumber}`,
          reason: t("actionInvoiceReason", {
            amount: invoice.amount.toLocaleString(locale, {
              style: "currency",
              currency: "CAD",
              maximumFractionDigits: 0,
            }),
          }),
          href: routes.facturationSuivi,
          tone: "danger",
          rank: 2,
          icon: Receipt,
        });
      });

    const disbursements = parseFormattedMoney(payload.deboursARefacturer);
    if (disbursements > 0) {
      items.push({
        key: "disbursements",
        title: t("actionDisbursements"),
        context: t("actionBillingContext"),
        reason: t("actionDisbursementsReason", { amount: payload.deboursARefacturer ?? "" }),
        href: routes.facturationFrais,
        tone: "warn",
        rank: 2,
        icon: Banknote,
      });
    }

    const unbilledValue = parseFormattedMoney(payload.kpis.unbilledHoursValue.value);
    if (unbilledValue > 0) {
      items.push({
        key: "ready-to-bill",
        title: t("actionReadyToBill"),
        context: t("actionBillingContext"),
        reason: t("actionReadyToBillReason", { amount: payload.kpis.unbilledHoursValue.value }),
        href: routes.facturationHonoraires,
        tone: "warn",
        rank: 2,
        icon: CircleDollarSign,
      });
    }
  }

  payload.upcomingTasks
    .filter((task) => {
      const d = daysUntil(task.dateEcheance);
      return d !== null && d <= 7;
    })
    .slice(0, 2)
    .forEach((task) => {
      const d = daysUntil(task.dateEcheance);
      items.push({
        key: `task-${task.id}`,
        title: task.titre,
        context: task.dossierIntitule,
        reason:
          d !== null && d < 0
            ? t("actionTaskOverdue", { days: Math.abs(d) })
            : t("actionTaskDue", { date: formatShortDate(task.dateEcheance, locale) }),
        href: routes.dossier(task.dossierId),
        tone: d !== null && d < 0 ? "danger" : "warn",
        rank: d !== null && d < 0 ? 1 : 3,
        icon: ListTodo,
      });
    });

  payload.upcomingEvents.slice(0, 2).forEach((event) => {
    const d = daysUntil(event.date);
    if (d !== null && d <= 7) {
      items.push({
        key: `event-${event.id}`,
        title: event.titre,
        context: event.dossierIntitule,
        reason:
          d === 0 ? t("actionEventToday") : t("actionEventDate", { date: formatShortDate(event.date, locale) }),
        href: routes.dossier(event.dossierId),
        tone: d < 0 ? "danger" : "warn",
        rank: 3,
        icon: CalendarClock,
      });
    }
  });

  payload.readyForReviewSignals.slice(0, 3).forEach((signal) => {
    items.push({
      key: `ready-${signal.id}`,
      title: t("actionReady"),
      context: `${signal.clientName ?? t("noClient")} · ${signal.numeroDossier ?? signal.dossierIntitule}`,
      reason: signal.reason ?? t("actionReadyDefault"),
      href: routes.dossier(signal.dossierId),
      tone: "ok",
      rank: 4,
      icon: FileCheck2,
      extra: <MarkSignalReadButton signalId={signal.id} />,
    });
  });

  payload.dossierEvolution
    .map((d) => ({ dossier: d, risk: detectRisk(d, t) }))
    .filter((x): x is { dossier: DossierEvolutionItem; risk: NonNullable<ReturnType<typeof detectRisk>> } => x.risk !== null)
    .slice(0, 2)
    .forEach(({ dossier, risk }) => {
      items.push({
        key: `risk-${dossier.id}`,
        title: t("actionRisk"),
        context: `${dossier.clientName} · ${dossier.intitule}`,
        reason: risk.label,
        href: routes.dossier(dossier.id),
        tone: risk.tone,
        rank: risk.rank,
        icon: AlertTriangle,
      });
    });

  return items.sort((a, b) => a.rank - b.rank).slice(0, 6);
}

function buildPipelineColumns(
  payload: DashboardPayload,
  t: ReturnType<typeof useTranslations>,
): PipelineColumn[] {
  const byStatus = (status: string) => payload.dossierEvolution.filter((d) => d.statut === status);
  const byStep = (step: string) => payload.dossierEvolution.filter((d) => d.etape === step);
  const readySignals = payload.readyForReviewSignals;
  const toDossierItems = (rows: DossierEvolutionItem[]) =>
    rows.slice(0, 3).map((d) => ({
      id: d.id,
      label: d.clientName || d.intitule,
      sub: d.intitule,
      href: routes.dossier(d.id),
    }));
  const readyItems = readySignals.slice(0, 3).map((s) => ({
    id: s.id,
    label: s.clientName ?? s.dossierIntitule,
    sub: s.numeroDossier ?? t("pipelineReadyForReview"),
    href: routes.dossier(s.dossierId),
  }));
  const billableItems = payload.activeCases.slice(0, 3).map((d) => ({
    id: d.id,
    label: d.clientName || d.caseName,
    sub: d.caseName,
    href: routes.dossier(d.id),
  }));

  const open = [...byStatus("ouvert"), ...byStep("Ouverture")].filter(
    (d, index, list) => list.findIndex((x) => x.id === d.id) === index,
  );
  const preparation = byStep("Exécution");
  const waiting = byStatus("en_attente");

  return [
    {
      key: "open",
      title: t("pipelineOpen"),
      count: payload.dossiersParStatut.ouvert || open.length,
      href: routes.dossiers,
      items: toDossierItems(open),
    },
    {
      key: "prep",
      title: t("pipelinePrep"),
      count: preparation.length || payload.dossiersParStatut.actif,
      href: routes.dossiers,
      items: toDossierItems(preparation),
    },
    {
      key: "waiting",
      title: t("pipelineWaiting"),
      count: payload.dossiersParStatut.en_attente || waiting.length,
      href: routes.dossiers,
      items: toDossierItems(waiting),
    },
    {
      key: "review",
      title: t("pipelineReview"),
      count: readySignals.length,
      href: routes.gestionAssistante,
      items: readyItems,
    },
    {
      key: "bill",
      title: t("pipelineBill"),
      count: payload.indicators.unbilledEntries,
      href: routes.facturationHonoraires,
      items: billableItems,
    },
  ];
}

function buildHealthCards(
  payload: DashboardPayload,
  trustRisk: TrustRisk,
  totalOutstanding: number,
  totalClients: number,
  t: ReturnType<typeof useTranslations>,
): HealthCard[] {
  const activePercent =
    totalClients > 0 ? Math.round((payload.activeClientsCount / totalClients) * 100) : 0;

  const cards: HealthCard[] = [
    {
      key: "activeClients",
      title: t("kpiActiveClients"),
      value: payload.activeClientsCount.toLocaleString("fr-CA"),
      sub: totalClients > 0 ? t("kpiActiveClientsSub", { percent: activePercent }) : undefined,
      href: ACTIVE_CLIENTS_ROUTE,
      icon: UserCheck,
      iconBg: "bg-status-success-bg text-status-success",
    },
  ];

  if (payload.visibility.showFinancialKpis) {
    cards.push({
      key: "collected",
      title: t("kpiCollected"),
      value: payload.kpis.paymentsReceived.value,
      sub: payload.kpis.paymentsReceived.trendLabel,
      href: routes.facturationPaiements,
      icon: Wallet,
      iconBg: "bg-green-100 text-[var(--safe-icon-default)]",
    });
    cards.push({
      key: "outstanding",
      title: t("kpiOutstanding"),
      value: payload.kpis.outstandingInvoices.value,
      sub:
        payload.outstandingAccounts.length > 0
          ? t("kpiOutstandingSub", { count: payload.outstandingAccounts.length })
          : undefined,
      href: routes.facturationSuivi,
      icon: Receipt,
      iconBg: totalOutstanding > 0 ? "bg-[#FFF4D8] text-[#94620C]" : "bg-green-100 text-green-700",
    });
  }

  cards.push({
    key: "activeMatters",
    title: t("kpiActiveMatters"),
    value: payload.activeDossiersCount.toLocaleString("fr-CA"),
    sub:
      payload.dossiersParStatut.en_attente > 0
        ? t("kpiActiveMattersSub", { count: payload.dossiersParStatut.en_attente })
        : undefined,
    href: routes.dossiers,
    icon: BriefcaseBusiness,
    iconBg: "bg-green-100 text-green-700",
  });

  if (payload.visibility.showTrustBalance) {
    cards.push({
      key: "trust",
      title: t("kpiTrust"),
      value: payload.soldeFideicommis ?? payload.kpis.trustBalance.value,
      sub: trustRisk.label,
      href: routes.comptes,
      icon: Landmark,
      iconBg:
        trustRisk.severity === "danger"
          ? "bg-[#FBE4DF] text-[#8A342A]"
          : trustRisk.severity === "warn"
            ? "bg-[#FFF4D8] text-[#94620C]"
            : "bg-green-50 text-[var(--safe-icon-accent)]",
    });
  }

  return cards;
}

function HealthCardsGrid({ cards }: { cards: HealthCard[] }) {
  const { reduceMotion } = useSafeMotion();
  const containerVariants = reduceMotion ? staggerContainerReduced : staggerContainer;
  const itemVariants = reduceMotion ? staggerItemReduced : staggerItem;
  const cols = cards.length >= 5 ? "lg:grid-cols-5" : "lg:grid-cols-4";

  return (
    <motion.div
      className={`grid grid-cols-1 sm:grid-cols-2 ${cols} gap-5`}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <motion.div key={card.key} variants={itemVariants} className="h-full">
            <Link
              href={card.href}
              className="block h-full card-glass rounded-safe-lg p-5 transition-all duration-200 ease-out hover:shadow-card-hover hover:-translate-y-0.5"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-semibold safe-text-secondary uppercase tracking-widest">
                    {card.title}
                  </p>
                  <p className="mt-1.5 text-2xl font-bold safe-text-metric tracking-tight tabular-nums">
                    {card.value}
                  </p>
                  {card.sub && <p className="mt-1 text-sm safe-text-secondary">{card.sub}</p>}
                </div>
                <div
                  className={`w-11 h-11 shrink-0 rounded-safe flex items-center justify-center ${card.iconBg}`}
                >
                  <Icon className="w-5 h-5" aria-hidden />
                </div>
              </div>
            </Link>
          </motion.div>
        );
      })}
    </motion.div>
  );
}

function HeroAction({
  item,
  t,
}: {
  item: ActionItem;
  t: ReturnType<typeof useTranslations>;
}) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      className={`group flex items-center gap-4 rounded-safe-lg border border-[#E5ECE8] border-l-4 ${toneAccent(item.tone)} bg-white p-4 shadow-[0_1px_2px_rgba(23,37,31,0.04)] transition-all duration-200 ease-out hover:shadow-card-hover hover:-translate-y-0.5`}
    >
      <span
        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-safe border ${toneBorder(item.tone)}`}
      >
        <Icon className="h-5 w-5" aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold uppercase tracking-widest safe-text-secondary">
          {t("priorityNow")}
        </p>
        <div className="mt-0.5 flex flex-wrap items-baseline gap-x-2">
          <p className="truncate text-base font-semibold safe-text-title">{item.title}</p>
          <span className="truncate text-xs safe-text-secondary">{item.context}</span>
        </div>
        <p className="mt-0.5 text-sm safe-text-secondary">{item.reason}</p>
      </div>
      {item.extra}
      <ChevronRight
        className="h-5 w-5 shrink-0 text-[#8E9A94] transition-transform group-hover:translate-x-0.5"
        aria-hidden
      />
    </Link>
  );
}

function ActionList({
  items,
  t,
}: {
  items: ActionItem[];
  t: ReturnType<typeof useTranslations>;
}) {
  if (items.length === 0) {
    return (
      <div className="rounded-safe-lg border border-[#E5ECE8] bg-white shadow-[0_1px_2px_rgba(23,37,31,0.04)] overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-8">
          <span className="flex h-9 w-9 items-center justify-center rounded-md border border-[#BED6C6] bg-[#E7F2EA] text-[#1F3A2E]">
            <CheckCircle2 className="h-5 w-5" aria-hidden />
          </span>
          <div>
            <p className="text-sm font-semibold safe-text-title">{t("allClear")}</p>
            <p className="text-xs safe-text-secondary">{t("allClearSub")}</p>
          </div>
        </div>
      </div>
    );
  }

  const [first, ...rest] = items;

  return (
    <div className="space-y-3">
      <HeroAction item={first} t={t} />
      {rest.length > 0 && (
        <div className="rounded-safe-lg border border-[#E5ECE8] bg-white shadow-[0_1px_2px_rgba(23,37,31,0.04)] overflow-hidden">
          <div className="divide-y divide-[#E5ECE8]">
            {rest.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.key}
                  href={item.href}
                  className="group flex items-center gap-3 px-4 py-3 transition-colors hover:bg-[#F6F8F7]"
                >
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md border ${toneBorder(item.tone)}`}
                  >
                    <Icon className="h-4 w-4" aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <p className="truncate text-sm font-semibold safe-text-title">{item.title}</p>
                      <span className="truncate text-xs safe-text-secondary">{item.context}</span>
                    </div>
                    <p className="mt-0.5 line-clamp-1 text-xs safe-text-secondary">{item.reason}</p>
                  </div>
                  {item.extra}
                  <ChevronRight
                    className="h-4 w-4 shrink-0 text-[#8E9A94] transition-transform group-hover:translate-x-0.5"
                    aria-hidden
                  />
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function PipelineBoard({
  columns,
  t,
}: {
  columns: PipelineColumn[];
  t: ReturnType<typeof useTranslations>;
}) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
      {columns.map((column) => (
        <div
          key={column.key}
          className="flex min-h-[190px] flex-col rounded-safe-lg border border-[#E5ECE8] bg-white shadow-[0_1px_2px_rgba(23,37,31,0.04)] p-4"
        >
          <div className="mb-3 flex items-center justify-between gap-2">
            <h3 className="truncate text-sm font-semibold safe-text-title">{column.title}</h3>
            <span className="rounded-md bg-[#F3F6F4] px-2 py-1 text-sm font-semibold tabular-nums safe-text-title">
              {column.count}
            </span>
          </div>
          <div className="flex flex-1 flex-col gap-2">
            {column.items.length === 0 ? (
              <p className="rounded-md border border-dashed border-[#DCE5E0] px-3 py-3 text-xs text-[#8E9A94]">
                {t("pipelineEmpty")}
              </p>
            ) : (
              column.items.map((item) => (
                <Link
                  key={item.id}
                  href={item.href}
                  className="rounded-md border border-[#E5ECE8] px-3 py-2 transition-colors hover:border-[#BED6C6] hover:bg-[#F6F8F7]"
                >
                  <p className="truncate text-xs font-semibold safe-text-title">{item.label}</p>
                  {item.sub && <p className="mt-0.5 truncate text-[11px] safe-text-secondary">{item.sub}</p>}
                </Link>
              ))
            )}
          </div>
          <LinkLabel href={column.href}>{t("seeAll")}</LinkLabel>
        </div>
      ))}
    </div>
  );
}

function ActivityRecent({
  payload,
  locale,
  t,
}: {
  payload: DashboardPayload;
  locale: string;
  t: ReturnType<typeof useTranslations>;
}) {
  const items = [
    ...payload.transactionItems.slice(0, 4).map((p) => ({
      id: `payment-${p.id}`,
      label: t("activityPayment"),
      detail: p.label,
      meta: `${p.date} · ${p.amount.toLocaleString(locale, {
        style: "currency",
        currency: "CAD",
        maximumFractionDigits: 0,
      })}`,
      href: p.href ?? routes.facturationPaiements,
    })),
    ...payload.activityFeed.slice(0, 4).map((a) => ({
      id: `activity-${a.id}`,
      label: a.action,
      detail: a.entityType,
      meta: `${formatShortDate(a.timestamp, locale)}${a.userDisplayName ? ` · ${a.userDisplayName}` : ""}`,
      href: routes.parametresAudit,
    })),
  ].slice(0, 6);

  return (
    <div className="rounded-safe-lg border border-[#E5ECE8] bg-white shadow-[0_1px_2px_rgba(23,37,31,0.04)] overflow-hidden">
      {items.length === 0 ? (
        <p className="px-4 py-6 text-sm safe-text-secondary">{t("activityEmpty")}</p>
      ) : (
        <div className="divide-y divide-[#E5ECE8]">
          {items.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              className="flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-[#F6F8F7]"
            >
              <FileText className="h-4 w-4 shrink-0 text-[#68776F]" aria-hidden />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium safe-text-title">{item.label}</p>
                <p className="truncate text-xs safe-text-secondary">{item.detail}</p>
              </div>
              <span className="hidden shrink-0 text-xs tabular-nums sm:inline safe-text-secondary">
                {item.meta}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function SixMonthChart({
  rows,
  t,
}: {
  rows: MonthlyComparisonRow[];
  t: ReturnType<typeof useTranslations>;
}) {
  if (rows.length < 2) {
    return (
      <div className="rounded-safe-lg border border-[#E5ECE8] bg-white p-6 text-center text-sm safe-text-secondary">
        {t("chartNoData")}
      </div>
    );
  }

  const max = Math.max(...rows.flatMap((r) => [r.invoiced, r.collected]), 1);
  const points = (selector: (row: MonthlyComparisonRow) => number) =>
    rows
      .map((row, index) => {
        const x = (index / Math.max(rows.length - 1, 1)) * 100;
        const y = 100 - (selector(row) / max) * 82 - 8;
        return `${x},${y}`;
      })
      .join(" ");

  return (
    <div className="rounded-safe-lg border border-[#E5ECE8] bg-white shadow-[0_1px_2px_rgba(23,37,31,0.04)] p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold safe-text-title">{t("chartTitle")}</h3>
        <LinkLabel href={routes.rapports}>{t("reports")}</LinkLabel>
      </div>
      <svg viewBox="0 0 100 100" className="h-44 w-full" preserveAspectRatio="none" aria-hidden>
        {[25, 50, 75].map((y) => (
          <line key={y} x1="0" x2="100" y1={y} y2={y} stroke="#DCE5E0" strokeWidth="0.4" />
        ))}
        <polyline
          points={points((r) => r.invoiced)}
          fill="none"
          stroke="#8E9A94"
          strokeWidth="1.2"
          strokeDasharray="3 2"
          vectorEffect="non-scaling-stroke"
        />
        <polyline
          points={points((r) => r.collected)}
          fill="none"
          stroke="#1F3A2E"
          strokeWidth="1.8"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <div className="mt-2 flex flex-wrap items-center gap-4 text-xs safe-text-secondary">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-0.5 w-4 bg-[#1F3A2E]" /> {t("chartCollected")}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-0.5 w-4 border-t border-dashed border-[#8E9A94]" /> {t("chartInvoiced")}
        </span>
      </div>
    </div>
  );
}

export function DashboardView({ payload }: DashboardViewProps) {
  const locale = useLocale();
  const intlLocale = locale === "en" ? "en-CA" : "fr-CA";
  const t = useTranslations("dashboard");

  const trustRisk = getTrustRisk(payload.lastReconciliation, intlLocale, t);
  const totalOutstanding = payload.outstandingAccounts.reduce(
    (sum: number, account: OutstandingAccountRow) => sum + account.balanceDue,
    0,
  );
  const totalClients = payload.activeClientsCount + payload.inactiveClientsCount;
  const actionItems = buildActionItems(payload, trustRisk, intlLocale, t);
  const pipelineColumns = buildPipelineColumns(payload, t);
  const healthCards = buildHealthCards(payload, trustRisk, totalOutstanding, totalClients, t);

  return (
    <div className="space-y-8 animate-fade-in">
      <PageHeader
        title={t("title")}
        description={t("subtitle")}
        action={
          <LinkLabel href={routes.rapports}>
            <span className="text-forest-50">{t("detailedReports")}</span>
          </LinkLabel>
        }
      />

      <section>
        <SectionTitle title={t("zoneToHandle")} subtitle={t("zoneToHandleSub")} />
        <ActionList items={actionItems} t={t} />
      </section>

      {healthCards.length > 0 && (
        <section>
          <SectionTitle title={t("zoneHealth")} subtitle={t("zoneHealthSub")} />
          <HealthCardsGrid cards={healthCards} />
        </section>
      )}

      <section>
        <SectionTitle
          title={t("zonePipeline")}
          subtitle={t("zonePipelineSub")}
          action={<LinkLabel href={routes.dossiers}>{t("allMatters")}</LinkLabel>}
        />
        <PipelineBoard columns={pipelineColumns} t={t} />
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div>
          <SectionTitle title={t("zoneActivity")} subtitle={t("zoneActivitySub")} />
          {payload.visibility.showActivityFeed ? (
            <ActivityRecent payload={payload} locale={intlLocale} t={t} />
          ) : (
            <div className="rounded-safe-lg border border-[#E5ECE8] bg-white p-6 text-sm safe-text-secondary">
              {t("activityEmpty")}
            </div>
          )}
        </div>
        {payload.visibility.showRevenueChart && (
          <div>
            <SectionTitle title={t("zoneTrend")} subtitle={t("zoneTrendSub")} />
            <SixMonthChart rows={payload.monthlyComparison.slice(-6)} t={t} />
          </div>
        )}
      </section>
    </div>
  );
}
