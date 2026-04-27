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

/**
 * Éditorial Chaleureux comparison chart.
 * Forest solid bars for "invoiced", warm gold bars for "collected".
 * Sand grid + sand-600 axis text.
 */
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
    <div
      className="p-5 md:p-6"
      style={{
        background: "var(--sand-50)",
        border: "1px solid var(--sand-300)",
        borderRadius: 12,
        boxShadow: "0 1px 2px rgba(11,11,12,0.04)",
      }}
    >
      <div className="flex items-start justify-between mb-5">
        <div>
          <h3
            className="flex items-center gap-2 tracking-tight"
            style={{
              fontSize: 15,
              fontWeight: 600,
              color: "var(--zinc-950)",
              letterSpacing: "-0.01em",
              margin: 0,
            }}
          >
            <BarChart2
              className="w-4 h-4"
              strokeWidth={1.5}
              style={{ color: "var(--brand-800)" }}
              aria-hidden
            />
            {t("monthlyComparison.title")}
          </h3>
          <p
            className="mt-0.5"
            style={{ fontSize: 12, color: "var(--sand-600)", margin: 0 }}
          >
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
                  <stop offset="0%" stopColor="#1F3A2E" stopOpacity={0.95} />
                  <stop offset="100%" stopColor="#1F3A2E" stopOpacity={0.75} />
                </linearGradient>
                <linearGradient id="collectedGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#F4A045" stopOpacity={0.95} />
                  <stop offset="100%" stopColor="#F4A045" stopOpacity={0.70} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#E8DCC4"
                vertical={false}
              />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#8B8680", fontSize: 11 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#8B8680", fontSize: 11 }}
                width={60}
                tickFormatter={(v: number) =>
                  v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)
                }
              />
              <Tooltip
                contentStyle={{
                  background: "#FCFAF4",
                  border: "1px solid #E8DCC4",
                  borderRadius: "10px",
                  boxShadow: "0 4px 16px rgba(11,11,12,0.08)",
                  color: "#0B0B0C",
                  fontSize: "13px",
                }}
                labelStyle={{
                  color: "#605B52",
                  fontWeight: 600,
                  marginBottom: 4,
                }}
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
                wrapperStyle={{ fontSize: "12px", color: "#605B52" }}
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
        <div
          className="h-64 flex flex-col items-center justify-center gap-2"
          style={{ fontSize: 13, color: "var(--sand-600)" }}
        >
          <BarChart2
            className="w-10 h-10"
            strokeWidth={1.5}
            style={{ color: "var(--sand-400)" }}
            aria-hidden
          />
          {t("noRevenueData")}
        </div>
      )}
    </div>
  );
}
