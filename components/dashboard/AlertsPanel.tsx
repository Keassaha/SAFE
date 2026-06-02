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
  const tUi = useTranslations("dashboardUi");

  if (alerts.length === 0) {
    return (
      <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-white/60 shadow-[0_2px_16px_rgba(0,0,0,0.04)] p-6 md:p-7">
        <h3 className="text-base font-bold text-neutral-800 mb-4 flex items-center gap-2.5 tracking-tight">
          <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center">
            <Bell className="w-4 h-4 text-emerald-600" aria-hidden />
          </div>
          {t("alerts")}
        </h3>
        <div className="flex flex-col items-center py-8 text-center">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center mb-3">
            <CheckCircle className="w-7 h-7 text-emerald-500" aria-hidden />
          </div>
          <p className="text-sm font-semibold text-neutral-700">{t("noAlerts")}</p>
          <p className="text-[12px] text-neutral-400 mt-0.5">{tUi("allInOrder")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-amber-200/50 shadow-[0_2px_16px_rgba(0,0,0,0.04)] p-6 md:p-7">
      <h3 className="text-base font-bold text-neutral-800 mb-5 flex items-center gap-2.5 tracking-tight">
        <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center">
          <Bell className="w-4 h-4 text-amber-600" aria-hidden />
        </div>
        {t("alerts")}
        <span className="ml-auto text-[11px] font-bold bg-amber-100 text-amber-700 px-2.5 py-1 rounded-full">
          {alerts.length}
        </span>
      </h3>
      <ul className="space-y-2.5" role="list">
        {alerts.map((alert, index) => (
          <li key={`${alert.type}-${index}`}>
            <Link
              href={alert.href}
              className="flex items-center gap-3 p-3.5 rounded-xl bg-gradient-to-r from-amber-50/80 to-white border border-amber-100/60 hover:border-amber-200 hover:shadow-md transition-all duration-200 group"
            >
              <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-4 h-4 text-amber-600" aria-hidden />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-neutral-700">{alert.type}</p>
                <p className="text-[12px] text-amber-600 mt-0.5">{alert.message}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-amber-300 group-hover:text-amber-500 group-hover:translate-x-0.5 transition-all duration-200 shrink-0" />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
