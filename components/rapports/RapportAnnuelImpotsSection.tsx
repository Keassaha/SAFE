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
      <h3 className="text-sm font-semibold text-si-ink flex items-center gap-2 tracking-tight">
        <FileText className="w-4 h-4" aria-hidden />
        {t("annualTaxReportTitle", { year: annee })}
      </h3>
      <div className="bg-si-surface border border-si-line overflow-hidden p-6 border border-si-line/60">
        <table className="min-w-full text-sm">
          <tbody>
            <tr className="border-b border-si-line/60">
              <td className="py-3 text-si-muted">{t("billedRevenueTotal")}</td>
              <td className="py-3 text-right font-semibold text-si-ink tabular-nums">
                {formatCurrency(data.totalRevenus)}
              </td>
            </tr>
            <tr className="border-b border-si-line/60">
              <td className="py-3 text-si-muted">{t("tpsCollected")}</td>
              <td className="py-3 text-right font-semibold text-si-ink tabular-nums">
                {formatCurrency(data.totalTPS)}
              </td>
            </tr>
            <tr className="border-b border-si-line/60">
              <td className="py-3 text-si-muted">{t("tvqCollected")}</td>
              <td className="py-3 text-right font-semibold text-si-ink tabular-nums">
                {formatCurrency(data.totalTVQ)}
              </td>
            </tr>
            <tr>
              <td className="py-3 text-si-muted">{t("paymentsReceived")}</td>
              <td className="py-3 text-right font-semibold text-si-ink tabular-nums">
                {formatCurrency(data.totalPaiements)}
              </td>
            </tr>
          </tbody>
        </table>
        <p className="text-xs text-si-muted mt-4">
          {t("periodSummaryHint")}
        </p>
      </div>
    </div>
  );
}
