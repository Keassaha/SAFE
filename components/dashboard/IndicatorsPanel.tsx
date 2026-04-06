"use client";

import { useTranslations } from "next-intl";
import { formatCurrency } from "@/lib/utils/format";
import {
  Send,
  Clock,
  FileText,
  FileX,
  Percent,
  Landmark,
} from "lucide-react";
import type { DashboardIndicators } from "@/lib/dashboard/types";

export interface IndicatorsPanelProps {
  indicators: DashboardIndicators;
  soldeFideicommis?: string;
}

export function IndicatorsPanel({ indicators, soldeFideicommis }: IndicatorsPanelProps) {
  const t = useTranslations("dashboard");

  const items = [
    {
      label: t("indicators.invoicesSent"),
      value: String(indicators.invoicesSent),
      icon: Send,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
    {
      label: t("indicators.invoicesPending"),
      value: String(indicators.invoicesPending),
      icon: Clock,
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
    {
      label: t("indicators.timeEntries"),
      value: String(indicators.timeEntries),
      icon: FileText,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: t("indicators.unbilledEntries"),
      value: String(indicators.unbilledEntries),
      icon: FileX,
      color: "text-red-500",
      bg: "bg-red-50",
    },
    {
      label: t("indicators.accruedInterest"),
      value: formatCurrency(indicators.accruedInterest, "CAD"),
      icon: Percent,
      color: "text-orange-600",
      bg: "bg-orange-50",
      subtitle: t("indicators.interestRate"),
    },
  ];

  return (
    <div className="bg-white rounded-safe-md border border-[var(--safe-neutral-border)] shadow-sm p-5 md:p-6">
      <h3 className="text-base font-semibold text-[var(--safe-text-title)] mb-4 flex items-center gap-2 tracking-tight">
        <Landmark className="w-4 h-4 text-emerald-600" />
        {t("indicators.title")}
      </h3>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-4">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className={`rounded-safe ${item.bg} border border-transparent p-3 text-center`}>
              <div className="flex items-center justify-center mb-1.5">
                <Icon className={`w-4 h-4 ${item.color}`} />
              </div>
              <p className={`text-xl font-bold ${item.color}`}>{item.value}</p>
              <p className="text-xs font-medium text-[var(--safe-text-secondary)] mt-0.5 leading-tight">{item.label}</p>
              {item.subtitle && (
                <p className="text-xs text-[var(--safe-text-muted)] mt-0.5">{item.subtitle}</p>
              )}
            </div>
          );
        })}
      </div>

      {/* Fidéicommis actifs */}
      <div className="flex items-center justify-between rounded-safe bg-emerald-50 border border-emerald-200 p-3">
        <div className="flex items-center gap-2">
          <Landmark className="w-4 h-4 text-emerald-600" />
          <span className="text-sm font-semibold text-emerald-800">
            {t("indicators.activeTrust")}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-lg font-bold text-emerald-700">
            {indicators.activeTrustAccounts}
          </span>
          {soldeFideicommis && (
            <span className="text-sm font-medium text-emerald-600">
              {soldeFideicommis}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
