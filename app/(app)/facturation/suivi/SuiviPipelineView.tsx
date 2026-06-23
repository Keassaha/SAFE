"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import type { Invoice, InvoiceLine } from "@prisma/client";
import { InvoicePreviewModal } from "@/components/facturation/InvoicePreviewModal";
import { InvoiceCard } from "@/components/facturation/InvoiceCard";

type InvoiceWithRelations = Invoice & {
  client: { id: string; raisonSociale: string | null };
  dossier: { id: string; intitule: string } | null;
  invoiceLines: InvoiceLine[];
};

interface SuiviPipelineViewProps {
  envoyees: InvoiceWithRelations[];
  enRetard: InvoiceWithRelations[];
  cabinetId: string;
}

export function SuiviPipelineView({
  envoyees,
  enRetard,
  cabinetId,
}: SuiviPipelineViewProps) {
  const t = useTranslations("billingUi");
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceWithRelations | null>(null);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Envoyées : factures émises actives + payées (historique du pipeline) */}
        <div className="rounded-lg border border-si-line bg-si-canvas p-4">
          <h3 className="font-semibold text-si-ink mb-4">
            {t("statusSent")}
            <span className="ml-2 text-sm font-normal text-si-muted">
              ({envoyees.length})
            </span>
          </h3>
          <div className="space-y-3 max-h-[calc(100vh-300px)] overflow-y-auto">
            {envoyees.length === 0 ? (
              <p className="text-sm text-si-muted py-8 text-center">
                {t("noSentInvoicesShort")}
              </p>
            ) : (
              envoyees.map((invoice) => (
                <InvoiceCard
                  key={invoice.id}
                  invoice={invoice}
                  onPreview={() => setSelectedInvoice(invoice)}
                  status="envoyee"
                />
              ))
            )}
          </div>
        </div>

        {/* En retard : dérivé de dateEcheance < now sur factures émises non payées */}
        <div className="rounded-lg border border-si-line bg-si-canvas p-4">
          <h3 className="font-semibold text-si-ink mb-4">
            {t("statusOverdue")}
            <span className="ml-2 text-sm font-normal text-si-muted">
              ({enRetard.length})
            </span>
          </h3>
          <div className="space-y-3 max-h-[calc(100vh-300px)] overflow-y-auto">
            {enRetard.length === 0 ? (
              <p className="text-sm text-si-muted py-8 text-center">
                {t("noOverdueInvoices")}
              </p>
            ) : (
              enRetard.map((invoice) => (
                <InvoiceCard
                  key={invoice.id}
                  invoice={invoice}
                  onPreview={() => setSelectedInvoice(invoice)}
                  status="en_retard"
                />
              ))
            )}
          </div>
        </div>
      </div>

      {selectedInvoice && (
        <InvoicePreviewModal
          invoice={selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
          cabinetId={cabinetId}
        />
      )}
    </div>
  );
}
