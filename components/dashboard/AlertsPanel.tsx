"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { Bell, CheckCircle, AlertTriangle, ChevronRight } from "lucide-react";
import type { DashboardAlert } from "@/lib/dashboard/types";

export interface AlertsPanelProps {
  alerts: DashboardAlert[];
}

export function AlertsPanel({ alerts }: AlertsPanelProps) {
  const t = useTranslations("dashboard");

  if (alerts.length === 0) {
    return (
      <div className="bg-white rounded-safe-md border border-[var(--safe-neutral-border)] shadow-sm p-5 md:p-6">
        <h3 className="text-base font-semibold text-[var(--safe-text-title)] mb-3 flex items-center gap-2 tracking-tight">
          <Bell className="w-4 h-4 text-emerald-600" aria-hidden />
          {t("alerts")}
        </h3>
        <div className="flex flex-col items-center py-6 text-center">
          <CheckCircle className="w-10 h-10 text-emerald-500 mb-2" aria-hidden />
          <p className="text-sm font-medium text-[var(--safe-text-title)]">{t("noAlerts")}</p>
          <p className="text-xs text-[var(--safe-text-muted)] mt-0.5">Tout est en ordre</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-safe-md border border-amber-200 shadow-sm p-5 md:p-6">
      <h3 className="text-base font-semibold text-[var(--safe-text-title)] mb-4 flex items-center gap-2 tracking-tight">
        <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center">
          <Bell className="w-3.5 h-3.5 text-amber-600" aria-hidden />
        </div>
        {t("alerts")}
        <span className="ml-auto text-xs font-semibold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
          {alerts.length}
        </span>
      </h3>
      <ul className="space-y-2" role="list">
        {alerts.map((alert, index) => (
          <li key={`${alert.type}-${index}`}>
            <Link
              href={alert.href}
              className="flex items-center gap-3 p-3 rounded-safe bg-amber-50 border border-amber-100 hover:bg-amber-100 hover:border-amber-200 transition-all group"
            >
              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" aria-hidden />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-[var(--safe-text-title)]">{alert.type}</p>
                <p className="text-xs text-amber-700 mt-0.5">{alert.message}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-amber-400 group-hover:text-amber-600 transition-colors shrink-0" />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
