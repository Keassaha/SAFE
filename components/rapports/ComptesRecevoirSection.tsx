"use client";

import { formatCurrency } from "@/lib/utils/format";
import type { ComptesRecevoirAging } from "@/lib/rapports/types";
import { BarChart2, AlertCircle } from "lucide-react";
import { useTranslations } from "next-intl";

interface ComptesRecevoirSectionProps {
  data: ComptesRecevoirAging[];
}

const BUCKET_COLORS = ["bg-si-verified", "bg-si-amber", "bg-orange-500", "bg-[#B84A3E]"];

export function ComptesRecevoirSection({ data }: ComptesRecevoirSectionProps) {
  const t = useTranslations("reportsUi");
  const total = data.reduce((s, b) => s + b.montant, 0);
  const maxMontant = Math.max(...data.map((b) => b.montant), 1);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h3 className="text-sm font-semibold text-si-ink flex items-center gap-2 tracking-tight">
          <BarChart2 className="w-4 h-4" aria-hidden />
          {t("invoiceAgingTitle")}
        </h3>
        <p className="text-sm text-si-muted">
          {t("totalReceivable")} <span className="font-semibold text-si-ink">{formatCurrency(total)}</span>
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {data.map((bucket, i) => (
          <div
            key={bucket.range}
            className="bg-si-surface border border-si-line overflow-hidden p-4 border border-si-line/60"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-si-muted uppercase tracking-wider">
                {bucket.label}
              </span>
              {bucket.count > 0 && bucket.montant > 0 && (
                <span className="text-xs text-si-amber-ink flex items-center gap-1" role="status">
                  <AlertCircle className="w-3.5 h-3.5" aria-hidden />
                  {t("invoiceCount", { count: bucket.count })}
                </span>
              )}
            </div>
            <p className="text-lg font-bold text-si-ink tabular-nums">
              {formatCurrency(bucket.montant)}
            </p>
            <div className="mt-2 h-2 rounded-full bg-si-canvas overflow-hidden">
              <div
                className={`h-full rounded-full ${BUCKET_COLORS[i] ?? "bg-si-muted/40"}`}
                style={{ width: `${(bucket.montant / maxMontant) * 100}%` }}
                aria-hidden
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
