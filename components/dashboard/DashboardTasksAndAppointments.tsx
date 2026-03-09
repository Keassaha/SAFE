"use client";

import { useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import {
  CheckSquare,
  Calendar,
  Clock,
  MapPin,
  AlertTriangle,
  ChevronRight,
  ListTodo,
  CalendarClock,
} from "lucide-react";
import { routes } from "@/lib/routes";
import type { DashboardTaskItem, DashboardEventItem } from "@/lib/dashboard/types";
import { toIntlLocale } from "@/lib/i18n/locale";

const PRIORITE_STYLES: Record<string, { bg: string; text: string }> = {
  urgent: { bg: "bg-red-100", text: "text-red-700" },
  high: { bg: "bg-orange-100", text: "text-orange-700" },
  medium: { bg: "bg-amber-100", text: "text-amber-700" },
  low: { bg: "bg-gray-100", text: "text-gray-600" },
};

const EVENT_TYPE_ICONS: Record<string, typeof Calendar> = {
  audience: Calendar,
  reunion_client: CalendarClock,
  echeance: Clock,
  depot: CheckSquare,
  relance_facture: AlertTriangle,
};

interface Props {
  tasks: DashboardTaskItem[];
  events: DashboardEventItem[];
}

type TabType = "tasks" | "events";

function formatRelativeDate(
  isoString: string,
  locale: string,
  t: (key: string, values?: Record<string, string | number | Date>) => string,
): string {
  const date = new Date(isoString);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return t("today");
  if (diffDays === 1) return t("tomorrow");
  if (diffDays < 0) return t("daysAgo", { count: Math.abs(diffDays) });
  if (diffDays <= 7) return t("inDays", { count: diffDays });
  return date.toLocaleDateString(toIntlLocale(locale), { day: "numeric", month: "short" });
}

function formatEventDateTime(
  isoString: string,
  locale: string,
  t: (key: string, values?: Record<string, string | number | Date>) => string,
): string {
  const date = new Date(isoString);
  const dateStr = formatRelativeDate(isoString, locale, t);
  const timeStr = date.toLocaleTimeString(toIntlLocale(locale), { hour: "2-digit", minute: "2-digit" });
  return t("atTime", { date: dateStr, time: timeStr });
}

function isOverdue(isoString: string | null): boolean {
  if (!isoString) return false;
  return new Date(isoString) < new Date();
}

export function DashboardTasksAndAppointments({ tasks, events }: Props) {
  const locale = useLocale();
  const t = useTranslations("dashboard");
  const [activeTab, setActiveTab] = useState<TabType>("tasks");
  const priorityLabels = {
    urgent: t("priorityUrgent"),
    high: t("priorityHigh"),
    medium: t("priorityMedium"),
    low: t("priorityLow"),
  } as const;
  const eventTypeLabels = {
    audience: t("eventHearing"),
    reunion_client: t("clientMeeting"),
    echeance: t("eventDeadline"),
    depot: t("eventFiling"),
    relance_facture: t("eventInvoiceFollowUp"),
  } as const;

  const tabs: { id: TabType; label: string; icon: typeof ListTodo; count: number }[] = [
    { id: "tasks", label: t("tasks"), icon: ListTodo, count: tasks.length },
    { id: "events", label: t("appointments"), icon: CalendarClock, count: events.length },
  ];

  return (
    <div className="card-glass overflow-hidden">
      <div className="flex items-center border-b border-gray-200/60">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3.5 text-sm font-medium transition-all ${
                isActive
                  ? "text-emerald-800 border-b-2 border-emerald-600 bg-emerald-50/50"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-50/50"
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
              {tab.count > 0 && (
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                    isActive ? "bg-emerald-100 text-emerald-700" : "bg-gray-200 text-gray-600"
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="p-4 max-h-[400px] overflow-y-auto">
        {activeTab === "tasks" && (
          <div className="space-y-2">
            {tasks.length === 0 ? (
              <div className="text-center py-8">
                <CheckSquare className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">{t("noTasks")}</p>
              </div>
            ) : (
              tasks.map((task) => {
                const prio = PRIORITE_STYLES[task.priorite] ?? PRIORITE_STYLES.medium;
                const overdue = isOverdue(task.dateEcheance);
                return (
                  <Link
                    key={task.id}
                    href={`${routes.dossiers}/${task.dossierId}`}
                    className={`block rounded-xl border p-3 transition-all hover:shadow-md group ${
                      overdue
                        ? "border-red-200 bg-red-50/50"
                        : "border-gray-200/80 bg-white/60 hover:bg-white/90"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-2 h-2 rounded-full mt-2 shrink-0 ${
                          task.statut === "en_cours" ? "bg-amber-500" : "bg-gray-400"
                        }`}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-semibold text-[var(--safe-text-title)] truncate group-hover:text-emerald-800 transition-colors">
                            {task.titre}
                          </p>
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${prio.bg} ${prio.text}`}>
                            {priorityLabels[(task.priorite as keyof typeof priorityLabels) ?? "medium"] ?? priorityLabels.medium}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 truncate">{task.dossierIntitule}</p>
                        <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-400">
                          {task.dateEcheance && (
                            <span className={`flex items-center gap-1 ${overdue ? "text-red-500 font-medium" : ""}`}>
                              <Clock className="w-3 h-3" />
                              {formatRelativeDate(task.dateEcheance, locale, t)}
                            </span>
                          )}
                          {task.assigneeName && (
                            <span className="truncate">{task.assigneeName}</span>
                          )}
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-emerald-600 transition-colors shrink-0 mt-1" />
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        )}

        {activeTab === "events" && (
          <div className="space-y-2">
            {events.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">{t("noAppointments")}</p>
              </div>
            ) : (
              events.map((event) => {
                const eventType = (event.type as keyof typeof eventTypeLabels) in eventTypeLabels
                  ? (event.type as keyof typeof eventTypeLabels)
                  : "echeance";
                const EvIcon = EVENT_TYPE_ICONS[eventType];
                return (
                  <Link
                    key={event.id}
                    href={`${routes.dossiers}/${event.dossierId}`}
                    className="block rounded-xl border border-gray-200/80 bg-white/60 p-3 transition-all hover:shadow-md hover:bg-white/90 group"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
                        <EvIcon className="w-4 h-4 text-emerald-700" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-semibold text-[var(--safe-text-title)] truncate group-hover:text-emerald-800 transition-colors">
                            {event.titre}
                          </p>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 shrink-0">
                            {eventTypeLabels[eventType]}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 truncate">{event.dossierIntitule}</p>
                        <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-400">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatEventDateTime(event.date, locale, t)}
                          </span>
                          {event.lieu && (
                            <span className="flex items-center gap-1 truncate">
                              <MapPin className="w-3 h-3" />
                              {event.lieu}
                            </span>
                          )}
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-emerald-600 transition-colors shrink-0 mt-1" />
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}
