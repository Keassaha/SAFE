"use client";

import { CheckCircle2, AlertCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import type { ImportResult } from "@/lib/import/types";

export function ImportResultSummary({
  result,
  onReset,
}: {
  result: ImportResult;
  onReset: () => void;
}) {
  const t = useTranslations("import");
  const TYPE_LABELS: Record<string, string> = {
    releve_bancaire: t("bankStatement"),
    registre_clients: t("clientRegistry"),
    fiches_temps: t("timesheets"),
  };
  const hasErrors = result.errors.length > 0;
  const allSuccess = result.created > 0 && result.errors.length === 0;

  return (
    <div className="space-y-6 animate-fade-in">
      <div
        className={`flex items-center gap-3 px-5 py-4 rounded-[var(--safe-radius-lg)] border ${
          allSuccess
            ? "bg-[var(--safe-status-success-bg)] border-[var(--safe-status-success)]/20"
            : "bg-[var(--safe-status-warning-bg)] border-[var(--safe-status-warning)]/20"
        }`}
      >
        {allSuccess ? (
          <CheckCircle2 className="w-5 h-5 text-[var(--safe-status-success)] shrink-0" />
        ) : (
          <AlertCircle className="w-5 h-5 text-[var(--safe-status-warning)] shrink-0" />
        )}
        <div>
          <p className="text-sm font-medium safe-text-title">
            {t("importComplete")} {TYPE_LABELS[result.documentType] ?? result.documentType}
          </p>
          <p className="text-xs safe-text-secondary mt-0.5">{result.fileName}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <MetricCard label={t("totalLines")} value={result.totalRows} />
        <MetricCard label={t("created")} value={result.created} color="success" />
        <MetricCard label={t("ignored")} value={result.skipped} color="warning" />
        <MetricCard label={t("errorsLabel")} value={result.errors.length} color="error" />
      </div>

      {hasErrors && (
        <Card>
          <CardHeader title={t("errorsCount", { count: result.errors.length })} />
          <CardContent className="p-0">
            <div className="max-h-[250px] overflow-auto">
              <table className="w-full text-left">
                <thead className="table-header sticky top-0 z-10">
                  <tr>
                    <th className="px-4 py-2 text-xs font-semibold uppercase tracking-wider">{t("lineColumn")}</th>
                    <th className="px-4 py-2 text-xs font-semibold uppercase tracking-wider">{t("messageColumn")}</th>
                  </tr>
                </thead>
                <tbody>
                  {result.errors.map((err, i) => (
                    <tr key={i} className="border-t border-[var(--safe-neutral-border)]/40">
                      <td className="px-4 py-2 text-xs safe-text-secondary">{err.row}</td>
                      <td className="px-4 py-2 text-xs text-[var(--safe-status-error)]">{err.message}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-center pt-2">
        <Button variant="primary" onClick={onReset}>
          {t("newImport")}
        </Button>
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color?: "success" | "warning" | "error";
}) {
  const colorClass = color === "success"
    ? "text-[var(--safe-status-success)]"
    : color === "warning"
      ? "text-[var(--safe-status-warning)]"
      : color === "error"
        ? "text-[var(--safe-status-error)]"
        : "safe-text-metric";

  return (
    <div className="flex flex-col items-center gap-1 px-4 py-4 rounded-[var(--safe-radius-lg)] bg-white/70 border border-[var(--safe-neutral-border)]/60">
      <span className={`text-2xl font-bold ${colorClass}`}>{value.toLocaleString()}</span>
      <span className="text-xs safe-text-secondary">{label}</span>
    </div>
  );
}
