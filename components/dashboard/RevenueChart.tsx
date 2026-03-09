"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Maximize2, TrendingUp, BarChart2 } from "lucide-react";
import { BarChart, Bar, XAxis, ResponsiveContainer, Cell } from "recharts";
import { routes } from "@/lib/routes";
import type { RevenueChartPoint } from "@/lib/dashboard/types";

const CHART_PRIMARY = "var(--safe-chart-primary)";

export type RevenueChartRange = 1 | 3 | 6 | 12;

export interface RevenueChartProps {
  data: RevenueChartPoint[];
  range?: RevenueChartRange;
}

export function RevenueChart({ data, range: initialRange = 12 }: RevenueChartProps) {
  const t = useTranslations("dashboard");

  const RANGE_OPTIONS: { value: RevenueChartRange; label: string }[] = [
    { value: 1, label: t("thisMonth") },
    { value: 3, label: t("threeMonths") },
    { value: 6, label: t("sixMonths") },
    { value: 12, label: t("twelveMonths") },
  ];
  const [range, setRange] = useState<RevenueChartRange>(initialRange);
  const sliced = data.slice(-range);
  const chartData = sliced.map((d) => ({ name: d.label, value: d.value }));
  const hasData = chartData.length > 0;

  return (
    <div className="card-glass overflow-hidden p-5 md:p-6 border-l-4 border-l-emerald-500">
      <div className="flex items-start justify-between mb-4 flex-wrap gap-2">
        <div>
          <h3 className="text-sm font-semibold safe-text-title flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-emerald-600" aria-hidden />
            {t("revenueEncashments")}
          </h3>
          <p className="text-xs safe-text-secondary mt-0.5">
            {t("perMonth")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-[var(--safe-neutral-border)] p-0.5">
            {RANGE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setRange(opt.value)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  range === opt.value
                    ? "bg-gold-500 text-white"
                    : "text-[var(--safe-text-secondary)] hover:bg-white/80"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <Link
            href={routes.rapports}
            className="w-8 h-8 rounded-lg bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center transition-colors text-[var(--safe-icon-default)]"
            aria-label={t("viewReports")}
          >
            <Maximize2 className="w-4 h-4" />
          </Link>
        </div>
      </div>
      {hasData ? (
        <div className="h-48 md:h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
            >
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "var(--safe-text-secondary)", fontSize: 10 }}
              />
              <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                {chartData.map((_, index) => {
                  const isLast = index === chartData.length - 1;
                  const isSecondLast = index === chartData.length - 2;
                  return (
                    <Cell
                      key={index}
                      fill={
                        isLast
                          ? "#10b981"
                          : isSecondLast
                            ? "#34d399"
                            : index >= chartData.length - 4
                              ? "#6ee7b7"
                              : "var(--safe-neutral-border)"
                      }
                    />
                  );
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="h-48 flex flex-col items-center justify-center text-sm safe-text-secondary gap-1">
          <BarChart2 className="w-10 h-10 text-[var(--safe-neutral-border)]" aria-hidden />
          {t("noRevenueData")}
        </div>
      )}
    </div>
  );
}
