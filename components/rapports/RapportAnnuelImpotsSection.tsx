"use client";

import { FileText } from "lucide-react";
import { formatCurrency } from "@/lib/utils/format";
import { useTranslations } from "next-intl";

interface RapportAnnuelImpotsSectionProps {
  data: {
    totalRevenus: number;
    totalTPS: number;
    totalTVQ: number;
    totalPaiements: number;
  };
  annee: number;
}

export function RapportAnnuelImpotsSection({ data, annee }: RapportAnnuelImpotsSectionProps) {
  const t = useTranslations("reportsUi");
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold safe-text-title flex items-center gap-2 tracking-tight">
        <FileText className="w-4 h-4" aria-hidden />
        {t("annualTaxReportTitle", { year: annee })}
      </h3>
      <div className="card-glass overflow-hidden p-6 border border-[var(--safe-neutral-border)]/60">
        <table className="min-w-full text-sm">
          <tbody>
            <tr className="border-b border-[var(--safe-neutral-border)]/60">
              <td className="py-3 safe-text-secondary">{t("billedRevenueTotal")}</td>
              <td className="py-3 text-right font-semibold safe-text-title tabular-nums">
                {formatCurrency(data.totalRevenus)}
              </td>
            </tr>
            <tr className="border-b border-[var(--safe-neutral-border)]/60">
              <td className="py-3 safe-text-secondary">{t("tpsCollected")}</td>
              <td className="py-3 text-right font-semibold safe-text-title tabular-nums">
                {formatCurrency(data.totalTPS)}
              </td>
            </tr>
            <tr className="border-b border-[var(--safe-neutral-border)]/60">
              <td className="py-3 safe-text-secondary">{t("tvqCollected")}</td>
              <td className="py-3 text-right font-semibold safe-text-title tabular-nums">
                {formatCurrency(data.totalTVQ)}
              </td>
            </tr>
            <tr>
              <td className="py-3 safe-text-secondary">{t("paymentsReceived")}</td>
              <td className="py-3 text-right font-semibold safe-text-title tabular-nums">
                {formatCurrency(data.totalPaiements)}
              </td>
            </tr>
          </tbody>
        </table>
        <p className="text-xs safe-text-secondary mt-4">
          {t("periodSummaryHint")}
        </p>
      </div>
    </div>
  );
}
