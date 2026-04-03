"use client";

import { useLocale, useTranslations } from "next-intl";
import { BarChart2 } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { formatCurrency } from "@/lib/utils/format";
import type { MonthlyComparisonRow } from "@/lib/dashboard/types";

export interface MonthlyComparisonChartProps {
  rows: MonthlyComparisonRow[];
}

export function MonthlyComparisonChart({ rows }: MonthlyComparisonChartProps) {
  const t = useTranslations("dashboard");
  const locale = useLocale();
  const year = new Date().getFullYear();

  const chartData = rows.map((row) => ({
    name: row.month.slice(0, 3).charAt(0).toUpperCase() + row.month.slice(1, 3),
    invoiced: row.invoiced,
    collected: row.collected,
    rate: row.rate,
  }));

  const hasData = chartData.length > 0;

  return (
    <div className="bg-white rounded-2xl border border-[#d0ddd6] shadow-sm p-5 md:p-6">
      <div className="flex items-start justify-between mb-5">
        <div>
          <h3 className="text-base font-semibold text-[#1a2e28] flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-emerald-600" aria-hidden />
            {t("monthlyComparison.title")}
          </h3>
          <p className="text-xs text-[#6b8f7b] mt-0.5">
            {t("monthlyComparison.subtitle", { year })}
          </p>
        </div>
      </div>

      {hasData ? (
        <div className="h-64 md:h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
              barGap={2}
              barCategoryGap="20%"
            >
              <defs>
                <linearGradient id="invoicedGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity={0.6} />
                </linearGradient>
                <linearGradient id="collectedGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="#10b981" stopOpacity={0.6} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#e0ebe4"
                vertical={false}
              />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#6b8f7b", fontSize: 11 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#6b8f7b", fontSize: 11 }}
                width={60}
                tickFormatter={(v: number) =>
                  v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)
                }
              />
              <Tooltip
                contentStyle={{
                  background: "#ffffff",
                  border: "1px solid #d0ddd6",
                  borderRadius: "12px",
                  boxShadow: "0 4px 16px rgba(26,46,40,0.08)",
                  color: "#1a2e28",
                  fontSize: "13px",
                }}
                labelStyle={{ color: "#4a6a5c", fontWeight: 600, marginBottom: 4 }}
                formatter={(value: number, name: string) => [
                  formatCurrency(value, "CAD", locale),
                  name === "invoiced"
                    ? t("monthlyComparison.invoiced")
                    : t("monthlyComparison.collected"),
                ]}
              />
              <Legend
                verticalAlign="top"
                align="right"
                height={36}
                formatter={(value: string) =>
                  value === "invoiced"
                    ? t("monthlyComparison.invoiced")
                    : t("monthlyComparison.collected")
                }
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ fontSize: "12px", color: "#4a6a5c" }}
              />
              <Bar
                dataKey="invoiced"
                fill="url(#invoicedGradient)"
                radius={[4, 4, 0, 0]}
                maxBarSize={32}
              />
              <Bar
                dataKey="collected"
                fill="url(#collectedGradient)"
                radius={[4, 4, 0, 0]}
                maxBarSize={32}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="h-64 flex flex-col items-center justify-center text-sm text-[#6b8f7b] gap-2">
          <BarChart2 className="w-10 h-10 text-[#c8ddd0]" aria-hidden />
          {t("noRevenueData")}
        </div>
      )}
    </div>
  );
}
