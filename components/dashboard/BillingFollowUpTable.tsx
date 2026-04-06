"use client";

import Link from "next/link";
import { Maximize2, ClipboardList, Check, FileEdit, Send, AlertTriangle } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { routes } from "@/lib/routes";
import type { BillingFollowUpRow } from "@/lib/dashboard/types";
import { formatCurrency } from "@/lib/utils/format";
import { toIntlLocale } from "@/lib/i18n/locale";

export interface BillingFollowUpTableProps {
  rows: BillingFollowUpRow[];
  viewAllHref?: string;
}

function formatDate(d: Date | string, locale: string): string {
  return new Intl.DateTimeFormat(toIntlLocale(locale), {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(typeof d === "string" ? new Date(d) : d);
}

const STATUS_STYLES: Record<string, string> = {
  Brouillon: "bg-slate-100 text-slate-700 border border-slate-200",
  Draft: "bg-slate-100 text-slate-700 border border-slate-200",
  Envoyée: "bg-amber-100 text-amber-800 border border-amber-200",
  Issued: "bg-amber-100 text-amber-800 border border-amber-200",
  "En retard": "bg-red-100 text-red-800 border border-red-200",
  Overdue: "bg-red-100 text-red-800 border border-red-200",
};

export function BillingFollowUpTable({
  rows,
  viewAllHref = routes.facturationSuivi,
}: BillingFollowUpTableProps) {
  const locale = useLocale();
  const t = useTranslations("dashboard");
  const tc = useTranslations("common");
  return (
    <div className="card-glass overflow-hidden p-5 md:p-6 border-l-4 border-l-amber-500">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold safe-text-title flex items-center gap-1.5 tracking-tight">
            <ClipboardList className="w-4 h-4 text-amber-600" aria-hidden />
            {t("billingFollowUpTitle")}
          </h3>
          <p className="text-xs safe-text-secondary mt-0.5">
            {t("billingFollowUp")}
          </p>
        </div>
        <Link
          href={viewAllHref}
          className="w-9 h-9 rounded-safe bg-amber-100 hover:bg-amber-200 flex items-center justify-center text-amber-700 transition-colors"
          aria-label={t("viewBillingFollowUp")}
        >
          <Maximize2 className="w-4 h-4" />
        </Link>
      </div>
      {rows.length === 0 ? (
        <p className="text-sm safe-text-secondary py-6 text-center flex flex-col items-center gap-1">
          <Check className="w-8 h-8 text-emerald-500" aria-hidden />
          {t("noPendingInvoices")}
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm" role="table">
            <thead>
              <tr className="border-b border-[var(--safe-neutral-border)]">
                <th className="text-left py-2 font-medium safe-text-title">{t("client")}</th>
                <th className="text-left py-2 font-medium safe-text-title">{t("invoiceNumber")}</th>
                <th className="text-right py-2 font-medium safe-text-title">{t("amountLabel")}</th>
                <th className="text-right py-2 font-medium safe-text-title">{t("issuedDate")}</th>
                <th className="text-right py-2 font-medium safe-text-title">{t("statusLabel")}</th>
              </tr>
            </thead>
            <tbody>
              {rows.slice(0, 8).map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-[var(--safe-neutral-border)] last:border-0"
                >
                  <td className="py-2 safe-text-title">{row.clientName}</td>
                  <td className="py-2">
                    <Link
                      href={routes.facturationFactureEdit(row.id)}
                      className="font-medium safe-text-title hover:text-green-700 hover:underline"
                    >
                      {row.invoiceNumber}
                    </Link>
                  </td>
                  <td className="py-2 text-right safe-text-metric">{formatCurrency(row.amount, "CAD", locale)}</td>
                  <td className="py-2 text-right safe-text-secondary">{formatDate(row.dateIssued, locale)}</td>
                  <td className="py-2 text-right">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-safe-sm text-xs font-medium ${
                        STATUS_STYLES[row.status] ?? "bg-neutral-100 text-neutral-700"
                      }`}
                    >
                      {(row.status === "Brouillon" || row.status === "Draft") && <FileEdit className="w-3.5 h-3.5" aria-hidden />}
                      {(row.status === "Envoyée" || row.status === "Issued") && <Send className="w-3.5 h-3.5" aria-hidden />}
                      {(row.status === "En retard" || row.status === "Overdue") && <AlertTriangle className="w-3.5 h-3.5" aria-hidden />}
                      {row.status}
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
          className="block text-center text-sm font-medium text-amber-700 hover:text-amber-800 mt-3 pt-3 border-t border-[var(--safe-neutral-border)]"
        >
          {tc("viewAll")}
        </Link>
      )}
    </div>
  );
}
