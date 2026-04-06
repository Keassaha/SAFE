"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { routes } from "@/lib/routes";

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("fr-CA", {
    style: "currency",
    currency: "CAD",
    minimumFractionDigits: 2,
  }).format(value);
}

export type TimeEntryRow = {
  id: string;
  date: Date;
  description: string | null;
  dureeMinutes: number;
  montant: number;
  userNom: string;
};

interface DossierBillingProps {
  dossierId: string;
  totalHeures: number;
  totalMontant: number;
  timeEntries: TimeEntryRow[];
}

export function DossierBilling({
  dossierId,
  totalHeures,
  totalMontant,
  timeEntries,
}: DossierBillingProps) {
  const t = useTranslations("matters");
  const tc = useTranslations("common");

  return (
    <Card>
      <CardHeader
        title={t("timesheets")}
        action={
          <Link href={routes.temps}>
            <Button>{t("addTimesheet")}</Button>
          </Link>
        }
      />
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-4 text-sm">
          <div>
            <span className="text-neutral-muted">{t("totalHours")}</span>{" "}
            <span className="font-medium">{totalHeures.toFixed(1)} h</span>
          </div>
          <div>
            <span className="text-neutral-muted">{t("totalAmount")}</span>{" "}
            <span className="font-medium">{formatCurrency(totalMontant)}</span>
          </div>
        </div>
        {timeEntries.length > 0 ? (
          <div className="overflow-x-auto border border-neutral-border rounded-safe-sm">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-neutral-surface/50 border-b border-neutral-border">
                  <th className="text-left py-2 px-3">{tc("date")}</th>
                  <th className="text-left py-2 px-3">{tc("description")}</th>
                  <th className="text-right py-2 px-3">{t("duration")}</th>
                  <th className="text-right py-2 px-3">{tc("amount")}</th>
                  <th className="text-left py-2 px-3">{t("lawyer")}</th>
                </tr>
              </thead>
              <tbody>
                {timeEntries.map((r) => (
                  <tr key={r.id} className="border-b border-neutral-border last:border-0">
                    <td className="py-2 px-3 text-neutral-muted">
                      {new Date(r.date).toLocaleDateString("fr-CA")}
                    </td>
                    <td className="py-2 px-3">{r.description ?? "—"}</td>
                    <td className="py-2 px-3 text-right">
                      {(r.dureeMinutes / 60).toFixed(1)} h
                    </td>
                    <td className="py-2 px-3 text-right">
                      {formatCurrency(r.montant)}
                    </td>
                    <td className="py-2 px-3">{r.userNom}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-neutral-muted text-sm">
            {t("noTimesheets")}{" "}
            <Link
              href={routes.temps}
              className="text-primary-700 hover:underline"
            >
              {t("addTimesheetLink")}
            </Link>
          </p>
        )}
      </CardContent>
    </Card>
  );
}
