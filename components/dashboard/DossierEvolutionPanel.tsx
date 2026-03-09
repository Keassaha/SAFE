"use client";

import { useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import {
  Layers,
  List,
  BarChart3,
  Clock,
  User,
  CheckCircle2,
  ChevronRight,
  FolderOpen,
  CalendarClock,
  Kanban,
} from "lucide-react";
import { routes } from "@/lib/routes";
import type { DossierEvolutionItem } from "@/lib/dashboard/types";
import { toIntlLocale } from "@/lib/i18n/locale";

type ViewMode = "list" | "board" | "timeline";

interface Props {
  dossiers: DossierEvolutionItem[];
}

function formatDate(iso: string, locale: string): string {
  return new Date(iso).toLocaleDateString(toIntlLocale(locale), {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatRelative(
  iso: string,
  locale: string,
  t: (key: string, values?: Record<string, string | number | Date>) => string,
): string {
  const date = new Date(iso);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return t("today");
  if (diffDays === 1) return t("tomorrow");
  if (diffDays < 0) return t("daysAgo", { count: Math.abs(diffDays) });
  if (diffDays <= 7) return t("inDays", { count: diffDays });
  return formatDate(iso, locale);
}

function progressPercent(taskCount: number, tasksDone: number): number {
  if (taskCount === 0) return 0;
  return Math.round((tasksDone / taskCount) * 100);
}

function DossierCard({ dossier, locale }: { dossier: DossierEvolutionItem; locale: string }) {
  const t = useTranslations("dashboard");
  const progress = progressPercent(dossier.taskCount, dossier.tasksDone);

  return (
    <Link
      href={`${routes.dossiers}/${dossier.id}`}
      className="block rounded-xl border border-gray-200/80 bg-white/60 p-4 transition-all hover:shadow-md hover:bg-white/90 group"
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="min-w-0 flex-1">
          <h4 className="text-sm font-semibold text-[var(--safe-text-title)] truncate group-hover:text-emerald-800 transition-colors">
            {dossier.intitule}
          </h4>
          <p className="text-xs text-gray-500 truncate mt-0.5">{dossier.clientName}</p>
        </div>
        <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-emerald-600 transition-colors shrink-0" />
      </div>

      {dossier.taskCount > 0 && (
        <div className="mb-3">
          <div className="flex items-center justify-between text-[10px] text-gray-400 mb-1">
            <span>{t("progress")}</span>
            <span className="font-semibold text-[var(--safe-text-title)]">{progress}%</span>
          </div>
          <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all bg-emerald-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex items-center gap-1 mt-1 text-[10px] text-gray-400">
            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
            {dossier.tasksDone}/{dossier.taskCount} {t("taskLabel")}
          </div>
        </div>
      )}

      <div className="flex items-center gap-3 text-[10px] text-gray-400 flex-wrap">
        {dossier.avocatName && (
          <span className="flex items-center gap-1">
            <User className="w-3 h-3" />
            {dossier.avocatName}
          </span>
        )}
        {dossier.nextDeadline && (
          <span className="flex items-center gap-1">
            <CalendarClock className="w-3 h-3" />
            {formatRelative(dossier.nextDeadline, locale, t)}
          </span>
        )}
        {dossier.eventCount > 0 && (
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {dossier.eventCount} {t("appointmentsLabel")}
          </span>
        )}
      </div>
    </Link>
  );
}

function ListView({ dossiers, locale }: { dossiers: DossierEvolutionItem[]; locale: string }) {
  return (
    <div className="space-y-2">
      {dossiers.map((d) => (
        <DossierCard key={d.id} dossier={d} locale={locale} />
      ))}
    </div>
  );
}

function BoardView({ dossiers, locale }: { dossiers: DossierEvolutionItem[]; locale: string }) {
  const t = useTranslations("dashboard");
  const columns: { key: string; label: string; filter: (d: DossierEvolutionItem) => boolean }[] = [
    {
      key: "no-tasks",
      label: t("toStart"),
      filter: (d) => d.taskCount === 0 || d.tasksDone === 0,
    },
    {
      key: "in-progress",
      label: t("inProgress"),
      filter: (d) => d.taskCount > 0 && d.tasksDone > 0 && d.tasksDone < d.taskCount,
    },
    {
      key: "done",
      label: t("nearlyDone"),
      filter: (d) => d.taskCount > 0 && d.tasksDone === d.taskCount,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {columns.map((col) => {
        const items = dossiers.filter(col.filter);
        return (
          <div key={col.key}>
            <div className="flex items-center gap-2 mb-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                {col.label}
              </h4>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-gray-200 text-gray-600">
                {items.length}
              </span>
            </div>
            <div className="space-y-2 min-h-[60px]">
              {items.length === 0 ? (
                <div className="rounded-xl border border-dashed border-gray-200 p-4 text-center">
                  <p className="text-xs text-gray-400">{t("noMatters")}</p>
                </div>
              ) : (
                items.map((d) => <DossierCard key={d.id} dossier={d} locale={locale} />)
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function TimelineView({ dossiers, locale }: { dossiers: DossierEvolutionItem[]; locale: string }) {
  const t = useTranslations("dashboard");
  const sorted = [...dossiers].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );

  return (
    <div className="relative">
      <div className="absolute left-4 top-0 bottom-0 w-px bg-emerald-200" />
      <div className="space-y-4 pl-10">
        {sorted.map((d) => {
          const progress = progressPercent(d.taskCount, d.tasksDone);
          return (
            <div key={d.id} className="relative">
              <div className="absolute -left-[26px] top-2 w-3 h-3 rounded-full border-2 border-emerald-400 bg-white" />
              <Link
                href={`${routes.dossiers}/${d.id}`}
                className="block rounded-xl border border-gray-200/80 bg-white/60 p-4 transition-all hover:shadow-md hover:bg-white/90 group"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-sm font-semibold text-[var(--safe-text-title)] truncate group-hover:text-emerald-800 transition-colors">
                        {d.intitule}
                      </h4>
                    </div>
                    <p className="text-xs text-gray-500">{d.clientName}</p>
                    <div className="flex items-center gap-4 mt-2 text-[10px] text-gray-400">
                      <span>{t("updated")} {formatRelative(d.updatedAt, locale, t)}</span>
                      {d.avocatName && (
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {d.avocatName}
                        </span>
                      )}
                      {d.taskCount > 0 && (
                        <span className="flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                          {d.tasksDone}/{d.taskCount}
                        </span>
                      )}
                    </div>
                  </div>
                  {d.taskCount > 0 && (
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="w-12 h-12 relative">
                        <svg className="w-12 h-12 transform -rotate-90" viewBox="0 0 36 36">
                          <circle
                            className="text-gray-200"
                            strokeWidth="3"
                            stroke="currentColor"
                            fill="none"
                            r="15.9155"
                            cx="18"
                            cy="18"
                          />
                          <circle
                            className="text-emerald-500"
                            strokeWidth="3"
                            stroke="currentColor"
                            fill="none"
                            r="15.9155"
                            cx="18"
                            cy="18"
                            strokeLinecap="round"
                            strokeDasharray={`${progress}, 100`}
                          />
                        </svg>
                        <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-[var(--safe-text-title)]">
                          {progress}%
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function DossierEvolutionPanel({ dossiers }: Props) {
  const locale = useLocale();
  const t = useTranslations("dashboard");
  const [viewMode, setViewMode] = useState<ViewMode>("list");

  const views: { id: ViewMode; label: string; icon: typeof List }[] = [
    { id: "list", label: t("listView"), icon: List },
    { id: "board", label: "Board", icon: Kanban },
    { id: "timeline", label: "Timeline", icon: BarChart3 },
  ];

  return (
    <div className="card-glass overflow-hidden">
      <div className="flex items-center justify-between p-4 pb-0">
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-emerald-600" />
          <h3 className="text-sm font-semibold safe-text-title">
            {t("matterProgression")}
          </h3>
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
            {dossiers.length}
          </span>
        </div>
        <div className="flex items-center gap-1 p-1 rounded-xl bg-gray-100/80">
          {views.map((v) => {
            const Icon = v.icon;
            const isActive = viewMode === v.id;
            return (
              <button
                key={v.id}
                type="button"
                onClick={() => setViewMode(v.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? "bg-white text-emerald-800 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{v.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="p-4">
        {dossiers.length === 0 ? (
          <div className="text-center py-12">
            <FolderOpen className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-500">{t("noActiveMatters")}</p>
          </div>
        ) : (
          <>
            {viewMode === "list" && <ListView dossiers={dossiers} locale={locale} />}
            {viewMode === "board" && <BoardView dossiers={dossiers} locale={locale} />}
            {viewMode === "timeline" && <TimelineView dossiers={dossiers} locale={locale} />}
          </>
        )}
      </div>

      {dossiers.length > 0 && (
        <div className="border-t border-gray-200/50 px-4 py-3">
          <Link
            href={routes.dossiers}
            className="flex items-center justify-center gap-1 text-xs font-medium text-emerald-700 hover:text-emerald-900 transition-colors"
          >
            {t("viewAllMatters")}
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}
    </div>
  );
}
