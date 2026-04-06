"use client";

import { useTranslations } from "next-intl";
import {
  DollarSign,
  CreditCard,
  FileWarning,
  TrendingUp,
  TrendingDown,
  Minus,
  Clock,
  FileCheck,
  Percent,
  UserCheck,
} from "lucide-react";
import type { DashboardKpis } from "@/lib/dashboard/types";

/* ── KPI Card ── */

interface KPICardProps {
  title: string;
  value: string;
  subtitle?: string;
  trend?: number;
  trendLabel?: string;
  icon: React.ReactNode;
  accent: "emerald" | "blue" | "amber" | "red" | "violet" | "cyan";
  isHero?: boolean;
}

const ACCENT = {
  emerald: { iconBg: "bg-emerald-100", iconText: "text-emerald-700" },
  blue: { iconBg: "bg-blue-100", iconText: "text-blue-700" },
  amber: { iconBg: "bg-amber-100", iconText: "text-amber-700" },
  red: { iconBg: "bg-red-100", iconText: "text-red-600" },
  violet: { iconBg: "bg-violet-100", iconText: "text-violet-700" },
  cyan: { iconBg: "bg-cyan-100", iconText: "text-cyan-700" },
};

function KPICard({ title, value, subtitle, trend, trendLabel, icon, accent, isHero }: KPICardProps) {
  const s = ACCENT[accent];
  const trendUp = trend != null && trend > 0;
  const trendDown = trend != null && trend < 0;

  return (
    <div
      className={`rounded-safe-md p-4 md:p-5 transition-shadow hover:shadow-md ${
        isHero
          ? "bg-green-900 text-white"
          : "bg-white border border-[var(--safe-neutral-border)]"
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <p className={`text-xs font-semibold uppercase tracking-wider ${isHero ? "text-white/70" : "text-[var(--safe-text-muted)]"}`}>
          {title}
        </p>
        <div
          className={`w-8 h-8 rounded-safe-sm flex items-center justify-center shrink-0 ${
            isHero ? "bg-white/15 text-white" : `${s.iconBg} ${s.iconText}`
          }`}
        >
          {icon}
        </div>
      </div>
      <p className={`font-heading text-2xl md:text-3xl font-bold tracking-tight ${isHero ? "text-white" : "text-[var(--safe-text-title)]"}`}>
        {value}
      </p>
      {subtitle && (
        <p className={`text-xs mt-0.5 ${isHero ? "text-white/60" : "text-[var(--safe-text-muted)]"}`}>{subtitle}</p>
      )}
      {trend != null && (
        <div className="flex items-center gap-1.5 mt-2">
          <span
            className={`inline-flex items-center gap-0.5 text-xs font-bold px-2 py-0.5 rounded-full ${
              trendUp
                ? isHero ? "bg-emerald-400/20 text-emerald-200" : "bg-emerald-50 text-emerald-700"
                : trendDown
                  ? isHero ? "bg-red-400/20 text-red-200" : "bg-red-50 text-red-600"
                  : isHero ? "bg-white/10 text-white/60" : "bg-gray-100 text-gray-500"
            }`}
          >
            {trendUp && <TrendingUp className="w-3 h-3" />}
            {trendDown && <TrendingDown className="w-3 h-3" />}
            {trend === 0 && <Minus className="w-3 h-3" />}
            {trend > 0 ? "+" : ""}{trend}%
          </span>
          {trendLabel && (
            <span className={`text-xs ${isHero ? "text-white/40" : "text-[var(--safe-text-muted)]"}`}>{trendLabel}</span>
          )}
        </div>
      )}
    </div>
  );
}

/* ── KPI Cards Grid ── */

export interface DashboardKPICardsProps {
  kpis: DashboardKpis;
  visibility: {
    showFinancialKpis: boolean;
    showExpenses: boolean;
    showTrustBalance: boolean;
  };
}

export function DashboardKPICards({ kpis, visibility }: DashboardKPICardsProps) {
  const t = useTranslations("dashboard");

  if (!visibility.showFinancialKpis) return null;

  return (
    <div className="space-y-3">
      {/* Row 1: Financial KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KPICard
          title={t("kpi.revenueInvoiced")}
          value={kpis.revenueThisMonth.value}
          subtitle={kpis.revenueThisMonth.subtitle}
          trend={kpis.revenueThisMonth.trend}
          trendLabel={kpis.revenueThisMonth.trendLabel}
          icon={<DollarSign className="w-4 h-4" />}
          accent="emerald"
          isHero
        />
        <KPICard
          title={t("kpi.revenueCollected")}
          value={kpis.paymentsReceived.value}
          subtitle={kpis.paymentsReceived.subtitle}
          trend={kpis.paymentsReceived.trend}
          trendLabel={kpis.paymentsReceived.trendLabel}
          icon={<CreditCard className="w-4 h-4" />}
          accent="blue"
        />
        <KPICard
          title={t("kpi.cashNotReceived")}
          value={kpis.cashNotReceived.value}
          subtitle={kpis.cashNotReceived.subtitle}
          icon={<FileWarning className="w-4 h-4" />}
          accent="amber"
        />
        <KPICard
          title={t("kpi.recoveryRate")}
          value={kpis.recoveryRate.value}
          subtitle={kpis.recoveryRate.subtitle}
          icon={<Percent className="w-4 h-4" />}
          accent="cyan"
        />
      </div>

      {/* Row 2: Productivity KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KPICard
          title={t("kpi.hoursWorked")}
          value={kpis.hoursWorked.value}
          subtitle={kpis.hoursWorked.subtitle}
          icon={<Clock className="w-4 h-4" />}
          accent="violet"
        />
        <KPICard
          title={t("kpi.hoursBilled")}
          value={kpis.hoursBilled.value}
          subtitle={kpis.hoursBilled.subtitle}
          icon={<FileCheck className="w-4 h-4" />}
          accent="blue"
        />
        <KPICard
          title={t("kpi.billingRate")}
          value={kpis.billingRate.value}
          subtitle={kpis.billingRate.subtitle}
          icon={<Percent className="w-4 h-4" />}
          accent="emerald"
        />
        <KPICard
          title={t("kpi.revenuePerLawyer")}
          value={kpis.revenuePerLawyer.value}
          subtitle={kpis.revenuePerLawyer.subtitle}
          icon={<UserCheck className="w-4 h-4" />}
          accent="cyan"
        />
      </div>
    </div>
  );
}
