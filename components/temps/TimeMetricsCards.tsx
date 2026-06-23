"use client";

import { Clock, Calendar, DollarSign, Percent } from "lucide-react";
import { useTranslations } from "next-intl";
import { formatCurrency } from "@/lib/utils/format";
import { SkeletonCard } from "@/components/ui/Skeleton";

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
      icon: Clock,
    },
    {
      title: t("metricThisMonth"),
      value: `${moisHeures.toFixed(1)} h`,
      sub: t("metricHours"),
      icon: Calendar,
    },
    {
      title: t("metricUnbilled"),
      value: formatCurrency(nonFactureMontant),
      sub: t("metricAmountToBill"),
      icon: DollarSign,
    },
    {
      title: t("metricBillableRate"),
      value: `${tauxFacturablePercent} %`,
      sub: t("metricBillableEntries"),
      icon: Percent,
    },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map(({ title, value, sub, icon: Icon }) => (
        <div
          key={title}
          className="bg-si-surface border border-si-line p-5 transition-all duration-200 hover:shadow-md"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-si-muted tracking-wider">
                {title}
              </p>
              <p className="mt-1 text-2xl font-bold text-si-ink">{value}</p>
              {sub && (
                <p className="mt-1 text-sm text-si-muted">{sub}</p>
              )}
            </div>
            <div className="w-10 h-10 rounded-lg bg-si-verified/10 flex items-center justify-center">
              <Icon className="w-5 h-5 text-si-verified" aria-hidden />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
