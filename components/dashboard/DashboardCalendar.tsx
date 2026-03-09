"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckSquare,
  MapPin,
} from "lucide-react";
import { routes } from "@/lib/routes";
import type { DashboardTaskItem, DashboardEventItem } from "@/lib/dashboard/types";
import { toIntlLocale } from "@/lib/i18n/locale";

interface DashboardCalendarProps {
  month: number;
  year: number;
  today?: number;
  tasks?: DashboardTaskItem[];
  events?: DashboardEventItem[];
}

interface DayItem {
  type: "task" | "event";
  id: string;
  titre: string;
  dossierId: string;
  dossierIntitule: string;
  meta?: string;
}

export function DashboardCalendar({
  month: initialMonth,
  year: initialYear,
  today,
  tasks = [],
  events = [],
}: DashboardCalendarProps) {
  const locale = useLocale();
  const intlLocale = toIntlLocale(locale);
  const td = useTranslations("dashboard");
  const now = new Date();
  const [year, setYear] = useState(initialYear);
  const [month, setMonth] = useState(initialMonth);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const weekdayLabels = useMemo(
    () =>
      Array.from({ length: 7 }, (_, index) =>
        new Intl.DateTimeFormat(intlLocale, { weekday: "short" })
          .format(new Date(2024, 0, index + 1))
          .replace(".", "")
      ),
    [intlLocale]
  );
  const monthLabel = new Intl.DateTimeFormat(intlLocale, {
    month: "long",
    year: "numeric",
  }).format(new Date(year, month, 1));

  const { weeks } = useMemo(() => {
    const first = new Date(year, month, 1);
    const last = new Date(year, month + 1, 0);
    const startOffset = (first.getDay() + 6) % 7;
    const daysInMonth = last.getDate();
    const totalCells = startOffset + daysInMonth;
    const rows = Math.ceil(totalCells / 7);
    const weeks: (number | null)[][] = [];
    let day = 1;
    for (let r = 0; r < rows; r++) {
      const week: (number | null)[] = [];
      for (let c = 0; c < 7; c++) {
        const i = r * 7 + c;
        if (i < startOffset || day > daysInMonth) {
          week.push(null);
        } else {
          week.push(day);
          day++;
        }
      }
      weeks.push(week);
    }
    return { weeks };
  }, [month, year]);

  const itemsByDay = useMemo(() => {
    const map = new Map<number, DayItem[]>();

    for (const t of tasks) {
      if (!t.dateEcheance) continue;
      const d = new Date(t.dateEcheance);
      if (d.getFullYear() === year && d.getMonth() === month) {
        const day = d.getDate();
        if (!map.has(day)) map.set(day, []);
        map.get(day)!.push({
          type: "task",
          id: t.id,
          titre: t.titre,
          dossierId: t.dossierId,
          dossierIntitule: t.dossierIntitule,
          meta: t.assigneeName ?? undefined,
        });
      }
    }

    for (const e of events) {
      const d = new Date(e.date);
      if (d.getFullYear() === year && d.getMonth() === month) {
        const day = d.getDate();
        if (!map.has(day)) map.set(day, []);
        map.get(day)!.push({
          type: "event",
          id: e.id,
          titre: e.titre,
          dossierId: e.dossierId,
          dossierIntitule: e.dossierIntitule,
          meta: e.lieu ?? d.toLocaleTimeString(intlLocale, { hour: "2-digit", minute: "2-digit" }),
        });
      }
    }

    return map;
  }, [tasks, events, year, month, intlLocale]);

  const selectedItems = selectedDay ? (itemsByDay.get(selectedDay) ?? []) : [];
  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth();

  function prevMonth() {
    if (month === 0) { setMonth(11); setYear((y) => y - 1); }
    else setMonth((m) => m - 1);
    setSelectedDay(null);
  }
  function nextMonth() {
    if (month === 11) { setMonth(0); setYear((y) => y + 1); }
    else setMonth((m) => m + 1);
    setSelectedDay(null);
  }

  return (
    <div className="card-glass overflow-hidden">
      <div className="flex items-center justify-between p-4 pb-3 border-b border-gray-200/50">
        <h3 className="text-sm font-semibold safe-text-title flex items-center gap-1.5">
          <Calendar className="w-4 h-4 text-emerald-600" aria-hidden />
          {monthLabel}
        </h3>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={prevMonth}
            className="p-1.5 rounded-lg hover:bg-gray-200/60 text-gray-500 transition-colors"
            aria-label={td("previousMonth")}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={nextMonth}
            className="p-1.5 rounded-lg hover:bg-gray-200/60 text-gray-500 transition-colors"
            aria-label={td("nextMonth")}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="p-4">
        <div className="grid grid-cols-7 gap-0.5 text-center mb-1">
          {weekdayLabels.map((label) => (
            <div
              key={label}
              className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 py-1"
            >
              {label}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {weeks.flat().map((d, idx) => {
            if (d === null) {
              return <div key={`empty-${idx}`} className="h-9" />;
            }
            const dayItems = itemsByDay.get(d) ?? [];
            const hasItems = dayItems.length > 0;
            const isToday = isCurrentMonth && today !== undefined && d === today;
            const isSelected = d === selectedDay;

            return (
              <button
                key={d}
                type="button"
                onClick={() => setSelectedDay(d === selectedDay ? null : d)}
                className={`relative h-9 flex flex-col items-center justify-center rounded-xl text-xs font-medium transition-all ${
                  isSelected
                    ? "bg-emerald-600 text-white shadow-md"
                    : isToday
                      ? "bg-emerald-100 text-emerald-800 ring-2 ring-emerald-400/50"
                      : hasItems
                        ? "bg-white/70 text-[var(--safe-text-title)] hover:bg-emerald-50"
                        : "text-gray-500 hover:bg-gray-100/50"
                }`}
              >
                {d}
                {hasItems && !isSelected && (
                  <div className="flex gap-0.5 absolute bottom-0.5">
                    {dayItems.slice(0, 3).map((item, i) => (
                      <span
                        key={i}
                        className={`w-1 h-1 rounded-full ${
                          item.type === "event" ? "bg-emerald-500" : "bg-amber-500"
                        }`}
                      />
                    ))}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-200/50">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span className="text-[10px] text-gray-400">{td("calendarTasks")}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-[10px] text-gray-400">{td("calendarEvents")}</span>
          </div>
        </div>
      </div>

      {selectedDay != null && (
        <div className="border-t border-gray-200/50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
            {isCurrentMonth && selectedDay === today
              ? td("today")
              : new Intl.DateTimeFormat(intlLocale, {
                  day: "numeric",
                  month: "long",
                }).format(new Date(year, month, selectedDay))}
          </p>
          {selectedItems.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-3">
              {td("nothingScheduled")}
            </p>
          ) : (
            <div className="space-y-1.5 max-h-40 overflow-y-auto">
              {selectedItems.map((item) => (
                <Link
                  key={item.id}
                  href={`${routes.dossiers}/${item.dossierId}`}
                  className="flex items-center gap-2 p-2 rounded-lg bg-white/60 hover:bg-white border border-gray-200/50 transition-colors group"
                >
                  {item.type === "task" ? (
                    <CheckSquare className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  ) : (
                    <Calendar className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-[var(--safe-text-title)] truncate group-hover:text-emerald-700 transition-colors">
                      {item.titre}
                    </p>
                    <p className="text-[10px] text-gray-400 truncate">
                      {item.dossierIntitule}
                      {item.meta && ` · ${item.meta}`}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
