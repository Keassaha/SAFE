"use client";

import { useMemo } from "react";
import { Search, Calendar } from "lucide-react";
import type { TimeEntryFilters } from "@/types/temps";
import { useTranslations } from "next-intl";

function toISODate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

interface TimeFiltersBarProps {
  filters: TimeEntryFilters;
  onFiltersChange: (f: TimeEntryFilters) => void;
  viewMode: "list" | "week";
  onViewModeChange: (m: "list" | "week") => void;
  showAllEntries: boolean;
  onShowAllEntriesChange: (v: boolean) => void;
  canViewAll: boolean;
  dossiers: Array<{ id: string; intitule: string; numeroDossier: string | null }>;
  users: Array<{ id: string; nom: string }>;
}

export function TimeFiltersBar({
  filters,
  onFiltersChange,
  viewMode,
  onViewModeChange,
  showAllEntries,
  onShowAllEntriesChange,
  canViewAll,
  dossiers,
  users,
}: TimeFiltersBarProps) {
  const t = useTranslations("temps");
  const tc = useTranslations("common");
  const now = useMemo(() => new Date(), []);
  const presets = useMemo(() => {
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay() + 1);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, 1);
    return [
      { label: t("thisWeek"), from: toISODate(startOfWeek), to: toISODate(endOfWeek) },
      { label: t("thisMonth"), from: toISODate(startOfMonth), to: toISODate(endOfMonth) },
      { label: t("lastThreeMonths"), from: toISODate(threeMonthsAgo), to: toISODate(now) },
      { label: t("allTime"), from: undefined, to: undefined },
    ];
  }, [now, t]);

  const setDateRange = (from: string | undefined, to: string | undefined) => {
    onFiltersChange({ ...filters, dateFrom: from, dateTo: to });
  };

  return (
    <div className="flex flex-col gap-3 py-3 px-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1.5" role="group" aria-label={t("period")}>
          <Calendar className="w-4 h-4 text-neutral-500 shrink-0" aria-hidden />
          {presets.map((p) => (
            <button
              key={p.label}
              type="button"
              onClick={() => setDateRange(p.from, p.to)}
              className={`px-3 py-1.5 rounded-safe-sm text-sm font-medium ${
                filters.dateFrom === p.from && filters.dateTo === p.to
                  ? "bg-green-800 text-white"
                  : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <label className="sr-only" htmlFor="temps-date-from">{t("from")}</label>
          <input
            id="temps-date-from"
            type="date"
            value={filters.dateFrom ?? ""}
            onChange={(e) => onFiltersChange({ ...filters, dateFrom: e.target.value || undefined })}
            className="h-10 px-3 rounded-safe-sm border border-[var(--safe-neutral-border)] text-sm"
          />
          <span className="text-sm safe-text-secondary">{t("to")}</span>
          <label className="sr-only" htmlFor="temps-date-to">{t("to")}</label>
          <input
            id="temps-date-to"
            type="date"
            value={filters.dateTo ?? ""}
            onChange={(e) => onFiltersChange({ ...filters, dateTo: e.target.value || undefined })}
            className="h-10 px-3 rounded-safe-sm border border-[var(--safe-neutral-border)] text-sm"
          />
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onShowAllEntriesChange(true)}
            className={`px-3 py-1.5 rounded-safe-sm text-sm font-medium ${
              showAllEntries ? "bg-green-800 text-white" : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
            }`}
          >
            {t("allEntries")}
          </button>
          {canViewAll && (
            <button
              type="button"
              onClick={() => onShowAllEntriesChange(false)}
              className={`px-3 py-1.5 rounded-safe-sm text-sm font-medium ${
                !showAllEntries ? "bg-green-800 text-white" : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
              }`}
            >
              {t("myEntries")}
            </button>
          )}
          <button
            type="button"
            onClick={() => onViewModeChange(viewMode === "list" ? "week" : "list")}
            className="px-3 py-1.5 rounded-safe-sm text-sm font-medium bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
          >
            {viewMode === "list" ? t("weekView") : t("listView")}
          </button>
        </div>
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" aria-hidden />
          <input
            type="search"
            placeholder={tc("searchPlaceholder")}
            value={filters.q ?? ""}
            onChange={(e) => onFiltersChange({ ...filters, q: e.target.value || undefined })}
            className="w-full h-10 pl-9 pr-4 rounded-safe-sm border border-[var(--safe-neutral-border)] text-sm"
          />
        </div>
        <div className="flex items-center gap-2">
          <select
            value={filters.dossierId ?? ""}
            onChange={(e) => onFiltersChange({ ...filters, dossierId: e.target.value || undefined })}
            className="h-10 px-3 rounded-safe-sm border border-[var(--safe-neutral-border)] text-sm"
            aria-label={t("filterByMatter")}
          >
            <option value="">{t("allMatters")}</option>
            {dossiers.map((d) => (
              <option key={d.id} value={d.id}>
                {d.numeroDossier ?? "—"} {d.intitule}
              </option>
            ))}
          </select>
          {canViewAll && (
            <select
              value={filters.userId ?? ""}
              onChange={(e) => onFiltersChange({ ...filters, userId: e.target.value || undefined })}
              className="h-10 px-3 rounded-safe-sm border border-[var(--safe-neutral-border)] text-sm"
              aria-label={t("filterByUser")}
            >
              <option value="">{t("allUsers")}</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>{u.nom}</option>
              ))}
            </select>
          )}
          <select
            value={filters.facture === undefined ? "" : filters.facture ? "facture" : "non"}
            onChange={(e) => {
              const v = e.target.value;
              onFiltersChange({
                ...filters,
                facture: v === "" ? undefined : v === "facture",
              });
            }}
            className="h-10 px-3 rounded-safe-sm border border-[var(--safe-neutral-border)] text-sm"
            aria-label={t("billingStatus")}
          >
            <option value="">{t("allStatuses")}</option>
            <option value="non">{t("notBilledFilter")}</option>
            <option value="facture">{t("billedFilter")}</option>
          </select>
        </div>
      </div>
    </div>
  );
}
