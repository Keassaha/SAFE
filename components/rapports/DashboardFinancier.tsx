"use client";

import {
  DollarSign,
  CreditCard,
  FileWarning,
  Landmark,
  Clock,
  Percent,
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell } from "recharts";
import { formatCurrency } from "@/lib/utils/format";
import { DashboardKPICard } from "@/components/dashboard/DashboardKPICard";
import { useTranslations } from "next-intl";

interface DashboardFinancierProps {
  kpis: {
    revenusFactures: number;
    paiementsRecus: number;
    facturesImpayees: number;
    soldeFideicommis: number;
    heuresFacturables: number;
    tauxRealisation: number;
  };
  revenueByMonth: { monthKey: string; label: string; value: number }[];
}

export function DashboardFinancier({ kpis, revenueByMonth }: DashboardFinancierProps) {
  const t = useTranslations("rapports");

  const cards = [
    {
      title: t("billedRevenue"),
      value: formatCurrency(kpis.revenusFactures),
      icon: <DollarSign className="w-5 h-5" aria-hidden />,
      accent: "emerald" as const,
    },
    {
      title: t("paymentsReceived"),
      value: formatCurrency(kpis.paiementsRecus),
      icon: <CreditCard className="w-5 h-5" aria-hidden />,
      accent: "blue" as const,
    },
    {
      title: t("unpaidInvoices"),
      value: formatCurrency(kpis.facturesImpayees),
      icon: <FileWarning className="w-5 h-5" aria-hidden />,
      accent: "amber" as const,
    },
    {
      title: t("trustBalance"),
      value: formatCurrency(kpis.soldeFideicommis),
      icon: <Landmark className="w-5 h-5" aria-hidden />,
      accent: "teal" as const,
    },
    {
      title: t("billableHours"),
      value: `${kpis.heuresFacturables} h`,
      icon: <Clock className="w-5 h-5" aria-hidden />,
      accent: "violet" as const,
    },
    {
      title: t("realizationRate"),
      value: `${kpis.tauxRealisation} %`,
      icon: <Percent className="w-5 h-5" aria-hidden />,
      accent: "orange" as const,
    },
  ];

  const chartData = revenueByMonth.slice(-12).map((d) => ({ name: d.label, value: d.value }));
  const hasChartData = chartData.some((d) => d.value > 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {cards.map((c) => (
          <DashboardKPICard
            key={c.title}
            title={c.title}
            value={c.value}
            icon={c.icon}
            accent={c.accent}
          />
        ))}
      </div>
      <div className="card-glass overflow-hidden p-5 md:p-6 border-l-4 border-l-emerald-500">
        <h3 className="text-sm font-semibold safe-text-title mb-4 tracking-tight">
          {t("billedRevenueByMonth")}
        </h3>
        {hasChartData ? (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "var(--safe-text-secondary)", fontSize: 10 }}
                />
                <YAxis hide />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {chartData.map((_, index) => (
                    <Cell
                      key={index}
                      fill={
                        index === chartData.length - 1
                          ? "#10b981"
                          : index >= chartData.length - 3
                            ? "#34d399"
                            : "var(--safe-neutral-border)"
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="text-sm safe-text-secondary py-8 text-center">
            {t("noPeriodData")}
          </p>
        )}
      </div>
    </div>
  );
}
