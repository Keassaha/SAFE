"use client";

import Link from "next/link";
import { Activity, Pin, Inbox } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { toIntlLocale } from "@/lib/i18n/locale";
import type { ActivityFeedItem } from "@/lib/dashboard/types";
import { routes } from "@/lib/routes";

export interface DashboardActivityFeedProps {
  items: ActivityFeedItem[];
  viewAllHref?: string;
}

function formatRelativeTime(
  d: Date | string,
  locale: string,
  t: (key: string, values?: Record<string, string | number | Date>) => string,
): string {
  const date = typeof d === "string" ? new Date(d) : d;
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return t("justNow");
  if (diffMins < 60) return t("minutesAgo", { count: diffMins });
  if (diffHours < 24) return t("hoursAgo", { count: diffHours });
  if (diffDays < 7) return t("daysAgo", { count: diffDays });
  return new Intl.DateTimeFormat(toIntlLocale(locale), {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function DashboardActivityFeed({
  items,
  viewAllHref = routes.parametresAudit,
}: DashboardActivityFeedProps) {
  const locale = useLocale();
  const t = useTranslations("dashboard");
  const tc = useTranslations("common");
  return (
    <div className="card-glass overflow-hidden p-5 md:p-6 border-l-4 border-l-teal-500">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold safe-text-title flex items-center gap-1.5">
          <Pin className="w-4 h-4 text-teal-600" aria-hidden />
          {t("recentActivity")}
        </h3>
        {items.length > 0 && viewAllHref && (
          <Link
            href={viewAllHref}
            className="text-xs font-medium text-teal-700 hover:text-teal-800"
          >
            {tc("viewAll")}
          </Link>
        )}
      </div>
      {items.length === 0 ? (
        <p className="text-sm safe-text-secondary py-6 text-center flex flex-col items-center gap-1">
          <Inbox className="w-8 h-8 text-teal-400" aria-hidden />
          {t("noRecentActivity")}
        </p>
      ) : (
        <ul className="space-y-3" role="list">
          {items.slice(0, 10).map((item) => (
            <li
              key={item.id}
              className="flex items-start gap-3 py-2 border-b border-[var(--safe-neutral-border)] last:border-0 last:pb-0"
            >
              <div className="w-9 h-9 rounded-xl bg-teal-100 flex items-center justify-center shrink-0 text-teal-700">
                <Activity className="w-4 h-4" aria-hidden />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm safe-text-title">
                  <span className="font-medium">{item.action}</span>
                  {" — "}
                  <span className="safe-text-secondary">{item.entityType}</span>
                </p>
                <p className="text-xs safe-text-secondary mt-0.5">
                  {formatRelativeTime(item.timestamp, locale, t)}
                  {item.userDisplayName && ` · ${item.userDisplayName}`}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
