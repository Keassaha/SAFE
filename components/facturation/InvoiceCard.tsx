"use client";

import type { Invoice } from "@prisma/client";
import { Button } from "@/components/ui/Button";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import { displayInvoiceNumero } from "@/lib/facturation/invoice-numero-format";

interface InvoiceCardProps {
  invoice: Invoice & {
    client: { id: string; raisonSociale: string | null };
    dossier: { id: string; intitule: string } | null;
  };
  onPreview: () => void;
  status: "brouillon" | "validee" | "envoyee" | "en_retard";
}

export function InvoiceCard({ invoice, onPreview, status }: InvoiceCardProps) {
  const getStatusColor = () => {
    switch (status) {
      case "brouillon":
        return "bg-gray-50 border-gray-200";
      case "validee":
        return "bg-blue-50 border-blue-200";
      case "envoyee":
        return "bg-green-50 border-green-200";
      case "en_retard":
        return "bg-red-50 border-red-200";
    }
  };

  const getStatusBadgeColor = () => {
    switch (status) {
      case "brouillon":
        return "bg-gray-100 text-gray-700";
      case "validee":
        return "bg-blue-100 text-blue-700";
      case "envoyee":
        return "bg-green-100 text-green-700";
      case "en_retard":
        return "bg-red-100 text-red-700";
    }
  };

  const showRetardBadge = status === "en_retard";

  return (
    <div className={`rounded-lg border p-3 space-y-2 ${getStatusColor()}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-[var(--safe-text-title)] truncate">
            {invoice.client.raisonSociale || "Sans client"}
          </p>
          {invoice.dossier && (
            <p className="text-xs text-[var(--safe-text-secondary)] truncate">
              {invoice.dossier.intitule}
            </p>
          )}
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <span className={`text-xs px-2 py-1 rounded whitespace-nowrap ${getStatusBadgeColor()}`}>
            {displayInvoiceNumero(invoice.numero)}
          </span>
          {showRetardBadge && (
            <span className="text-[10px] uppercase tracking-wide font-semibold px-2 py-0.5 rounded bg-red-600 text-white whitespace-nowrap">
              En retard
            </span>
          )}
        </div>
      </div>

      <div className="flex justify-between items-baseline pt-1 border-t border-current border-opacity-10">
        <span className="text-xs text-[var(--safe-text-secondary)]">Total:</span>
        <span className="text-sm font-semibold text-[var(--safe-text-title)]">
          {formatCurrency(invoice.montantTotal)}
        </span>
      </div>

      {invoice.balanceDue > 0 && (status === "envoyee" || status === "en_retard") && (
        <div className="flex justify-between items-baseline text-xs">
          <span className="text-[var(--safe-text-secondary)]">Reste dû:</span>
          <span className={`font-semibold ${status === "en_retard" ? "text-red-700" : "text-[var(--safe-text-title)]"}`}>
            {formatCurrency(invoice.balanceDue)}
          </span>
        </div>
      )}

      {invoice.dateEcheance && (
        <p className="text-xs text-[var(--safe-text-secondary)]">
          Échéance: {formatDate(invoice.dateEcheance)}
        </p>
      )}

      <Button
        variant="secondary"
        onClick={onPreview}
        className="w-full mt-2 h-8 text-xs"
      >
        Aperçu
      </Button>
    </div>
  );
}
