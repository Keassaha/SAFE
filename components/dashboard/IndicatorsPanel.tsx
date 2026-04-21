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
      gradient: "from-emerald-50 to-emerald-100/50",
      color: "text-emerald-600",
    },
    {
      label: t("indicators.invoicesPending"),
      value: String(indicators.invoicesPending),
      icon: Clock,
      gradient: "from-amber-50 to-amber-100/50",
      color: "text-amber-600",
    },
    {
      label: t("indicators.timeEntries"),
      value: String(indicators.timeEntries),
      icon: FileText,
      gradient: "from-blue-50 to-blue-100/50",
      color: "text-blue-600",
    },
    {
      label: t("indicators.unbilledEntries"),
      value: String(indicators.unbilledEntries),
      icon: FileX,
      gradient: "from-red-50 to-red-100/50",
      color: "text-red-500",
    },
    {
      label: t("indicators.accruedInterest"),
      value: formatCurrency(indicators.accruedInterest, "CAD"),
      icon: Percent,
      gradient: "from-orange-50 to-orange-100/50",
      color: "text-orange-600",
      subtitle: t("indicators.interestRate"),
    },
  ];

  return (
    <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-white/60 shadow-[0_2px_16px_rgba(0,0,0,0.04)] p-6 md:p-7">
      <h3 className="text-base font-bold text-neutral-800 mb-5 flex items-center gap-2.5 tracking-tight">
        <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center">
          <Landmark className="w-4 h-4 text-emerald-600" />
        </div>
        {t("indicators.title")}
      </h3>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-5">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.label}
              className={`rounded-xl bg-gradient-to-br ${item.gradient} border border-white/60 p-4 text-center transition-all duration-200 hover:shadow-md hover:scale-[1.02]`}
            >
              <div className="flex items-center justify-center mb-2">
                <div className="w-8 h-8 rounded-lg bg-white/80 flex items-center justify-center shadow-sm">
                  <Icon className={`w-4 h-4 ${item.color}`} />
                </div>
              </div>
              <p className={`text-xl font-bold ${item.color} tabular-nums`}>{item.value}</p>
              <p className="text-[11px] font-medium text-neutral-500 mt-1 leading-tight">
                {item.label}
              </p>
              {item.subtitle && (
                <p className="text-[10px] text-neutral-400 mt-0.5">{item.subtitle}</p>
              )}
            </div>
          );
        })}
      </div>

      {/* Fidéicommis actifs */}
      <div className="flex items-center justify-between rounded-xl bg-gradient-to-r from-emerald-50 to-emerald-100/40 border border-emerald-200/50 p-4 transition-all duration-200 hover:shadow-md">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-white/80 flex items-center justify-center shadow-sm">
            <Landmark className="w-4 h-4 text-emerald-600" />
          </div>
          <span className="text-sm font-semibold text-emerald-800">
            {t("indicators.activeTrust")}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-lg font-bold text-emerald-700 tabular-nums">
            {indicators.activeTrustAccounts}
          </span>
          {soldeFideicommis && (
            <span className="text-sm font-semibold text-emerald-600 tabular-nums bg-white/60 px-3 py-1 rounded-lg">
              {soldeFideicommis}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
