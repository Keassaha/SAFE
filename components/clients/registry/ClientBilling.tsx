"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { DollarSign, FileText, CheckCircle } from "lucide-react";

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("fr-CA", {
    style: "currency",
    currency: "CAD",
    minimumFractionDigits: 2,
  }).format(value);
}

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

  const cards = [
    {
      title: t("totalBilled"),
      value: formatCurrency(totalBilled),
      sub: t("invoicesCount", { count: invoiceCount }),
      icon: FileText,
    },
    {
      title: t("totalReceived"),
      value: formatCurrency(totalReceived),
      sub: t("paymentsCount", { count: paymentCount }),
      icon: CheckCircle,
    },
    {
      title: t("balanceDue"),
      value: formatCurrency(balanceDue),
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
            className="rounded-xl bg-white border border-neutral-border/80 shadow-[var(--safe-shadow-sm)] p-4"
          >
            <p className="text-xs font-medium text-neutral-muted uppercase tracking-wider">
              {title}
            </p>
            <p className="mt-1 text-xl font-semibold text-neutral-text-primary">{value}</p>
            {sub && <p className="mt-0.5 text-sm text-neutral-muted">{sub}</p>}
            <div className="mt-2 w-8 h-8 rounded-lg bg-primary-100 flex items-center justify-center text-primary-700">
              <Icon className="w-4 h-4" />
            </div>
          </div>
        ))}
      </div>
      <Card>
        <CardHeader
          title={t("financialHistory")}
          action={
            <span className="text-xs text-neutral-muted">
              {t("financialHistorySub")}
            </span>
          }
        />
        <CardContent>
          {transactions.length === 0 ? (
            <div className="py-8 text-center text-neutral-muted">
              <FileText className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p className="text-sm">{t("noTransactions")}</p>
            </div>
          ) : (
            <ul className="space-y-2">
              {transactions.map((tx, i) => (
                <li
                  key={i}
                  className="flex justify-between items-center py-2 border-b border-neutral-border/60 last:border-0"
                >
                  <span className="text-sm text-neutral-text-secondary">
                    {new Intl.DateTimeFormat("fr-CA").format(tx.date)} — {tx.label}
                  </span>
                  <span className="text-sm font-medium">
                    {formatCurrency(tx.amount)}
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
