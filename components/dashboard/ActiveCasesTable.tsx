"use client";

import Link from "next/link";
import { Maximize2, FolderOpen, Folder } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { routes } from "@/lib/routes";
import type { ActiveCaseRow } from "@/lib/dashboard/types";
import { formatCurrency } from "@/lib/utils/format";
import { toIntlLocale } from "@/lib/i18n/locale";

export interface ActiveCasesTableProps {
  rows: ActiveCaseRow[];
  viewAllHref?: string;
}

function formatDate(d: Date | string, locale: string): string {
  return new Intl.DateTimeFormat(toIntlLocale(locale), {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(typeof d === "string" ? new Date(d) : d);
}

export function ActiveCasesTable({
  rows,
  viewAllHref = routes.dossiers,
}: ActiveCasesTableProps) {
  const locale = useLocale();
  const t = useTranslations("dashboard");
  const tc = useTranslations("common");
  return (
    <div className="card-glass overflow-hidden p-5 md:p-6 border-l-4 border-l-violet-500">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold safe-text-title flex items-center gap-1.5 tracking-tight">
            <FolderOpen className="w-4 h-4 text-violet-600" aria-hidden />
            {t("activeCases")}
          </h3>
          <p className="text-xs safe-text-secondary mt-0.5">
            {t("lastActivity")}
          </p>
        </div>
        <Link
          href={viewAllHref}
          className="w-9 h-9 rounded-safe bg-violet-100 hover:bg-violet-200 flex items-center justify-center text-violet-700 transition-colors"
          aria-label={t("viewMatters")}
        >
          <Maximize2 className="w-4 h-4" />
        </Link>
      </div>
      {rows.length === 0 ? (
        <p className="text-sm safe-text-secondary py-6 text-center flex flex-col items-center gap-1">
          <Folder className="w-8 h-8 text-violet-400" aria-hidden />
          {t("noActiveCases")}
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm" role="table">
            <thead>
              <tr className="border-b border-[var(--safe-neutral-border)]">
                <th className="text-left py-2 font-medium safe-text-title">{t("matter")}</th>
                <th className="text-left py-2 font-medium safe-text-title">{t("client")}</th>
                <th className="text-left py-2 font-medium safe-text-title">{t("lawyer")}</th>
                <th className="text-right py-2 font-medium safe-text-title">{t("hours")}</th>
                <th className="text-right py-2 font-medium safe-text-title">{t("billed")}</th>
                <th className="text-right py-2 font-medium safe-text-title">{t("activity")}</th>
              </tr>
            </thead>
            <tbody>
              {rows.slice(0, 8).map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-[var(--safe-neutral-border)] last:border-0"
                >
                  <td className="py-2">
                    <Link
                      href={routes.dossier(row.id)}
                      className="font-medium safe-text-title hover:text-green-700 hover:underline"
                    >
                      {row.caseName}
                    </Link>
                  </td>
                  <td className="py-2 safe-text-secondary">{row.clientName}</td>
                  <td className="py-2 safe-text-secondary">{row.lawyerName ?? "—"}</td>
                  <td className="py-2 text-right safe-text-secondary">{row.hoursLogged.toFixed(1)} h</td>
                  <td className="py-2 text-right safe-text-metric">{formatCurrency(row.amountInvoiced, "CAD", locale)}</td>
                  <td className="py-2 text-right safe-text-secondary">{formatDate(row.lastActivity, locale)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {rows.length > 0 && (
        <Link
          href={viewAllHref}
          className="block text-center text-sm font-medium text-violet-600 hover:text-violet-700 mt-3 pt-3 border-t border-[var(--safe-neutral-border)]"
        >
          {tc("viewAll")}
        </Link>
      )}
    </div>
  );
}
