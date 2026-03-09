"use client";

import { CheckCircle2, AlertCircle, AlertTriangle } from "lucide-react";
import { useTranslations } from "next-intl";
import type { NormalizedRow } from "@/lib/import/types";

export function PreviewTable({
  rows,
  fieldLabels,
  totalRows,
}: {
  rows: NormalizedRow[];
  fieldLabels: Record<string, string>;
  totalRows: number;
}) {
  const t = useTranslations("import");
  const fields = Object.keys(fieldLabels);
  const validCount = rows.filter((r) => r.errors.length === 0).length;
  const errorCount = rows.filter((r) => r.errors.length > 0).length;
  const warningCount = rows.filter((r) => r.warnings.length > 0).length;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4 flex-wrap">
        <span className="text-xs safe-text-secondary">
          {t("previewOf", { shown: rows.length, total: totalRows })}
        </span>
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1 text-xs text-[var(--safe-status-success)]">
            <CheckCircle2 className="w-3.5 h-3.5" />
            {t("validCount", { count: validCount })}
          </span>
          {errorCount > 0 && (
            <span className="inline-flex items-center gap-1 text-xs text-[var(--safe-status-error)]">
              <AlertCircle className="w-3.5 h-3.5" />
              {t("errorCountLabel", { count: errorCount })}
            </span>
          )}
          {warningCount > 0 && (
            <span className="inline-flex items-center gap-1 text-xs text-[var(--safe-status-warning)]">
              <AlertTriangle className="w-3.5 h-3.5" />
              {t("warningCount", { count: warningCount })}
            </span>
          )}
        </div>
      </div>

      <div className="overflow-auto max-h-[420px] rounded-[var(--safe-radius-lg)] border border-[var(--safe-neutral-border)]/60">
        <table className="w-full text-left">
          <thead className="table-header sticky top-0 z-10">
            <tr>
              <th className="px-3 py-2.5 text-xs font-semibold uppercase tracking-wider">#</th>
              <th className="px-3 py-2.5 text-xs font-semibold uppercase tracking-wider">{t("statusHeader")}</th>
              {fields.map((f) => (
                <th key={f} className="px-3 py-2.5 text-xs font-semibold uppercase tracking-wider whitespace-nowrap">
                  {fieldLabels[f]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const hasError = row.errors.length > 0;
              const hasWarning = row.warnings.length > 0;
              const data = row.data as Record<string, unknown>;
              return (
                <tr
                  key={row.index}
                  className={`table-row-hover border-t border-[var(--safe-neutral-border)]/40 ${
                    hasError ? "bg-[var(--safe-status-error-bg)]/30" : ""
                  }`}
                >
                  <td className="px-3 py-2 text-xs safe-text-secondary">{row.index + 1}</td>
                  <td className="px-3 py-2">
                    {hasError ? (
                      <span className="inline-flex items-center gap-1" title={row.errors.map((e) => e.message).join(", ")}>
                        <AlertCircle className="w-3.5 h-3.5 text-[var(--safe-status-error)]" />
                      </span>
                    ) : hasWarning ? (
                      <span className="inline-flex items-center gap-1" title={row.warnings.join(", ")}>
                        <AlertTriangle className="w-3.5 h-3.5 text-[var(--safe-status-warning)]" />
                      </span>
                    ) : (
                      <CheckCircle2 className="w-3.5 h-3.5 text-[var(--safe-status-success)]" />
                    )}
                  </td>
                  {fields.map((f) => (
                    <td key={f} className="px-3 py-2 text-xs safe-text-title whitespace-nowrap max-w-[200px] truncate">
                      {data[f] != null ? String(data[f]) : "—"}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
