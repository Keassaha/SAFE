"use client";

import { Receipt } from "lucide-react";
import { formatCurrency } from "@/lib/utils/format";
import type { RapportTaxesSummary } from "@/lib/rapports/types";

interface RapportTaxesSectionProps {
  data: RapportTaxesSummary;
}

export function RapportTaxesSection({ data }: RapportTaxesSectionProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold safe-text-title flex items-center gap-2 tracking-tight">
        <Receipt className="w-4 h-4" aria-hidden />
        Taxes collectées
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card-glass overflow-hidden p-5 border-l-4 border-l-blue-500">
          <p className="text-xs font-medium safe-text-secondary uppercase tracking-wider mb-1">
            TPS collectée
          </p>
          <p className="text-xl font-bold safe-text-title tabular-nums">
            {formatCurrency(data.tpsCollectee)}
          </p>
        </div>
        <div className="card-glass overflow-hidden p-5 border-l-4 border-l-violet-500">
          <p className="text-xs font-medium safe-text-secondary uppercase tracking-wider mb-1">
            TVQ collectée
          </p>
          <p className="text-xl font-bold safe-text-title tabular-nums">
            {formatCurrency(data.tvqCollectee)}
          </p>
        </div>
        <div className="card-glass overflow-hidden p-5 border-l-4 border-l-emerald-500">
          <p className="text-xs font-medium safe-text-secondary uppercase tracking-wider mb-1">
            Total taxes
          </p>
          <p className="text-xl font-bold safe-text-title tabular-nums">
            {formatCurrency(data.total)}
          </p>
        </div>
      </div>
    </div>
  );
}
