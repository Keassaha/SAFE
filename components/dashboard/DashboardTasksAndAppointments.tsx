"use client";

import { useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import {
  CheckSquare,
  Calendar,
  Clock,
  MapPin,
  ChevronRight,
  ListTodo,
  CalendarClock,
} from "lucide-react";
import { routes } from "@/lib/routes";
import type { DashboardTaskItem, DashboardEventItem } from "@/lib/dashboard/types";
import { toIntlLocale } from "@/lib/i18n/locale";

/**
 * Éditorial Chaleureux priority pills.
 * urgent/high  → danger  (pillBg + pillText)
 * medium       → warning (gold warm)
 * low          → sand neutral
 */
const PRIORITE_STYLES: Record<string, { bg: string; text: string }> = {
  urgent: { bg: "var(--safe-status-error-bg)", text: "var(--safe-status-error)" },
  high: { bg: "var(--safe-status-error-bg)", text: "var(--safe-status-error)" },
  medium: { bg: "var(--safe-status-warning-bg)", text: "var(--safe-status-warning)" },
  low: { bg: "var(--sand-100)", text: "var(--sand-700)" },
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
  const timeStr = date.toLocaleTimeString(toIntlLocale(locale), {
    hour: "2-digit",
    minute: "2-digit",
  });
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
    <div
      className="overflow-hidden"
      style={{
        background: "var(--sand-50)",
        border: "1px solid var(--sand-300)",
        borderRadius: 12,
        boxShadow: "0 1px 2px rgba(11,11,12,0.04)",
      }}
    >
      <div
        className="flex items-center"
        style={{ borderBottom: "1px solid var(--sand-300)" }}
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm transition-colors"
              style={{
                color: isActive ? "var(--zinc-950)" : "var(--sand-600)",
                fontWeight: isActive ? 600 : 500,
                background: isActive ? "var(--sand-100)" : "transparent",
                borderBottom: isActive
                  ? "2px solid var(--brand-800)"
                  : "2px solid transparent",
                marginBottom: -1,
              }}
            >
              <Icon className="w-4 h-4" strokeWidth={1.5} />
              {tab.label}
              {tab.count > 0 && (
                <span
                  className="text-xs font-semibold px-1.5 py-0.5 rounded-md"
                  style={{
                    background: isActive ? "var(--brand-800)" : "var(--sand-200)",
                    color: isActive ? "var(--sand-50)" : "var(--sand-700)",
                  }}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="p-4 max-h-[380px] overflow-y-auto">
        {activeTab === "tasks" && (
          <div className="space-y-2">
            {tasks.length === 0 ? (
              <div className="text-center py-8">
                <CheckSquare
                  className="w-8 h-8 mx-auto mb-2"
                  strokeWidth={1.5}
                  style={{ color: "var(--sand-400)" }}
                />
                <p className="text-sm" style={{ color: "var(--sand-600)" }}>
                  {t("noTasks")}
                </p>
              </div>
            ) : (
              tasks.map((task) => {
                const prio = PRIORITE_STYLES[task.priorite] ?? PRIORITE_STYLES.medium;
                const overdue = isOverdue(task.dateEcheance);
                return (
                  <Link
                    key={task.id}
                    href={`${routes.dossiers}/${task.dossierId}`}
                    className="block rounded-md p-3 transition-all hover:shadow-sm group"
                    style={{
                      background: overdue ? "var(--safe-status-error-bg)" : "var(--sand-100)",
                      border: `1px solid ${overdue ? "var(--safe-status-error)" : "var(--sand-300)"}`,
                      textDecoration: "none",
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className="w-2 h-2 rounded-full mt-2 shrink-0"
                        style={{
                          background:
                            task.statut === "en_cours"
                              ? "var(--safe-status-warning)"
                              : "var(--sand-400)",
                        }}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p
                            className="text-sm truncate transition-colors"
                            style={{
                              fontWeight: 600,
                              color: "var(--zinc-950)",
                            }}
                          >
                            {task.titre}
                          </p>
                          <span
                            className="text-xs font-semibold px-2 py-0.5 rounded-md shrink-0"
                            style={{ background: prio.bg, color: prio.text }}
                          >
                            {priorityLabels[
                              (task.priorite as keyof typeof priorityLabels) ?? "medium"
                            ] ?? priorityLabels.medium}
                          </span>
                        </div>
                        <p
                          className="text-xs truncate"
                          style={{ color: "var(--sand-600)" }}
                        >
                          {task.dossierIntitule}
                        </p>
                        <div
                          className="flex items-center gap-3 mt-1.5 text-xs"
                          style={{ color: "var(--sand-600)" }}
                        >
                          {task.dateEcheance && (
                            <span
                              className="flex items-center gap-1"
                              style={{
                                color: overdue
                                  ? "var(--safe-status-error)"
                                  : "var(--sand-600)",
                                fontWeight: overdue ? 600 : 400,
                              }}
                            >
                              <Clock className="w-3 h-3" strokeWidth={1.5} />
                              {formatRelativeDate(task.dateEcheance, locale, t)}
                            </span>
                          )}
                          {task.assigneeName && (
                            <span className="truncate">{task.assigneeName}</span>
                          )}
                        </div>
                      </div>
                      <ChevronRight
                        className="w-4 h-4 shrink-0 mt-1 transition-colors group-hover:translate-x-0.5"
                        strokeWidth={1.5}
                        style={{ color: "var(--sand-600)" }}
                      />
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
                <Calendar
                  className="w-8 h-8 mx-auto mb-2"
                  strokeWidth={1.5}
                  style={{ color: "var(--sand-400)" }}
                />
                <p className="text-sm" style={{ color: "var(--sand-600)" }}>
                  {t("noAppointments")}
                </p>
              </div>
            ) : (
              events.map((event) => {
                const eventType =
                  (event.type as keyof typeof eventTypeLabels) in eventTypeLabels
                    ? (event.type as keyof typeof eventTypeLabels)
                    : "echeance";
                return (
                  <Link
                    key={event.id}
                    href={`${routes.dossiers}/${event.dossierId}`}
                    className="block rounded-md p-3 transition-all hover:shadow-sm group"
                    style={{
                      background: "var(--sand-100)",
                      border: "1px solid var(--sand-300)",
                      textDecoration: "none",
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className="w-9 h-9 rounded-md flex items-center justify-center shrink-0"
                        style={{
                          background: "var(--sand-50)",
                          border: "1px solid var(--sand-300)",
                        }}
                      >
                        <Calendar
                          className="w-4 h-4"
                          strokeWidth={1.5}
                          style={{ color: "var(--brand-800)" }}
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p
                            className="text-sm truncate"
                            style={{ fontWeight: 600, color: "var(--zinc-950)" }}
                          >
                            {event.titre}
                          </p>
                          <span
                            className="text-xs font-semibold px-2 py-0.5 rounded-md shrink-0"
                            style={{
                              background: "var(--safe-status-success-bg)",
                              color: "var(--safe-status-success)",
                            }}
                          >
                            {eventTypeLabels[eventType]}
                          </span>
                        </div>
                        <p
                          className="text-xs truncate"
                          style={{ color: "var(--sand-600)" }}
                        >
                          {event.dossierIntitule}
                        </p>
                        <div
                          className="flex items-center gap-3 mt-1.5 text-xs"
                          style={{ color: "var(--sand-600)" }}
                        >
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" strokeWidth={1.5} />
                            {formatEventDateTime(event.date, locale, t)}
                          </span>
                          {event.lieu && (
                            <span className="flex items-center gap-1 truncate">
                              <MapPin className="w-3 h-3" strokeWidth={1.5} />
                              {event.lieu}
                            </span>
                          )}
                        </div>
                      </div>
                      <ChevronRight
                        className="w-4 h-4 shrink-0 mt-1 transition-colors group-hover:translate-x-0.5"
                        strokeWidth={1.5}
                        style={{ color: "var(--sand-600)" }}
                      />
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
