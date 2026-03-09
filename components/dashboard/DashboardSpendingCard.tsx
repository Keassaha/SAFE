"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { Maximize2 } from "lucide-react";
import { routes } from "@/lib/routes";
import { BarChart, Bar, XAxis, ResponsiveContainer, Cell } from "recharts";

export type TimeFilter = "day" | "week" | "month";

const CHART_PRIMARY = "var(--safe-chart-primary)";
const CHART_SECONDARY = "var(--safe-chart-secondary)";

interface DashboardSpendingCardProps {
  encaisse: string;
  objectifOuTotal: string;
  objectifLabel?: string;
  percentEncaisse: number;
  data: { name: string; value: number }[];
  timeFilter: TimeFilter;
}

export function DashboardSpendingCard({
  encaisse,
  objectifOuTotal,
  objectifLabel = "objectif",
  percentEncaisse,
  data,
  timeFilter,
}: DashboardSpendingCardProps) {
  const td = useTranslations("dashboard");
  const hasData = data.length > 0;

  return (
    <div className="card-glass overflow-hidden p-5 md:p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold safe-text-title">
            {td("spendingOverview")}
          </h3>
          <p className="text-xs safe-text-secondary mt-0.5">
            {timeFilter === "day" ? td("vsPreviousDay") : timeFilter === "week" ? td("vsPreviousWeek") : td("vsPreviousMonth")}
          </p>
        </div>
        <Link
          href={routes.rapports}
          className="w-8 h-8 rounded-lg bg-neutral-100 hover:bg-neutral-300 flex items-center justify-center transition-colors text-[var(--safe-icon-default)] hover:text-green-800"
          aria-label={td("viewReportsLabel")}
        >
          <Maximize2 className="w-4 h-4" />
        </Link>
      </div>
      <div className="mb-4">
        <span className="text-xl md:text-2xl font-bold safe-text-metric">
          {encaisse}
        </span>
        <span className="text-sm safe-text-secondary"> / {objectifOuTotal}</span>
      </div>
      {hasData && (
        <div className="mb-4 h-20 md:h-24">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
            >
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "var(--safe-text-secondary)", fontSize: 10 }}
              />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {data.map((_, index) => (
                  <Cell
                    key={index}
                    fill={index === data.length - 1 ? CHART_PRIMARY : "var(--safe-neutral-border)"}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
      <div className="flex items-center justify-between pt-3 border-t border-[var(--safe-neutral-border)]">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-gold-500" aria-hidden />
            <span className="text-xs safe-text-secondary">{td("pendingLabel")}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-green-700" aria-hidden />
            <span className="text-xs safe-text-secondary">{td("collectedLabel")}</span>
          </div>
        </div>
        <span className="text-sm font-bold safe-text-metric">
          {Math.min(100, Math.round(percentEncaisse))}%
        </span>
      </div>
      <div className="mt-3 h-2 bg-[var(--safe-neutral-border)] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${Math.min(100, percentEncaisse)}%`, background: CHART_SECONDARY }}
        />
      </div>
    </div>
  );
}
