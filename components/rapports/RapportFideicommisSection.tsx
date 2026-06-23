"use client";

import { Landmark, ArrowDownCircle, ArrowUpCircle, Wallet } from "lucide-react";
import { formatCurrency } from "@/lib/utils/format";
import type { RapportFideicommisSummary } from "@/lib/rapports/types";
import { useTranslations } from "next-intl";

interface RapportFideicommisSectionProps {
  data: RapportFideicommisSummary;
}

export function RapportFideicommisSection({ data }: RapportFideicommisSectionProps) {
  const t = useTranslations("reportsUi");
  const cards = [
    {
      title: t("depositsPeriod"),
      value: formatCurrency(data.depots),
      icon: ArrowDownCircle,
      className: "border-l-emerald-500",
    },
    {
      title: t("withdrawalsPeriod"),
      value: formatCurrency(data.utilisations),
      icon: ArrowUpCircle,
      className: "border-l-si-amber",
    },
    {
      title: t("trustBalance"),
      value: formatCurrency(data.solde),
      icon: Wallet,
      className: "border-l-si-forest",
    },
  ];

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-si-ink flex items-center gap-2 tracking-tight">
        <Landmark className="w-4 h-4" aria-hidden />
        {t("trustReportTitle")}
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <div
              key={c.title}
              className={`bg-si-surface border border-si-line overflow-hidden p-5 border-l-4 ${c.className}`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-si-muted uppercase tracking-wider">
                  {c.title}
                </span>
                <Icon className="w-5 h-5 text-si-muted" aria-hidden />
              </div>
              <p className="text-xl font-bold text-si-ink tabular-nums">{c.value}</p>
            </div>
          );
        })}
      </div>
      <p className="text-xs text-si-muted">
        {t("transactionsOverPeriod", { count: data.transactionsCount })}
      </p>
    </div>
  );
}
