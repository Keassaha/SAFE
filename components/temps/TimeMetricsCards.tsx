"use client";

import { Clock, Calendar, DollarSign, Percent } from "lucide-react";
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
  const cards = [
    {
      title: "Cette semaine",
      value: `${semaineHeures.toFixed(1)} h`,
      sub: "Heures",
      icon: Clock,
    },
    {
      title: "Ce mois",
      value: `${moisHeures.toFixed(1)} h`,
      sub: "Heures",
      icon: Calendar,
    },
    {
      title: "Non facturé",
      value: formatCurrency(nonFactureMontant),
      sub: "Montant à facturer",
      icon: DollarSign,
    },
    {
      title: "Taux facturable",
      value: `${tauxFacturablePercent} %`,
      sub: "Entrées facturables",
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
          className="card-glass p-5 transition-all duration-200 hover:shadow-md"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium safe-text-secondary tracking-wider">
                {title}
              </p>
              <p className="mt-1 text-2xl font-bold safe-text-metric">{value}</p>
              {sub && (
                <p className="mt-1 text-sm safe-text-secondary">{sub}</p>
              )}
            </div>
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <Icon className="w-5 h-5 text-green-700" aria-hidden />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
