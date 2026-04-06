"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Maximize2, TrendingUp, BarChart2 } from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { routes } from "@/lib/routes";
import type { RevenueChartPoint } from "@/lib/dashboard/types";

export type RevenueChartRange = 1 | 3 | 6 | 12;

export interface RevenueChartProps {
  data: RevenueChartPoint[];
  range?: RevenueChartRange;
}

export function RevenueChart({ data, range: initialRange = 6 }: RevenueChartProps) {
  const t = useTranslations("dashboard");

  const RANGE_OPTIONS: { value: RevenueChartRange; label: string }[] = [
    { value: 3, label: t("threeMonths") },
    { value: 6, label: t("sixMonths") },
    { value: 12, label: t("twelveMonths") },
  ];
  const [range, setRange] = useState<RevenueChartRange>(initialRange);
  const sliced = data.slice(-range);
  const chartData = sliced.map((d) => ({ name: d.label, value: d.value }));
  const hasData = chartData.length > 0;

  return (
    <div className="bg-white rounded-safe-md border border-[var(--safe-neutral-border)] shadow-sm p-5 md:p-6">
      <div className="flex items-start justify-between mb-5 flex-wrap gap-2">
        <div>
          <h3 className="text-base font-semibold text-[var(--safe-text-title)] flex items-center gap-2 tracking-tight">
            <TrendingUp className="w-4 h-4 text-emerald-600" aria-hidden />
            {t("revenueEncashments")}
          </h3>
          <p className="text-xs text-[var(--safe-text-muted)] mt-0.5">
            {t("perMonth")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-safe-sm bg-[var(--safe-neutral-page)] p-1">
            {RANGE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setRange(opt.value)}
                className={`px-3 py-1.5 rounded-safe-sm text-xs font-medium transition-colors ${
                  range === opt.value
                    ? "bg-[var(--safe-gradient-sidebar)] text-white shadow-sm"
                    : "text-[var(--safe-text-secondary)] hover:text-[var(--safe-text-title)] hover:bg-white"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <Link
            href={routes.rapports}
            className="w-8 h-8 rounded-safe-sm bg-[var(--safe-neutral-page)] hover:bg-[var(--safe-neutral-100)] flex items-center justify-center transition-colors text-[var(--safe-text-secondary)]"
            aria-label={t("viewReports")}
          >
            <Maximize2 className="w-4 h-4" />
          </Link>
        </div>
      </div>
      {hasData ? (
        <div className="h-52 md:h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="#10b981" stopOpacity={0.02} />
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
                tick={{ fill: "var(--safe-text-muted)", fontSize: 11 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "var(--safe-text-muted)", fontSize: 11 }}
                width={50}
              />
              <Tooltip
                contentStyle={{
                  background: "var(--safe-neutral-surface)",
                  border: "1px solid var(--safe-neutral-border)",
                  borderRadius: "12px",
                  boxShadow: "0 4px 16px rgba(26,46,40,0.08)",
                  color: "var(--safe-text-title)",
                  fontSize: "13px",
                }}
                labelStyle={{ color: "var(--safe-text-secondary)", fontWeight: 500 }}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#10b981"
                strokeWidth={2.5}
                fill="url(#revenueGradient)"
                isAnimationActive
                animationBegin={0}
                animationDuration={800}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="h-52 flex flex-col items-center justify-center text-sm text-[var(--safe-text-muted)] gap-2">
          <BarChart2 className="w-10 h-10 text-[var(--safe-neutral-300)]" aria-hidden />
          {t("noRevenueData")}
        </div>
      )}
    </div>
  );
}
