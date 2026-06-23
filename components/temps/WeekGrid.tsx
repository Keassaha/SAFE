"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { formatDate } from "@/lib/utils/format";

interface TimeEntryRow {
  id: string;
  date: string;
  dureeMinutes: number;
  description: string | null;
  dossier: { intitule: string; numeroDossier: string | null } | null;
}

function formatDuree(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h${m}` : `${h}h`;
}

function formatPeriodLabel(start: Date, end: Date): string {
  const opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "long", year: "numeric" };
  return `${start.getDate()} – ${end.getDate()} ${start.toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}`;
}

export function WeekGrid({
  entries,
  weekStart,
  onPrevWeek,
  onNextWeek,
}: {
  entries: TimeEntryRow[];
  weekStart: Date;
  onPrevWeek: () => void;
  onNextWeek: () => void;
}) {
  const t = useTranslations("gestionCompUi");
  const startOfWeek = new Date(weekStart);
  startOfWeek.setHours(0, 0, 0, 0);
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    return d;
  });
  const endOfWeek = days[6];

  const byDay = days.map((day) => {
    const dayStr = day.toISOString().slice(0, 10);
    const dayEntries = entries.filter((e) => e.date.slice(0, 10) === dayStr);
    const total = dayEntries.reduce((s, e) => s + e.dureeMinutes, 0);
    return { date: day, dayStr, entries: dayEntries, total };
  });

  const weekTotalMinutes = byDay.reduce((s, d) => s + d.total, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onPrevWeek}
            className="p-2 rounded-lg border border-si-line hover:bg-si-canvas text-si-muted hover:text-si-ink"
            aria-label={t("previousWeek")}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-sm font-medium text-si-ink min-w-[220px] text-center">
            {formatPeriodLabel(startOfWeek, endOfWeek)}
          </span>
          <button
            type="button"
            onClick={onNextWeek}
            className="p-2 rounded-lg border border-si-line hover:bg-si-canvas text-si-muted hover:text-si-ink"
            aria-label={t("nextWeek")}
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
        <p className="text-sm text-si-muted">
          {t("weekTotalLabel")} <span className="font-semibold text-si-ink tabular-nums">{formatDuree(weekTotalMinutes)}</span>
        </p>
      </div>
      <div className="grid grid-cols-7 gap-2">
        {byDay.map(({ date, dayStr, entries: dayEntries, total }, index) => (
          <div
            key={`${dayStr}-${index}`}
            className="rounded-lg border border-si-line p-3 min-h-[120px]"
          >
            <p className="text-xs font-medium text-si-muted mb-2">
              {formatDate(date)}
            </p>
            <p className="text-lg font-bold text-si-ink mb-2">
              {formatDuree(total)}
            </p>
            <ul className="space-y-1 text-sm">
              {dayEntries.slice(0, 3).map((e) => (
                <li key={e.id} className="truncate" title={e.description ?? e.dossier?.intitule ?? undefined}>
                  {e.dossier?.numeroDossier ?? "—"} {formatDuree(e.dureeMinutes)}
                </li>
              ))}
              {dayEntries.length > 3 && (
                <li className="text-si-muted">{t("moreEntries", { count: dayEntries.length - 3 })}</li>
              )}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
