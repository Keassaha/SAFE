"use client";

import { Receipt } from "lucide-react";
import { formatCurrency } from "@/lib/utils/format";
import type { RapportTaxesSummary } from "@/lib/rapports/types";
import { useTranslations } from "next-intl";

interface RapportTaxesSectionProps {
  data: RapportTaxesSummary;
}

export function RapportTaxesSection({ data }: RapportTaxesSectionProps) {
  const t = useTranslations("reportsUi");
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-si-ink flex items-center gap-2 tracking-tight">
        <Receipt className="w-4 h-4" aria-hidden />
        {t("taxesCollected")}
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-si-surface border border-si-line overflow-hidden p-5 border-l-4 border-l-si-forest">
          <p className="text-xs font-medium text-si-muted uppercase tracking-wider mb-1">
            {t("tpsCollected")}
          </p>
          <p className="text-xl font-bold text-si-ink tabular-nums">
            {formatCurrency(data.tpsCollectee)}
          </p>
        </div>
        <div className="bg-si-surface border border-si-line overflow-hidden p-5 border-l-4 border-l-violet-500">
          <p className="text-xs font-medium text-si-muted uppercase tracking-wider mb-1">
            {t("tvqCollected")}
          </p>
          <p className="text-xl font-bold text-si-ink tabular-nums">
            {formatCurrency(data.tvqCollectee)}
          </p>
        </div>
        <div className="bg-si-surface border border-si-line overflow-hidden p-5 border-l-4 border-l-emerald-500">
          <p className="text-xs font-medium text-si-muted uppercase tracking-wider mb-1">
            {t("totalTaxes")}
          </p>
          <p className="text-xl font-bold text-si-ink tabular-nums">
            {formatCurrency(data.total)}
          </p>
        </div>
      </div>
    </div>
  );
}
