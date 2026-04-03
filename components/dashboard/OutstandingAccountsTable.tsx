"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { AlertTriangle, ExternalLink } from "lucide-react";
import { formatCurrency } from "@/lib/utils/format";
import { routes } from "@/lib/routes";
import { toIntlLocale } from "@/lib/i18n/locale";
import type { OutstandingAccountRow } from "@/lib/dashboard/types";

export interface OutstandingAccountsTableProps {
  rows: OutstandingAccountRow[];
}

const AGING_COLORS: Record<string, { bg: string; text: string }> = {
  Courant: { bg: "bg-emerald-50", text: "text-emerald-700" },
  "30+ jours": { bg: "bg-amber-50", text: "text-amber-700" },
  "60+ jours": { bg: "bg-orange-50", text: "text-orange-700" },
  "90+ jours": { bg: "bg-red-50", text: "text-red-600" },
  Critique: { bg: "bg-red-100", text: "text-red-800" },
};

function formatDate(d: Date | string, locale: string): string {
  return new Intl.DateTimeFormat(toIntlLocale(locale), {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(typeof d === "string" ? new Date(d) : d);
}

export function OutstandingAccountsTable({ rows }: OutstandingAccountsTableProps) {
  const t = useTranslations("dashboard");
  const locale = useLocale();

  return (
    <div className="bg-white rounded-2xl border border-[#d0ddd6] shadow-sm p-5 md:p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-base font-semibold text-[#1a2e28] flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-500" />
            {t("outstanding.title")}
          </h3>
          <p className="text-xs text-[#6b8f7b] mt-0.5">
            {t("outstanding.subtitle")}
          </p>
        </div>
        <Link
          href={routes.facturationSuivi}
          className="text-xs font-medium text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
        >
          {t("outstanding.viewAll")}
          <ExternalLink className="w-3 h-3" />
        </Link>
      </div>

      {rows.length === 0 ? (
        <div className="text-center py-8 text-sm text-[#6b8f7b]">
          {t("outstanding.none")}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm" role="table">
            <thead>
              <tr className="border-b-2 border-[#d0ddd6]">
                <th className="text-left py-2.5 px-2 font-semibold text-[#1a2e28] text-xs uppercase tracking-wider">
                  Client
                </th>
                <th className="text-right py-2.5 px-2 font-semibold text-[#1a2e28] text-xs uppercase tracking-wider">
                  {t("outstanding.balance")}
                </th>
                <th className="text-right py-2.5 px-2 font-semibold text-[#1a2e28] text-xs uppercase tracking-wider">
                  {t("outstanding.firstInvoice")}
                </th>
                <th className="text-right py-2.5 px-2 font-semibold text-[#1a2e28] text-xs uppercase tracking-wider">
                  {t("outstanding.days")}
                </th>
                <th className="text-center py-2.5 px-2 font-semibold text-[#1a2e28] text-xs uppercase tracking-wider">
                  {t("outstanding.aging")}
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => {
                const colors = AGING_COLORS[row.agingCategory] ?? AGING_COLORS.Courant;
                return (
                  <tr
                    key={row.clientId}
                    className={`border-b border-[#e0ebe4] last:border-0 ${
                      i % 2 === 0 ? "bg-[#FAFCFB]" : ""
                    }`}
                  >
                    <td className="py-2.5 px-2">
                      <Link
                        href={routes.client(row.clientId)}
                        className="font-medium text-[#1a2e28] hover:text-emerald-700 hover:underline"
                      >
                        {row.clientName}
                      </Link>
                    </td>
                    <td className="py-2.5 px-2 text-right font-bold text-red-600">
                      {formatCurrency(row.balanceDue, "CAD", locale)}
                    </td>
                    <td className="py-2.5 px-2 text-right text-[#6b8f7b]">
                      {formatDate(row.firstInvoiceDate, locale)}
                    </td>
                    <td className="py-2.5 px-2 text-right font-medium text-[#1a2e28]">
                      {row.daysSinceFirstInvoice} j
                    </td>
                    <td className="py-2.5 px-2 text-center">
                      <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full ${colors.bg} ${colors.text}`}>
                        {row.agingCategory}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
