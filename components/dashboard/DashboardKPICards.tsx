"use client";

import { useTranslations } from "next-intl";
import {
  DollarSign,
  CreditCard,
  FileWarning,
  Clock,
  Landmark,
  Receipt,
} from "lucide-react";
import { DashboardKPICard } from "./DashboardKPICard";
import type { DashboardKpis } from "@/lib/dashboard/types";

export interface DashboardKPICardsProps {
  kpis: DashboardKpis;
  visibility: {
    showFinancialKpis: boolean;
    showExpenses: boolean;
    showTrustBalance: boolean;
  };
}

const TITLE_KEYS = {
  revenueThisMonth: "revenueThisMonth",
  paymentsReceived: "paymentsReceived",
  outstandingInvoices: "unpaidInvoices",
  unbilledHoursValue: "unbilledHoursLabel",
  trustBalance: "trustBalanceLabel",
  expensesThisMonth: "expensesThisMonth",
} as const;

const CONFIG = [
  { key: "revenueThisMonth" as const, titleKey: "revenueThisMonth" as const, icon: DollarSign, accent: "emerald" as const },
  { key: "paymentsReceived" as const, titleKey: "paymentsReceived" as const, icon: CreditCard, accent: "blue" as const },
  { key: "outstandingInvoices" as const, titleKey: "outstandingInvoices" as const, icon: FileWarning, accent: "amber" as const },
  { key: "unbilledHoursValue" as const, titleKey: "unbilledHoursValue" as const, icon: Clock, accent: "violet" as const },
  { key: "trustBalance" as const, titleKey: "trustBalance" as const, icon: Landmark, accent: "teal" as const },
  { key: "expensesThisMonth" as const, titleKey: "expensesThisMonth" as const, icon: Receipt, accent: "orange" as const },
];

export function DashboardKPICards({ kpis, visibility }: DashboardKPICardsProps) {
  const t = useTranslations("dashboard");
  const showRevenue = visibility.showFinancialKpis;
  const showTrust = visibility.showTrustBalance;
  const showExpenses = visibility.showExpenses;

  const cards = CONFIG.filter((c) => {
    if (c.key === "revenueThisMonth" || c.key === "paymentsReceived" || c.key === "outstandingInvoices" || c.key === "unbilledHoursValue")
      return showRevenue;
    if (c.key === "trustBalance") return showTrust;
    if (c.key === "expensesThisMonth") return showExpenses;
    return true;
  });

  if (cards.length === 0) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      {cards.map(({ key, titleKey, icon: Icon, accent }) => {
        const kpi = kpis[key];
        if (!kpi) return null;
        return (
          <DashboardKPICard
            key={key}
            title={t(TITLE_KEYS[titleKey])}
            value={kpi.value}
            subtitle={kpi.subtitle}
            trend={kpi.trend}
            trendLabel={kpi.trendLabel}
            icon={<Icon className="w-5 h-5" aria-hidden />}
            accent={accent}
          />
        );
      })}
    </div>
  );
}
