"use client";

import { formatCurrency } from "@/lib/utils/format";
import type { ComptesRecevoirAging } from "@/lib/rapports/types";
import { BarChart2, AlertCircle } from "lucide-react";

interface ComptesRecevoirSectionProps {
  data: ComptesRecevoirAging[];
}

const BUCKET_COLORS = ["bg-emerald-500", "bg-amber-500", "bg-orange-500", "bg-red-500"];

export function ComptesRecevoirSection({ data }: ComptesRecevoirSectionProps) {
  const total = data.reduce((s, b) => s + b.montant, 0);
  const maxMontant = Math.max(...data.map((b) => b.montant), 1);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h3 className="text-sm font-semibold safe-text-title flex items-center gap-2">
          <BarChart2 className="w-4 h-4" aria-hidden />
          Âge des factures (comptes à recevoir)
        </h3>
        <p className="text-sm safe-text-secondary">
          Total à recevoir : <span className="font-semibold safe-text-title">{formatCurrency(total)}</span>
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {data.map((bucket, i) => (
          <div
            key={bucket.range}
            className="card-glass overflow-hidden p-4 border border-[var(--safe-neutral-border)]/60"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium safe-text-secondary uppercase tracking-wider">
                {bucket.label}
              </span>
              {bucket.count > 0 && bucket.montant > 0 && (
                <span className="text-xs text-amber-600 flex items-center gap-1" role="status">
                  <AlertCircle className="w-3.5 h-3.5" aria-hidden />
                  {bucket.count} facture{bucket.count > 1 ? "s" : ""}
                </span>
              )}
            </div>
            <p className="text-lg font-bold safe-text-title tabular-nums">
              {formatCurrency(bucket.montant)}
            </p>
            <div className="mt-2 h-2 rounded-full bg-neutral-200 overflow-hidden">
              <div
                className={`h-full rounded-full ${BUCKET_COLORS[i] ?? "bg-neutral-400"}`}
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
