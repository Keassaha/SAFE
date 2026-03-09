"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import type { BankImportTransaction, ExpenseCategory } from "@prisma/client";
import { ChevronRight } from "lucide-react";

const STATUS_LABELS: Record<string, string> = {
  new: "Nouveau",
  categorized: "Catégorisé",
  to_validate: "À valider",
  validated: "Validé",
  corrected: "Corrigé",
  ignored: "Ignoré",
};

export function ExpensesJournalTable({
  transactions,
  categories,
  selectedId,
  onSelectTransaction,
  onValidationComplete,
}: {
  transactions: BankImportTransaction[];
  categories: ExpenseCategory[];
  selectedId: string | null;
  onSelectTransaction: (id: string | null) => void;
  onValidationComplete: () => void;
}) {
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [filterCategory, setFilterCategory] = useState<string>("");

  const filtered = transactions.filter((t) => {
    if (filterStatus && t.status !== filterStatus) return false;
    if (filterCategory && (t.suggestedCategoryName ?? "") !== filterCategory) return false;
    return true;
  });

  return (
    <Card>
      <CardHeader
        title="Transactions importées"
        className="pb-2 flex flex-row flex-wrap items-center justify-between gap-4"
        action={
          <div className="flex flex-wrap items-center gap-2">
            <select
              className="rounded-md border border-[var(--safe-neutral-border)] bg-white/5 text-sm text-[var(--safe-text-title)] px-3 py-1.5"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="">Tous les statuts</option>
              {Object.entries(STATUS_LABELS).map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
            <select
              className="rounded-md border border-[var(--safe-neutral-border)] bg-white/5 text-sm text-[var(--safe-text-title)] px-3 py-1.5"
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
            >
              <option value="">Toutes catégories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        }
      />
      <CardContent className="p-0">
        {filtered.length === 0 ? (
          <div className="py-12 text-center text-sm text-[var(--safe-text-muted)]">
            Aucune transaction à afficher. Importez un relevé bancaire pour commencer.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--safe-neutral-border)]/60">
                  <th className="text-left py-3 px-4 font-medium text-[var(--safe-text-muted)]">Date</th>
                  <th className="text-left py-3 px-4 font-medium text-[var(--safe-text-muted)]">Description</th>
                  <th className="text-left py-3 px-4 font-medium text-[var(--safe-text-muted)]">Fournisseur</th>
                  <th className="text-right py-3 px-4 font-medium text-[var(--safe-text-muted)]">Montant</th>
                  <th className="text-left py-3 px-4 font-medium text-[var(--safe-text-muted)]">Catégorie</th>
                  <th className="text-left py-3 px-4 font-medium text-[var(--safe-text-muted)]">Confiance</th>
                  <th className="text-left py-3 px-4 font-medium text-[var(--safe-text-muted)]">Statut</th>
                  <th className="w-10" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((t) => (
                  <tr
                    key={t.id}
                    className={`border-b border-[var(--safe-neutral-border)]/40 hover:bg-white/5 cursor-pointer transition-colors ${
                      selectedId === t.id ? "bg-white/10" : ""
                    }`}
                    onClick={() => onSelectTransaction(selectedId === t.id ? null : t.id)}
                  >
                    <td className="py-2.5 px-4 text-[var(--safe-text-title)] whitespace-nowrap">
                      {formatDate(t.date)}
                    </td>
                    <td className="py-2.5 px-4 text-[var(--safe-text-title)] max-w-[200px] truncate" title={t.rawDescription}>
                      {t.rawDescription}
                    </td>
                    <td className="py-2.5 px-4 text-[var(--safe-text-muted)]">
                      {t.normalizedSupplier ?? "—"}
                    </td>
                    <td className="py-2.5 px-4 text-right font-medium text-[var(--safe-text-title)]">
                      {formatCurrency(t.rawAmount)}
                    </td>
                    <td className="py-2.5 px-4 text-[var(--safe-text-muted)]">
                      {t.suggestedCategoryName ?? "—"}
                    </td>
                    <td className="py-2.5 px-4">
                      {t.confidence != null ? (
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                            t.confidence >= 0.9
                              ? "bg-green-500/20 text-green-700 dark:text-green-400"
                              : t.confidence >= 0.6
                                ? "bg-amber-500/20 text-amber-700 dark:text-amber-400"
                                : "bg-neutral-500/20 text-neutral-600 dark:text-neutral-400"
                          }`}
                        >
                          {Math.round(t.confidence * 100)} %
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="py-2.5 px-4">
                      <span className="text-xs text-[var(--safe-text-muted)]">
                        {STATUS_LABELS[t.status] ?? t.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-2">
                      {selectedId === t.id ? (
                        <ChevronRight className="h-4 w-4 text-[var(--safe-primary-600)] rotate-90" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-[var(--safe-text-muted)]" />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
