"use client";

import Link from "next/link";
import { Maximize2 } from "lucide-react";
import { routes } from "@/lib/routes";
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import type { TimeFilter } from "./DashboardSpendingCard";

const CHART_PRIMARY = "var(--safe-chart-primary)";
const CHART_SECONDARY = "var(--safe-chart-secondary)";

interface DashboardActivityCardProps {
  totalLabel: string;
  totalValue: string;
  data: { time: string; value: number }[];
  timeFilter: TimeFilter;
  growthLabel?: string;
}

export function DashboardActivityCard({
  totalLabel,
  totalValue,
  data,
  timeFilter,
  growthLabel,
}: DashboardActivityCardProps) {
  const hasData = data.length > 0;

  return (
    <div className="card-glass overflow-hidden p-5 md:p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold safe-text-title">
            Activité des encaissements
          </h3>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xl md:text-2xl font-bold safe-text-metric">
              {totalValue}
            </span>
            <span className="text-sm safe-text-secondary">{totalLabel}</span>
          </div>
        </div>
        <Link
          href={routes.rapports}
          className="w-8 h-8 rounded-lg bg-neutral-100 hover:bg-neutral-300 flex items-center justify-center transition-colors text-[var(--safe-icon-default)] hover:text-green-800"
          aria-label="Voir rapports"
        >
          <Maximize2 className="w-4 h-4" />
        </Link>
      </div>
      {hasData ? (
        <div className="h-36 md:h-44">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="activityFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={CHART_SECONDARY} stopOpacity={0.25} />
                  <stop offset="100%" stopColor={CHART_SECONDARY} stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="time"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "var(--safe-text-secondary)", fontSize: 10 }}
              />
              <YAxis axisLine={false} tickLine={false} hide />
              <Tooltip
                formatter={(value: number) => [value, "Encaissements"]}
                contentStyle={{
                  backgroundColor: "rgba(255,255,255,0.98)",
                  border: "1px solid var(--safe-neutral-border)",
                  borderRadius: "12px",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                  color: "var(--safe-text-title)",
                }}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke={CHART_SECONDARY}
                strokeWidth={2}
                fill="url(#activityFill)"
                dot={{ fill: CHART_SECONDARY, strokeWidth: 1, r: 3, stroke: "#fff" }}
                activeDot={{ r: 5, fill: CHART_SECONDARY }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="h-36 md:h-44 flex items-center justify-center safe-text-secondary text-sm">
          Aucune donnée sur la période
        </div>
      )}
      {(growthLabel || totalLabel) && (
        <div className="flex items-center justify-between pt-3 border-t border-[var(--safe-neutral-border)] mt-2">
          <span className="text-sm safe-text-secondary">
            {timeFilter === "month" ? "Ce mois" : timeFilter === "week" ? "Cette semaine" : "Aujourd'hui"}
          </span>
          {growthLabel && (
            <span className="text-sm font-medium text-green-700 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-700" aria-hidden />
              {growthLabel}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
