"use client";

import { useTranslations } from "next-intl";
import { formatCurrency } from "@/lib/utils/format";
import { Skeleton } from "@/components/ui/Skeleton";

interface TimeMetricsCardsProps {
  semaineHeures: number;
  moisHeures: number;
  nonFactureMontant: number;
  tauxFacturablePercent: number;
  loading?: boolean;
}

export function TimeMetricsCards({
  semaineHeures,
  moisHeures,
  nonFactureMontant,
  tauxFacturablePercent,
  loading,
}: TimeMetricsCardsProps) {
  const t = useTranslations("gestionCompUi");
  const cards = [
    {
      title: t("metricThisWeek"),
      value: `${semaineHeures.toFixed(1)} h`,
      sub: t("metricHours"),
    },
    {
      title: t("metricThisMonth"),
      value: `${moisHeures.toFixed(1)} h`,
      sub: t("metricHours"),
    },
    {
      title: t("metricUnbilled"),
      value: formatCurrency(nonFactureMontant),
      sub: t("metricAmountToBill"),
    },
    {
      title: t("metricBillableRate"),
      value: `${tauxFacturablePercent} %`,
      sub: t("metricBillableEntries"),
    },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-2 border-y border-si-line bg-si-surface lg:grid-cols-4" aria-busy="true">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="border-b border-r border-si-line2 px-4 py-3">
            <Skeleton className="mb-2 h-3 w-24" />
            <Skeleton className="h-6 w-20" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 border-y border-si-line bg-si-surface lg:grid-cols-4">
      {cards.map(({ title, value, sub }) => (
        <div
          key={title}
          className="min-w-0 border-b border-r border-si-line2 px-4 py-3"
        >
          <p className="truncate text-[11px] font-medium text-si-muted">{title}</p>
          <p className="mt-1 truncate font-mono text-xl font-medium tabular-nums text-si-ink">{value}</p>
          {sub && <p className="mt-1 truncate text-xs text-si-muted">{sub}</p>}
        </div>
      ))}
    </div>
  );
}
