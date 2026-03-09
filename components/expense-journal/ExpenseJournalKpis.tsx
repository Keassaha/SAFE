"use client";

import { Card, CardContent } from "@/components/ui/Card";
import { formatCurrency } from "@/lib/utils/format";
import type { ExpenseJournalKpisData } from "@/app/(app)/journal/depenses/ExpenseJournalPageView";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

export function ExpenseJournalKpis({ data }: { data: ExpenseJournalKpisData }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      <Card>
        <div className="px-6 pt-4 pb-1">
          <span className="text-xs font-medium text-[var(--safe-text-muted)] uppercase tracking-wider">
            Dépenses du mois
          </span>
        </div>
        <CardContent className="pt-0">
          <p className="text-xl font-semibold text-[var(--safe-text-title)]">
            {formatCurrency(data.totalMonth)}
          </p>
          {data.variation != null && (
            <p className="mt-1 flex items-center gap-1 text-xs text-[var(--safe-text-muted)]">
              {data.variation > 0 && <TrendingUp className="h-3.5 w-3.5" />}
              {data.variation < 0 && <TrendingDown className="h-3.5 w-3.5" />}
              {data.variation === 0 && <Minus className="h-3.5 w-3.5" />}
              {data.variation > 0 ? "+" : ""}
              {data.variation.toFixed(1)} % vs mois préc.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <div className="px-6 pt-4 pb-1">
          <span className="text-xs font-medium text-[var(--safe-text-muted)] uppercase tracking-wider">
            Dépenses année
          </span>
        </div>
        <CardContent className="pt-0">
          <p className="text-xl font-semibold text-[var(--safe-text-title)]">
            {formatCurrency(data.totalYear)}
          </p>
        </CardContent>
      </Card>

      <Card>
        <div className="px-6 pt-4 pb-1">
          <span className="text-xs font-medium text-[var(--safe-text-muted)] uppercase tracking-wider">
            Non catégorisées
          </span>
        </div>
        <CardContent className="pt-0">
          <p className="text-xl font-semibold text-[var(--safe-text-title)]">
            {data.uncategorizedCount}
          </p>
        </CardContent>
      </Card>

      <Card>
        <div className="px-6 pt-4 pb-1">
          <span className="text-xs font-medium text-[var(--safe-text-muted)] uppercase tracking-wider">
            À valider
          </span>
        </div>
        <CardContent className="pt-0">
          <p className="text-xl font-semibold text-[var(--safe-text-title)]">
            {data.toValidateCount}
          </p>
        </CardContent>
      </Card>

      <Card>
        <div className="px-6 pt-4 pb-1">
          <span className="text-xs font-medium text-[var(--safe-text-muted)] uppercase tracking-wider">
            Catégorie la plus coûteuse
          </span>
        </div>
        <CardContent className="pt-0">
          <p className="text-sm font-medium text-[var(--safe-text-title)] truncate" title={data.topCategoryName ?? undefined}>
            {data.topCategoryName ?? "—"}
          </p>
          <p className="text-xs text-[var(--safe-text-muted)] mt-0.5">
            {formatCurrency(data.topCategoryAmount)}
          </p>
        </CardContent>
      </Card>

      <Card>
        <div className="px-6 pt-4 pb-1">
          <span className="text-xs font-medium text-[var(--safe-text-muted)] uppercase tracking-wider">
            Importées ce mois
          </span>
        </div>
        <CardContent className="pt-0">
          <p className="text-xl font-semibold text-[var(--safe-text-title)]">
            {data.importedThisMonth}
          </p>
          <p className="text-xs text-[var(--safe-text-muted)] mt-0.5">
            transactions
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
