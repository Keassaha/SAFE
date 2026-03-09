"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("fr-CA", {
    style: "currency",
    currency: "CAD",
    minimumFractionDigits: 2,
  }).format(value);
}

interface DossierTrustAccountProps {
  soldeFiducieDossier: number | null;
  autoriserPaiementFiducie: boolean;
  clientTrustLink?: React.ReactNode;
}

export function DossierTrustAccount({
  soldeFiducieDossier,
  autoriserPaiementFiducie,
  clientTrustLink,
}: DossierTrustAccountProps) {
  const t = useTranslations("matters");
  const tc = useTranslations("common");
  const solde = soldeFiducieDossier ?? 0;

  return (
    <Card>
      <CardHeader title={t("trustAccountTitle")} />
      <CardContent className="space-y-2 text-sm">
        <div>
          <span className="text-neutral-muted">{t("matterBalance")}</span>{" "}
          <span className="font-medium">{formatCurrency(solde)}</span>
        </div>
        <div>
          <span className="text-neutral-muted">{t("trustPaymentsAuthorized")}</span>{" "}
          {autoriserPaiementFiducie ? tc("yes") : tc("no")}
        </div>
        {clientTrustLink && (
          <div className="pt-2 border-t border-neutral-border">{clientTrustLink}</div>
        )}
      </CardContent>
    </Card>
  );
}
