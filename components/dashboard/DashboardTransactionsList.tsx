"use client";

import { MoreHorizontal, FileText, CircleDollarSign, Receipt } from "lucide-react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { toIntlLocale } from "@/lib/i18n/locale";

export interface TransactionItem {
  id: string;
  label: string;
  date: string;
  amount: number;
  href?: string;
}

interface DashboardTransactionsListProps {
  items: TransactionItem[];
  /** Texte du lien "Voir tout" */
  viewAllHref?: string;
}

export function DashboardTransactionsList({
  items,
  viewAllHref = "/rapports",
}: DashboardTransactionsListProps) {
  const locale = useLocale();
  const t = useTranslations("dashboard");
  const tc = useTranslations("common");
  const intlLocale = toIntlLocale(locale);
  return (
    <div className="card-glass overflow-hidden p-4 md:p-5 border-l-4 border-l-emerald-500">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold safe-text-title flex items-center gap-1.5">
          <CircleDollarSign className="w-4 h-4 text-emerald-600" aria-hidden />
          {t("transactions")}
        </h3>
        <button
          type="button"
          className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--safe-icon-default)] hover:bg-emerald-100 hover:text-emerald-700 transition-colors"
          aria-label={t("options")}
        >
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </div>
      <ul className="space-y-3">
        {items.length === 0 ? (
          <li className="text-sm safe-text-secondary py-4 text-center flex flex-col items-center gap-1">
            <Receipt className="w-8 h-8 text-emerald-400" aria-hidden />
            {t("noRecentTransactions")}
          </li>
        ) : (
          items.slice(0, 5).map((tx) => {
            const isPositive = tx.amount >= 0;
            const content = (
              <>
                <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0 text-emerald-700">
                  <FileText className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium safe-text-title truncate">
                    {tx.label}
                  </p>
                  <p className="text-xs safe-text-secondary">{tx.date}</p>
                </div>
                <span
                  className={`text-sm font-semibold shrink-0 ${
                    isPositive ? "text-emerald-600" : "text-red-600"
                  }`}
                >
                  {isPositive ? "+" : "−"} {formatAmount(Math.abs(tx.amount), intlLocale)}
                </span>
              </>
            );
            return (
              <li key={tx.id}>
                {tx.href ? (
                  <Link
                    href={tx.href}
                    className="flex items-center gap-3 p-2 rounded-xl hover:bg-neutral-50 transition-colors"
                  >
                    {content}
                  </Link>
                ) : (
                  <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-neutral-50 transition-colors">
                    {content}
                  </div>
                )}
              </li>
            );
          })
        )}
      </ul>
      {items.length > 0 && viewAllHref && (
        <Link
          href={viewAllHref}
          className="block text-center text-sm font-medium text-emerald-700 hover:text-emerald-800 mt-3 pt-3 border-t border-[var(--safe-neutral-border)]"
        >
          {tc("viewAll")}
        </Link>
      )}
    </div>
  );
}

function formatAmount(value: number, locale: string): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "CAD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}
