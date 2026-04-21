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

/* ── KPI Card — Popcorn-inspired ── */

interface KPICardProps {
  title: string;
  value: string;
  subtitle?: string;
  trend?: number;
  trendLabel?: string;
  icon: React.ReactNode;
  gradient: string;
  iconColor: string;
  isHero?: boolean;
}

function KPICard({ title, value, subtitle, trend, trendLabel, icon, gradient, iconColor, isHero }: KPICardProps) {
  const trendUp = trend != null && trend > 0;
  const trendDown = trend != null && trend < 0;

  return (
    <div
      className={`relative overflow-hidden rounded-2xl p-5 transition-all duration-300 hover:shadow-[0_8px_32px_rgba(0,0,0,0.08)] hover:scale-[1.01] ${
        isHero
          ? "bg-gradient-to-br from-emerald-500 to-emerald-700 text-white shadow-lg shadow-emerald-500/20"
          : "bg-white/70 backdrop-blur-sm border border-white/60 shadow-[0_2px_16px_rgba(0,0,0,0.04)]"
      }`}
    >
      {/* Decorative gradient orb */}
      {!isHero && (
        <div
          className={`absolute -top-8 -right-8 w-24 h-24 rounded-full opacity-20 blur-2xl pointer-events-none ${gradient}`}
        />
      )}

      <div className="relative z-10">
        <div className="flex items-start justify-between gap-2 mb-3">
          <p className={`text-[11px] font-semibold uppercase tracking-[0.08em] ${
            isHero ? "text-white/70" : "text-neutral-400"
          }`}>
            {title}
          </p>
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-200 hover:scale-110 ${
              isHero ? "bg-white/15" : `${gradient}`
            }`}
          >
            <span className={isHero ? "text-white" : iconColor}>{icon}</span>
          </div>
        </div>

        <p className={`text-2xl md:text-3xl font-bold tracking-tight tabular-nums ${
          isHero ? "text-white" : "text-neutral-800"
        }`}>
          {value}
        </p>

        {subtitle && (
          <p className={`text-[12px] mt-1 ${isHero ? "text-white/60" : "text-neutral-400"}`}>
            {subtitle}
          </p>
        )}

        {trend != null && (
          <div className="flex items-center gap-2 mt-3">
            <span
              className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full ${
                trendUp
                  ? isHero ? "bg-white/15 text-emerald-100" : "bg-emerald-50 text-emerald-600"
                  : trendDown
                    ? isHero ? "bg-white/15 text-red-200" : "bg-red-50 text-red-500"
                    : isHero ? "bg-white/10 text-white/60" : "bg-neutral-100 text-neutral-400"
              }`}
            >
              {trendUp && <TrendingUp className="w-3 h-3" />}
              {trendDown && <TrendingDown className="w-3 h-3" />}
              {trend === 0 && <Minus className="w-3 h-3" />}
              {trend > 0 ? "+" : ""}{trend}%
            </span>
            {trendLabel && (
              <span className={`text-[11px] ${isHero ? "text-white/40" : "text-neutral-300"}`}>
                {trendLabel}
              </span>
            )}
          </div>
        )}
      </div>
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
    <div className="space-y-4">
      {/* Row 1: Financial KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title={t("kpi.revenueInvoiced")}
          value={kpis.revenueThisMonth.value}
          subtitle={kpis.revenueThisMonth.subtitle}
          trend={kpis.revenueThisMonth.trend}
          trendLabel={kpis.revenueThisMonth.trendLabel}
          icon={<DollarSign className="w-4 h-4" />}
          gradient="bg-emerald-100"
          iconColor="text-emerald-600"
          isHero
        />
        <KPICard
          title={t("kpi.revenueCollected")}
          value={kpis.paymentsReceived.value}
          subtitle={kpis.paymentsReceived.subtitle}
          trend={kpis.paymentsReceived.trend}
          trendLabel={kpis.paymentsReceived.trendLabel}
          icon={<CreditCard className="w-4 h-4" />}
          gradient="bg-blue-100"
          iconColor="text-blue-600"
        />
        <KPICard
          title={t("kpi.cashNotReceived")}
          value={kpis.cashNotReceived.value}
          subtitle={kpis.cashNotReceived.subtitle}
          icon={<FileWarning className="w-4 h-4" />}
          gradient="bg-amber-100"
          iconColor="text-amber-600"
        />
        <KPICard
          title={t("kpi.recoveryRate")}
          value={kpis.recoveryRate.value}
          subtitle={kpis.recoveryRate.subtitle}
          icon={<Percent className="w-4 h-4" />}
          gradient="bg-cyan-100"
          iconColor="text-cyan-600"
        />
      </div>

      {/* Row 2: Productivity KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title={t("kpi.hoursWorked")}
          value={kpis.hoursWorked.value}
          subtitle={kpis.hoursWorked.subtitle}
          icon={<Clock className="w-4 h-4" />}
          gradient="bg-violet-100"
          iconColor="text-violet-600"
        />
        <KPICard
          title={t("kpi.hoursBilled")}
          value={kpis.hoursBilled.value}
          subtitle={kpis.hoursBilled.subtitle}
          icon={<FileCheck className="w-4 h-4" />}
          gradient="bg-blue-100"
          iconColor="text-blue-600"
        />
        <KPICard
          title={t("kpi.billingRate")}
          value={kpis.billingRate.value}
          subtitle={kpis.billingRate.subtitle}
          icon={<Percent className="w-4 h-4" />}
          gradient="bg-emerald-100"
          iconColor="text-emerald-600"
        />
        <KPICard
          title={t("kpi.revenuePerLawyer")}
          value={kpis.revenuePerLawyer.value}
          subtitle={kpis.revenuePerLawyer.subtitle}
          icon={<UserCheck className="w-4 h-4" />}
          gradient="bg-cyan-100"
          iconColor="text-cyan-600"
        />
      </div>
    </div>
  );
}
