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

/**
 * Éditorial Chaleureux revenue chart.
 * Sand-50 card, forest-green area + stroke, sand grid lines.
 */
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
    <div
      className="p-5 md:p-6"
      style={{
        background: "var(--sand-50)",
        border: "1px solid var(--sand-300)",
        borderRadius: 12,
        boxShadow: "0 1px 2px rgba(11,11,12,0.04)",
      }}
    >
      <div className="flex items-start justify-between mb-5 flex-wrap gap-2">
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
            <TrendingUp
              className="w-4 h-4"
              strokeWidth={1.5}
              style={{ color: "var(--brand-800)" }}
              aria-hidden
            />
            {t("revenueEncashments")}
          </h3>
          <p
            className="mt-0.5"
            style={{ fontSize: 12, color: "var(--sand-600)", margin: 0 }}
          >
            {t("perMonth")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div
            className="flex p-1 rounded-md"
            style={{
              background: "var(--sand-100)",
              border: "1px solid var(--sand-300)",
            }}
          >
            {RANGE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setRange(opt.value)}
                className="px-3 py-1 rounded-md text-xs font-medium transition-colors"
                style={{
                  background: range === opt.value ? "var(--brand-800)" : "transparent",
                  color:
                    range === opt.value ? "var(--sand-50)" : "var(--sand-700)",
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <Link
            href={routes.rapports}
            className="w-8 h-8 rounded-md flex items-center justify-center transition-colors"
            style={{
              background: "var(--sand-100)",
              border: "1px solid var(--sand-300)",
              color: "var(--sand-700)",
            }}
            aria-label={t("viewReports")}
          >
            <Maximize2 className="w-4 h-4" strokeWidth={1.5} />
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
                  <stop offset="0%" stopColor="#1F3A2E" stopOpacity={0.22} />
                  <stop offset="100%" stopColor="#1F3A2E" stopOpacity={0.02} />
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
                width={50}
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
                labelStyle={{ color: "#605B52", fontWeight: 500 }}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#1F3A2E"
                strokeWidth={2}
                fill="url(#revenueGradient)"
                isAnimationActive
                animationBegin={0}
                animationDuration={800}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div
          className="h-52 flex flex-col items-center justify-center gap-2"
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
