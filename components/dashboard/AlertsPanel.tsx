"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { Bell, CheckCircle, AlertTriangle } from "lucide-react";
import type { DashboardAlert } from "@/lib/dashboard/types";

export interface AlertsPanelProps {
  alerts: DashboardAlert[];
}

export function AlertsPanel({ alerts }: AlertsPanelProps) {
  const t = useTranslations("dashboard");

  if (alerts.length === 0) {
    return (
      <div className="card-glass overflow-hidden p-5 md:p-6 border-l-4 border-l-emerald-500">
        <h3 className="text-sm font-semibold safe-text-title mb-2 flex items-center gap-1.5">
          <Bell className="w-4 h-4 text-[var(--safe-icon-default)]" aria-hidden />
          {t("alerts")}
        </h3>
        <p className="text-sm safe-text-secondary py-4 text-center flex flex-col items-center gap-1">
          <CheckCircle className="w-8 h-8 text-emerald-500" aria-hidden />
          {t("noAlerts")}
        </p>
      </div>
    );
  }

  return (
    <div className="card-glass overflow-hidden p-5 md:p-6 border-l-4 border-l-amber-500">
      <h3 className="text-sm font-semibold safe-text-title mb-4 flex items-center gap-1.5">
        <Bell className="w-4 h-4 text-amber-600" aria-hidden />
        {t("alerts")}
      </h3>
      <ul className="space-y-2" role="list">
        {alerts.map((alert, index) => (
          <li key={`${alert.type}-${index}`}>
            <Link
              href={alert.href}
              className="flex items-start gap-3 p-3 rounded-xl border-2 border-amber-200 bg-amber-50/90 hover:bg-amber-100/90 hover:border-amber-300 transition-colors"
            >
              <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-amber-600" aria-hidden />
              <div className="min-w-0">
                <p className="text-sm font-medium text-amber-900">{alert.type}</p>
                <p className="text-xs text-amber-800 mt-0.5">{alert.message}</p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
