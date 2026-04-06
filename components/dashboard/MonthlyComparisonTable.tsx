"use client";

import { useLocale, useTranslations } from "next-intl";
import { BarChart2, TrendingUp, TrendingDown } from "lucide-react";
import { formatCurrency } from "@/lib/utils/format";
import type { MonthlyComparisonRow } from "@/lib/dashboard/types";

export interface MonthlyComparisonTableProps {
  rows: MonthlyComparisonRow[];
}

export function MonthlyComparisonTable({ rows }: MonthlyComparisonTableProps) {
  const t = useTranslations("dashboard");
  const locale = useLocale();

  const year = new Date().getFullYear();

  return (
    <div className="bg-white rounded-safe-md border border-[var(--safe-neutral-border)] shadow-sm p-5 md:p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-base font-semibold text-[var(--safe-text-title)] flex items-center gap-2 tracking-tight">
            <BarChart2 className="w-4 h-4 text-emerald-600" />
            {t("monthlyComparison.title")}
          </h3>
          <p className="text-xs text-[var(--safe-text-muted)] mt-0.5">
            {t("monthlyComparison.subtitle", { year })}
          </p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm" role="table">
          <thead>
            <tr className="border-b-2 border-[var(--safe-neutral-border)]">
              <th className="text-left py-2 px-2 font-semibold text-[var(--safe-text-title)] text-xs uppercase tracking-wider">
                {t("monthlyComparison.month")}
              </th>
              <th className="text-right py-2 px-2 font-semibold text-[var(--safe-text-title)] text-xs uppercase tracking-wider">
                {t("monthlyComparison.invoiced")}
              </th>
              <th className="text-right py-2 px-2 font-semibold text-[var(--safe-text-title)] text-xs uppercase tracking-wider">
                {t("monthlyComparison.collected")}
              </th>
              <th className="text-right py-2 px-2 font-semibold text-[var(--safe-text-title)] text-xs uppercase tracking-wider">
                {t("monthlyComparison.gap")}
              </th>
              <th className="text-right py-2 px-2 font-semibold text-[var(--safe-text-title)] text-xs uppercase tracking-wider">
                {t("monthlyComparison.rate")}
              </th>
              <th className="text-right py-2 px-2 font-semibold text-[var(--safe-text-title)] text-xs uppercase tracking-wider">
                Delta
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr
                key={row.month}
                className={`border-b border-[var(--safe-neutral-100)] last:border-0 ${
                  i % 2 === 0 ? "bg-[var(--safe-white)]" : ""
                }`}
              >
                <td className="py-2 px-2 font-medium text-[var(--safe-text-title)] capitalize">{row.month}</td>
                <td className="py-2 px-2 text-right text-[var(--safe-text-title)]">{formatCurrency(row.invoiced, "CAD", locale)}</td>
                <td className="py-2 px-2 text-right text-emerald-700 font-medium">{formatCurrency(row.collected, "CAD", locale)}</td>
                <td className={`py-2 px-2 text-right font-medium ${row.gap > 0 ? "text-red-600" : "text-emerald-600"}`}>
                  {formatCurrency(row.gap, "CAD", locale)}
                </td>
                <td className="py-2 px-2 text-right">
                  <span
                    className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full ${
                      row.rate >= 80
                        ? "bg-emerald-50 text-emerald-700"
                        : row.rate >= 50
                          ? "bg-amber-50 text-amber-700"
                          : "bg-red-50 text-red-600"
                    }`}
                  >
                    {row.rate}%
                  </span>
                </td>
                <td className="py-2 px-2 text-right">
                  {row.delta !== 0 && (
                    <span className={`inline-flex items-center gap-0.5 text-xs font-medium ${
                      row.delta > 0 ? "text-emerald-600" : "text-red-500"
                    }`}>
                      {row.delta > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      {row.delta > 0 ? "+" : ""}{row.delta}%
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
