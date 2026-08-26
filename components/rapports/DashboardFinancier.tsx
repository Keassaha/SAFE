"use client";
import { useFormatteurs } from "@/lib/i18n/formatteurs";

import {
  DollarSign,
  CreditCard,
  FileWarning,
  Landmark,
  Clock,
  Percent,
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell } from "recharts";
import { DashboardKPICard } from "@/components/dashboard/DashboardKPICard";
import { useLocale, useTranslations } from "next-intl";
import { toIntlLocale } from "@/lib/i18n/locale";

interface DashboardFinancierProps {
  kpis: {
    revenusFactures: number;
    rabaisAccordes: number;
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
  const { formatCurrency } = useFormatteurs();
  /* Un point décimal dans une interface française trahit un nombre formaté en
     anglais. Les heures et les pourcentages passent par Intl, comme les
     montants le font déjà. */
  const nombre = new Intl.NumberFormat(toIntlLocale(useLocale()), {
    maximumFractionDigits: 2,
  });
  const tr = useTranslations("reportsUi");

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
      title: tr("discountsGranted"),
      value: formatCurrency(kpis.rabaisAccordes),
      icon: <Percent className="w-5 h-5" aria-hidden />,
      accent: "red" as const,
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
      accent: "emerald" as const,
    },
    {
      title: t("billableHours"),
      value: `${nombre.format(kpis.heuresFacturables)} h`,
      icon: <Clock className="w-5 h-5" aria-hidden />,
      accent: "blue" as const,
    },
    {
      title: t("realizationRate"),
      value: `${nombre.format(kpis.tauxRealisation)} %`,
      icon: <Percent className="w-5 h-5" aria-hidden />,
      accent: "amber" as const,
    },
  ];

  const chartData = revenueByMonth.slice(-12).map((d) => ({ name: d.label, value: d.value }));
  const hasChartData = chartData.some((d) => d.value > 0);

  return (
    <div className="space-y-6">
      {/* Trois colonnes au lieu de quatre : à quatre, la zone de texte d'une
          carte tombait sous 175 px, ce qui ne laisse pas la place d'un montant
          à sept chiffres, même réduit. La carte doit pouvoir porter son pire
          chiffre, pas seulement celui du jour. */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
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
      <div className="safe-feuille p-5 md:p-6">
        <h3 className="text-sm font-medium text-si-ink mb-4 tracking-tight">
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
                  tick={{ fill: "var(--si-muted)", fontSize: 10 }}
                />
                <YAxis hide />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {chartData.map((_, index) => (
                    <Cell
                      key={index}
                      fill={
                        index === chartData.length - 1
                          ? "var(--si-verified)"
                          : index >= chartData.length - 3
                            ? "#6FA98E"
                            : "#D9DED8"
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="text-sm text-si-muted py-8 text-center">
            {t("noPeriodData")}
          </p>
        )}
      </div>
    </div>
  );
}
