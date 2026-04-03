"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { Maximize2, Users } from "lucide-react";
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
  const locale = useLocale();

  return (
    <div className="bg-white rounded-2xl border border-[#d0ddd6] shadow-sm p-5 md:p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-semibold text-[#1a2e28] flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-600" />
            {t("performance.title")}
          </h3>
          <p className="text-xs text-[#6b8f7b] mt-0.5">
            {t("performance.subtitle")}
          </p>
        </div>
        <Link
          href={viewAllHref}
          className="w-8 h-8 rounded-lg bg-[#F2F7F4] hover:bg-[#e0ebe4] flex items-center justify-center transition-colors text-[#4a6a5c]"
          aria-label={t("viewTimesheets")}
        >
          <Maximize2 className="w-4 h-4" />
        </Link>
      </div>

      {rows.length === 0 ? (
        <div className="text-center py-8 text-sm text-[#6b8f7b]">
          {t("noProductivityData")}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm" role="table">
            <thead>
              <tr className="border-b-2 border-[#d0ddd6]">
                <th className="text-left py-2.5 px-2 font-semibold text-[#1a2e28] text-xs uppercase tracking-wider">
                  {t("performance.lawyer")}
                </th>
                <th className="text-right py-2.5 px-2 font-semibold text-[#1a2e28] text-xs uppercase tracking-wider">
                  {t("performance.hours")}
                </th>
                <th className="text-right py-2.5 px-2 font-semibold text-[#1a2e28] text-xs uppercase tracking-wider">
                  {t("performance.amount")}
                </th>
                <th className="text-right py-2.5 px-2 font-semibold text-[#1a2e28] text-xs uppercase tracking-wider">
                  {t("performance.billableHours")}
                </th>
                <th className="text-right py-2.5 px-2 font-semibold text-[#1a2e28] text-xs uppercase tracking-wider">
                  {t("performance.billingRate")}
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.slice(0, 10).map((row, i) => (
                <tr
                  key={row.userId}
                  className={`border-b border-[#e0ebe4] last:border-0 ${
                    i % 2 === 0 ? "bg-[#FAFCFB]" : ""
                  }`}
                >
                  <td className="py-2.5 px-2 font-medium text-[#1a2e28]">{row.lawyerName}</td>
                  <td className="py-2.5 px-2 text-right text-[#4a6a5c]">{row.hoursWorked.toFixed(1)} h</td>
                  <td className="py-2.5 px-2 text-right font-medium text-[#1a2e28]">{formatCurrency(row.valueBillable, "CAD", locale)}</td>
                  <td className="py-2.5 px-2 text-right text-[#4a6a5c]">{row.billableHours.toFixed(1)} h</td>
                  <td className="py-2.5 px-2 text-right">
                    <span
                      className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full ${
                        row.billingRate >= 80
                          ? "bg-emerald-50 text-emerald-700"
                          : row.billingRate >= 50
                            ? "bg-amber-50 text-amber-700"
                            : "bg-red-50 text-red-600"
                      }`}
                    >
                      {row.billingRate}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {rows.length > 0 && (
        <Link
          href={viewAllHref}
          className="block text-center text-sm font-medium text-blue-600 hover:text-blue-700 mt-3 pt-3 border-t border-[#e0ebe4]"
        >
          {tc("viewAll")}
        </Link>
      )}
    </div>
  );
}
