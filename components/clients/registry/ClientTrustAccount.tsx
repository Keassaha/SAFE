"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Wallet } from "lucide-react";
import { routes } from "@/lib/routes";
import { formatCurrency } from "@/lib/utils/format";
import { toIntlLocale } from "@/lib/i18n/locale";

interface ClientTrustAccountProps {
  clientId?: string;
  balance: number;
  trustAccountId: string | null;
  allowTrustPayments: boolean;
  lastTransactionDate: Date | null;
}

export function ClientTrustAccount({
  clientId,
  balance,
  trustAccountId,
  allowTrustPayments,
  lastTransactionDate,
}: ClientTrustAccountProps) {
  const t = useTranslations("clients");
  const tc = useTranslations("common");
  const locale = useLocale();
  const intlLocale = toIntlLocale(locale);

  return (
    <Card>
      <CardHeader title={t("trustAccount")} />
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-neutral-muted">{t("trustBalance")}</span>
          <span className="text-lg font-semibold text-neutral-text-primary">
            {formatCurrency(balance, "CAD", locale)}
          </span>
        </div>
        {trustAccountId && (
          <div className="text-sm">
            <span className="text-neutral-muted">{t("trustAccountLabel")} : </span>
            <span className="text-neutral-text-secondary">{trustAccountId}</span>
          </div>
        )}
        <div className="text-sm text-neutral-muted">
          {t("trustPaymentsAllowed")} :{" "}
          {allowTrustPayments ? tc("yes") : tc("no")}
        </div>
        {lastTransactionDate && (
          <p className="text-xs text-neutral-muted">
            {t("lastOperation")} :{" "}
            {new Intl.DateTimeFormat(intlLocale, {
              dateStyle: "medium",
            }).format(lastTransactionDate)}
          </p>
        )}
        {clientId && (
          <div className="pt-2 border-t border-neutral-border">
            <Link
              href={`${routes.comptes}?clientId=${encodeURIComponent(clientId)}`}
              className="text-sm text-primary-600 hover:underline"
            >
              {t("viewTrustModule")}
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
