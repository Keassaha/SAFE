"use client";

import { FileText } from "lucide-react";
import { formatCurrency } from "@/lib/utils/format";

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
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold safe-text-title flex items-center gap-2">
        <FileText className="w-4 h-4" aria-hidden />
        Rapport annuel pour impôts — {annee}
      </h3>
      <div className="card-glass overflow-hidden p-6 border border-[var(--safe-neutral-border)]/60">
        <table className="min-w-full text-sm">
          <tbody>
            <tr className="border-b border-[var(--safe-neutral-border)]/60">
              <td className="py-3 safe-text-secondary">Revenus facturés (total)</td>
              <td className="py-3 text-right font-semibold safe-text-title tabular-nums">
                {formatCurrency(data.totalRevenus)}
              </td>
            </tr>
            <tr className="border-b border-[var(--safe-neutral-border)]/60">
              <td className="py-3 safe-text-secondary">TPS collectée</td>
              <td className="py-3 text-right font-semibold safe-text-title tabular-nums">
                {formatCurrency(data.totalTPS)}
              </td>
            </tr>
            <tr className="border-b border-[var(--safe-neutral-border)]/60">
              <td className="py-3 safe-text-secondary">TVQ collectée</td>
              <td className="py-3 text-right font-semibold safe-text-title tabular-nums">
                {formatCurrency(data.totalTVQ)}
              </td>
            </tr>
            <tr>
              <td className="py-3 safe-text-secondary">Paiements reçus</td>
              <td className="py-3 text-right font-semibold safe-text-title tabular-nums">
                {formatCurrency(data.totalPaiements)}
              </td>
            </tr>
          </tbody>
        </table>
        <p className="text-xs safe-text-secondary mt-4">
          Résumé de la période sélectionnée. Utilisez les filtres pour définir l’année fiscale.
        </p>
      </div>
    </div>
  );
}
