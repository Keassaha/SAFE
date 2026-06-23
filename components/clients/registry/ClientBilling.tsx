"use client";

import { useLocale, useTranslations } from "next-intl";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { DollarSign, FileText, CheckCircle } from "lucide-react";
import { formatCurrency } from "@/lib/utils/format";
import { toIntlLocale } from "@/lib/i18n/locale";

interface ClientBillingProps {
  totalBilled: number;
  totalReceived: number;
  balanceDue: number;
  invoiceCount?: number;
  paymentCount?: number;
  transactions?: Array<{ date: Date; label: string; amount: number }>;
}

export function ClientBilling({
  totalBilled,
  totalReceived,
  balanceDue,
  invoiceCount = 0,
  paymentCount = 0,
  transactions = [],
}: ClientBillingProps) {
  const t = useTranslations("clients");
  const locale = useLocale();
  const intlLocale = toIntlLocale(locale);

  const cards = [
    {
      title: t("totalBilled"),
      value: formatCurrency(totalBilled, "CAD", locale),
      sub: t("invoicesCount", { count: invoiceCount }),
      icon: FileText,
    },
    {
      title: t("totalReceived"),
      value: formatCurrency(totalReceived, "CAD", locale),
      sub: t("paymentsCount", { count: paymentCount }),
      icon: CheckCircle,
    },
    {
      title: t("balanceDue"),
      value: formatCurrency(balanceDue, "CAD", locale),
      sub: null,
      icon: DollarSign,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {cards.map(({ title, value, sub, icon: Icon }) => (
          <div
            key={title}
            className="rounded-xl bg-si-surface border border-si-line/80 shadow-[var(--safe-shadow-sm)] p-4"
          >
            <p className="text-xs font-medium text-si-muted uppercase tracking-wider">
              {title}
            </p>
            <p className="mt-1 text-xl font-semibold text-si-ink">{value}</p>
            {sub && <p className="mt-0.5 text-sm text-si-muted">{sub}</p>}
            <div className="mt-2 w-8 h-8 rounded-lg bg-si-forest/10 flex items-center justify-center text-si-forest">
              <Icon className="w-4 h-4" />
            </div>
          </div>
        ))}
      </div>
      <Card>
        <CardHeader
          title={t("financialHistory")}
          action={
            <span className="text-xs text-si-muted">
              {t("financialHistorySub")}
            </span>
          }
        />
        <CardContent>
          {transactions.length === 0 ? (
            <div className="py-8 text-center text-si-muted">
              <FileText className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p className="text-sm">{t("noTransactions")}</p>
            </div>
          ) : (
            <ul className="space-y-2">
              {transactions.map((tx, i) => (
                <li
                  key={i}
                  className="flex justify-between items-center py-2 border-b border-si-line/60 last:border-0"
                >
                  <span className="text-sm text-si-muted">
                    {new Intl.DateTimeFormat(intlLocale).format(tx.date)} — {tx.label}
                  </span>
                  <span className="text-sm font-medium">
                    {formatCurrency(tx.amount, "CAD", locale)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
