"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  History,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  FileText,
  Clock,
  Filter,
  RefreshCw,
} from "lucide-react";
import type { ImportHistoryEntry } from "@/app/(app)/import/actions";
import { getImportHistory, getImportHistoryErrors } from "@/app/(app)/import/actions";

const PAGE_SIZE = 10;

export function ImportHistoryTable() {
  const t = useTranslations("import");

  const TYPE_LABELS: Record<string, string> = {
    releve_bancaire: t("typeBankStatement"),
    registre_clients: t("typeClientRegistry"),
    fiches_temps: t("typeTimesheets"),
  };

  const SOURCE_LABELS: Record<string, string> = {
    safe_import: t("sourceSafeImport"),
    journal_depenses: t("sourceExpenseJournal"),
  };

  const STATUS_CONFIG: Record<string, { label: string; variant: "success" | "warning" | "error" }> = {
    success: { label: t("statusSuccess"), variant: "success" },
    partial: { label: t("statusPartial"), variant: "warning" },
    failed: { label: t("statusFailed"), variant: "error" },
  };
  const [entries, setEntries] = useState<ImportHistoryEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [expandedErrors, setExpandedErrors] = useState<Array<{ row: number; message: string }>>([]);
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [filterType, setFilterType] = useState<string>("");

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getImportHistory({
        limit: PAGE_SIZE,
        offset: page * PAGE_SIZE,
        status: filterStatus || undefined,
        documentType: filterType || undefined,
      });
      setEntries(result.entries);
      setTotal(result.total);
    } finally {
      setLoading(false);
    }
  }, [page, filterStatus, filterType]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const toggleErrors = async (entry: ImportHistoryEntry) => {
    if (expandedId === entry.id) {
      setExpandedId(null);
      setExpandedErrors([]);
      return;
    }
    setExpandedId(entry.id);
    if (entry.errorCount > 0) {
      const errors = await getImportHistoryErrors(entry.id);
      setExpandedErrors(errors);
    } else {
      setExpandedErrors([]);
    }
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString("fr-CA", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDuration = (ms: number | null) => {
    if (ms === null) return "—";
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  return (
    <Card>
      <CardHeader
        title={t("importHistory")}
        action={
          <Button variant="tertiary" onClick={fetchHistory} disabled={loading}>
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        }
      />
      <CardContent className="p-0">
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 px-6 py-3 border-b border-[var(--safe-neutral-border)]/40">
          <Filter className="w-4 h-4 safe-text-secondary" />
          <select
            value={filterStatus}
            onChange={(e) => { setFilterStatus(e.target.value); setPage(0); }}
            className="text-xs rounded-safe-sm border border-[var(--safe-neutral-border)]/60 bg-white/70 px-3 py-1.5 safe-text-title focus:outline-none focus:ring-1 focus:ring-[var(--safe-green-500)]"
          >
            <option value="">{t("allStatuses")}</option>
            <option value="success">{t("statusSuccess")}</option>
            <option value="partial">{t("statusPartial")}</option>
            <option value="failed">{t("statusFailed")}</option>
          </select>
          <select
            value={filterType}
            onChange={(e) => { setFilterType(e.target.value); setPage(0); }}
            className="text-xs rounded-safe-sm border border-[var(--safe-neutral-border)]/60 bg-white/70 px-3 py-1.5 safe-text-title focus:outline-none focus:ring-1 focus:ring-[var(--safe-green-500)]"
          >
            <option value="">{t("allTypes")}</option>
            <option value="registre_clients">{t("typeClientRegistry")}</option>
            <option value="fiches_temps">{t("typeTimesheets")}</option>
            <option value="releve_bancaire">{t("typeBankStatement")}</option>
          </select>
          <span className="text-xs safe-text-secondary ml-auto">
            {total} {t("importsCount")}
          </span>
        </div>

        {/* Table */}
        {loading && entries.length === 0 ? (
          <div className="flex items-center justify-center py-16">
            <RefreshCw className="w-5 h-5 animate-spin safe-text-secondary" />
          </div>
        ) : entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <History className="w-8 h-8 safe-text-secondary opacity-40" />
            <p className="text-sm safe-text-secondary">{t("noImportHistory")}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="table-header">
                <tr>
                  <th className="px-4 py-2 text-xs font-semibold uppercase tracking-wider">{t("dateColumn")}</th>
                  <th className="px-4 py-2 text-xs font-semibold uppercase tracking-wider">{t("fileColumn")}</th>
                  <th className="px-4 py-2 text-xs font-semibold uppercase tracking-wider hidden sm:table-cell">{t("typeColumn")}</th>
                  <th className="px-4 py-2 text-xs font-semibold uppercase tracking-wider hidden md:table-cell">{t("sourceColumn")}</th>
                  <th className="px-4 py-2 text-xs font-semibold uppercase tracking-wider">{t("statusColumn")}</th>
                  <th className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-right hidden sm:table-cell">{t("linesColumn")}</th>
                  <th className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-right hidden md:table-cell">{t("createdColumn")}</th>
                  <th className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-right hidden lg:table-cell">{t("errorsColumn")}</th>
                  <th className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-right hidden lg:table-cell">{t("durationColumn")}</th>
                  <th className="px-4 py-2 w-10" />
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => {
                  const statusCfg = STATUS_CONFIG[entry.status] ?? { label: entry.status, variant: "neutral" as const };
                  const isExpanded = expandedId === entry.id;

                  return (
                    <HistoryRow
                      key={entry.id}
                      entry={entry}
                      statusCfg={statusCfg}
                      isExpanded={isExpanded}
                      expandedErrors={expandedErrors}
                      onToggle={() => toggleErrors(entry)}
                      formatDate={formatDate}
                      formatDuration={formatDuration}
                    />
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-3 border-t border-[var(--safe-neutral-border)]/40">
            <span className="text-xs safe-text-secondary">
              {t("pageOf", { current: page + 1, total: totalPages })}
            </span>
            <div className="flex gap-1.5">
              <Button
                variant="tertiary"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="tertiary"
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function HistoryRow({
  entry,
  statusCfg,
  isExpanded,
  expandedErrors,
  onToggle,
  formatDate,
  formatDuration,
}: {
  entry: ImportHistoryEntry;
  statusCfg: { label: string; variant: "success" | "warning" | "error" };
  isExpanded: boolean;
  expandedErrors: Array<{ row: number; message: string }>;
  onToggle: () => void;
  formatDate: (iso: string) => string;
  formatDuration: (ms: number | null) => string;
}) {
  const t = useTranslations("import");

  const TYPE_LABELS: Record<string, string> = {
    releve_bancaire: t("typeBankStatement"),
    registre_clients: t("typeClientRegistry"),
    fiches_temps: t("typeTimesheets"),
  };

  const SOURCE_LABELS: Record<string, string> = {
    safe_import: t("sourceSafeImport"),
    journal_depenses: t("sourceExpenseJournal"),
  };
  return (
    <>
      <tr
        className={`border-t border-[var(--safe-neutral-border)]/40 hover:bg-[var(--safe-green-50)]/30 transition-colors cursor-pointer ${
          isExpanded ? "bg-[var(--safe-green-50)]/20" : ""
        }`}
        onClick={onToggle}
      >
        <td className="px-4 py-3 text-xs safe-text-secondary whitespace-nowrap">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 opacity-50" />
            {formatDate(entry.createdAt)}
          </div>
          {entry.userName && (
            <span className="text-xs safe-text-secondary opacity-70 block mt-0.5">
              {t("byUser", { name: entry.userName ?? "" })}
            </span>
          )}
        </td>
        <td className="px-4 py-3 text-xs safe-text-title font-medium max-w-[200px] truncate">
          <div className="flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 shrink-0 opacity-50" />
            <span className="truncate">{entry.fileName}</span>
          </div>
        </td>
        <td className="px-4 py-3 text-xs safe-text-secondary hidden sm:table-cell">
          {TYPE_LABELS[entry.documentType] ?? entry.documentType}
        </td>
        <td className="px-4 py-3 text-xs safe-text-secondary hidden md:table-cell">
          {SOURCE_LABELS[entry.source] ?? entry.source}
        </td>
        <td className="px-4 py-3">
          <StatusBadge label={statusCfg.label} variant={statusCfg.variant} />
        </td>
        <td className="px-4 py-3 text-xs safe-text-secondary text-right tabular-nums hidden sm:table-cell">
          {entry.totalRows.toLocaleString()}
        </td>
        <td className="px-4 py-3 text-xs text-right tabular-nums hidden md:table-cell">
          <span className="text-[var(--safe-status-success)]">{entry.createdCount.toLocaleString()}</span>
        </td>
        <td className="px-4 py-3 text-xs text-right tabular-nums hidden lg:table-cell">
          {entry.errorCount > 0 ? (
            <span className="text-[var(--safe-status-error)]">{entry.errorCount.toLocaleString()}</span>
          ) : (
            <span className="safe-text-secondary">0</span>
          )}
        </td>
        <td className="px-4 py-3 text-xs safe-text-secondary text-right tabular-nums hidden lg:table-cell">
          {formatDuration(entry.durationMs)}
        </td>
        <td className="px-4 py-3 text-right">
          {entry.errorCount > 0 ? (
            isExpanded ? (
              <ChevronUp className="w-4 h-4 safe-text-secondary inline" />
            ) : (
              <ChevronDown className="w-4 h-4 safe-text-secondary inline" />
            )
          ) : null}
        </td>
      </tr>

      {isExpanded && entry.errorCount > 0 && (
        <tr>
          <td colSpan={10} className="bg-[var(--safe-status-error-bg)]/30 px-6 py-3">
            <div className="max-h-[200px] overflow-auto">
              <table className="w-full text-left">
                <thead>
                  <tr>
                    <th className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider safe-text-secondary w-16">{t("lineColumn")}</th>
                    <th className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider safe-text-secondary">{t("errorMessage")}</th>
                  </tr>
                </thead>
                <tbody>
                  {expandedErrors.map((err, i) => (
                    <tr key={i} className="border-t border-[var(--safe-neutral-border)]/20">
                      <td className="px-3 py-1.5 text-xs safe-text-secondary tabular-nums">{err.row}</td>
                      <td className="px-3 py-1.5 text-xs text-[var(--safe-status-error)]">{err.message}</td>
                    </tr>
                  ))}
                  {expandedErrors.length === 0 && (
                    <tr>
                      <td colSpan={2} className="px-3 py-3 text-xs safe-text-secondary text-center">
                        {t("loadingErrors")}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
