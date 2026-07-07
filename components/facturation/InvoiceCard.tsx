"use client";

import type { Invoice } from "@prisma/client";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import { displayInvoiceNumero } from "@/lib/facturation/invoice-numero-format";
import { clientDisplayName } from "@/lib/clients/normalize-name";

interface InvoiceCardProps {
  invoice: Invoice & {
    client: { id: string; raisonSociale: string | null; prenom: string | null; nom: string | null };
    dossier: { id: string; intitule: string } | null;
  };
  onPreview: () => void;
  status: "brouillon" | "validee" | "envoyee" | "en_retard";
}

export function InvoiceCard({ invoice, onPreview, status }: InvoiceCardProps) {
  const t = useTranslations("billingCompUi");
  const getStatusColor = () => {
    switch (status) {
      case "brouillon":
        return "bg-gray-50 border-gray-200";
      case "validee":
        return "bg-si-canvas border-si-line";
      case "envoyee":
        return "bg-si-verified/10 border-si-verified/30";
      case "en_retard":
        return "bg-[#B84A3E]/10 border-[#B84A3E]/30";
    }
  };

  const getStatusBadgeColor = () => {
    switch (status) {
      case "brouillon":
        return "bg-gray-100 text-gray-700";
      case "validee":
        return "bg-si-canvas text-si-ink";
      case "envoyee":
        return "bg-si-verified/10 text-si-verified";
      case "en_retard":
        return "bg-[#B84A3E]/10 text-[#B84A3E]";
    }
  };

  const showRetardBadge = status === "en_retard";

  return (
    <div className={`rounded-lg border p-3 space-y-2 ${getStatusColor()}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-si-ink truncate">
            {clientDisplayName(invoice.client, t("noClient"))}
          </p>
          {invoice.dossier && (
            <p className="text-xs text-si-muted truncate">
              {invoice.dossier.intitule}
            </p>
          )}
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <span className={`text-xs px-2 py-1 rounded whitespace-nowrap ${getStatusBadgeColor()}`}>
            {displayInvoiceNumero(invoice.numero)}
          </span>
          {showRetardBadge && (
            <span className="text-[10px] uppercase tracking-wide font-semibold px-2 py-0.5 rounded bg-[#B84A3E] text-white whitespace-nowrap">
              {t("overdue")}
            </span>
          )}
        </div>
      </div>

      <div className="flex justify-between items-baseline pt-1 border-t border-current border-opacity-10">
        <span className="text-xs text-si-muted">{t("totalLabel")}</span>
        <span className="text-sm font-semibold text-si-ink">
          {formatCurrency(invoice.montantTotal)}
        </span>
      </div>

      {invoice.balanceDue > 0 && (status === "envoyee" || status === "en_retard") && (
        <div className="flex justify-between items-baseline text-xs">
          <span className="text-si-muted">{t("balanceDueLabel")}</span>
          <span className={`font-semibold ${status === "en_retard" ? "text-[#B84A3E]" : "text-si-ink"}`}>
            {formatCurrency(invoice.balanceDue)}
          </span>
        </div>
      )}

      {invoice.dateEcheance && (
        <p className="text-xs text-si-muted">
          {t("dueDateLabel")} {formatDate(invoice.dateEcheance)}
        </p>
      )}

      <Button
        variant="secondary"
        onClick={onPreview}
        className="w-full mt-2 h-8 text-xs"
      >
        {t("preview")}
      </Button>
    </div>
  );
}
