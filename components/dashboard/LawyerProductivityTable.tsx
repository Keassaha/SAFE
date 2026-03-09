"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { Maximize2, Users, Clock } from "lucide-react";
import { routes } from "@/lib/routes";
import type { LawyerProductivityRow } from "@/lib/dashboard/types";
import { formatCurrency } from "@/lib/utils/format";

export interface LawyerProductivityTableProps {
  rows: LawyerProductivityRow[];
  viewAllHref?: string;
}

export function LawyerProductivityTable({
  rows,
  viewAllHref = routes.temps,
}: LawyerProductivityTableProps) {
  const t = useTranslations("dashboard");
  const tc = useTranslations("common");
  return (
    <div className="card-glass overflow-hidden p-5 md:p-6 border-l-4 border-l-blue-500">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold safe-text-title flex items-center gap-1.5">
            <Users className="w-4 h-4 text-blue-600" aria-hidden />
            {t("productivityTitle")}
          </h3>
          <p className="text-xs safe-text-secondary mt-0.5">
            {t("perLawyer")}
          </p>
        </div>
        <Link
          href={viewAllHref}
          className="w-9 h-9 rounded-xl bg-blue-100 hover:bg-blue-200 flex items-center justify-center text-blue-700 transition-colors"
          aria-label={t("viewTimesheets")}
        >
          <Maximize2 className="w-4 h-4" />
        </Link>
      </div>
      {rows.length === 0 ? (
        <p className="text-sm safe-text-secondary py-6 text-center flex flex-col items-center gap-1">
          <Clock className="w-8 h-8 text-blue-400" aria-hidden />
          {t("noProductivityData")}
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm" role="table">
            <thead>
              <tr className="border-b border-[var(--safe-neutral-border)]">
                <th className="text-left py-2.5 font-medium safe-text-title">{t("lawyer")}</th>
                <th className="text-right py-2.5 font-medium safe-text-title">{t("hours")}</th>
                <th className="text-right py-2.5 font-medium safe-text-title">{t("billableHours")}</th>
                <th className="text-right py-2.5 font-medium safe-text-title">{t("valueLabel")}</th>
                <th className="text-right py-2.5 font-medium safe-text-title">{t("unbilledLabel")}</th>
              </tr>
            </thead>
            <tbody>
              {rows.slice(0, 8).map((row) => (
                <tr
                  key={row.userId}
                  className="border-b border-[var(--safe-neutral-border)] last:border-0"
                >
                  <td className="py-2.5 font-medium safe-text-title">{row.lawyerName}</td>
                  <td className="py-2.5 text-right safe-text-secondary">{row.hoursWorked.toFixed(2)} h</td>
                  <td className="py-2.5 text-right safe-text-secondary">{row.billableHours.toFixed(2)} h</td>
                  <td className="py-2.5 text-right safe-text-metric">{formatCurrency(row.valueBillable)}</td>
                  <td className="py-2.5 text-right safe-text-secondary">{formatCurrency(row.unbilledHours)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {rows.length > 0 && (
        <Link
          href={viewAllHref}
          className="block text-center text-sm font-medium text-blue-600 hover:text-blue-700 mt-3 pt-3 border-t border-[var(--safe-neutral-border)]"
        >
          {tc("viewAll")}
        </Link>
      )}
    </div>
  );
}
