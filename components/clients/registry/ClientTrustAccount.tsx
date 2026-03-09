"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Wallet } from "lucide-react";
import { routes } from "@/lib/routes";

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("fr-CA", {
    style: "currency",
    currency: "CAD",
    minimumFractionDigits: 2,
  }).format(value);
}

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

  return (
    <Card>
      <CardHeader title={t("trustAccount")} />
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-neutral-muted">{t("trustBalance")}</span>
          <span className="text-lg font-semibold text-neutral-text-primary">
            {formatCurrency(balance)}
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
            {new Intl.DateTimeFormat("fr-CA", {
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
