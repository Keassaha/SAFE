"use client";

import { useLocale, useTranslations } from "next-intl";
import { formatCurrency } from "@/lib/utils/format";
import { Skeleton } from "@/components/ui/Skeleton";
import { Card } from "@/components/ui/Card";

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
  const locale = useLocale();
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
      value: formatCurrency(nonFactureMontant, "CAD", locale),
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
      <Card className="grid grid-cols-2 lg:grid-cols-4" aria-busy="true">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="min-w-0 px-4 py-3 border-si-line2 [&:nth-child(-n+2)]:border-b [&:nth-child(2n+1)]:border-r lg:[&:nth-child(-n+2)]:border-b-0 lg:[&:nth-child(-n+3)]:border-r">
            <Skeleton className="mb-2 h-3 w-24" />
            <Skeleton className="h-6 w-20" />
          </div>
        ))}
      </Card>
    );
  }

  return (
    <Card className="grid grid-cols-2 lg:grid-cols-4">
      {cards.map(({ title, value, sub }) => (
        <div
          key={title}
          className="min-w-0 px-4 py-3 border-si-line2 [&:nth-child(-n+2)]:border-b [&:nth-child(2n+1)]:border-r lg:[&:nth-child(-n+2)]:border-b-0 lg:[&:nth-child(-n+3)]:border-r"
        >
          <p className="truncate text-[11px] font-medium text-si-muted">{title}</p>
          <p className="mt-1 truncate text-right font-mono text-xl font-medium tabular-nums text-si-ink">{value}</p>
          {sub && <p className="mt-1 truncate text-right text-xs text-si-muted">{sub}</p>}
        </div>
      ))}
    </Card>
  );
}
