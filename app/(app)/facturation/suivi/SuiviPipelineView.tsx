"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import type { Invoice, InvoiceLine } from "@prisma/client";
import { InvoicePreviewModal } from "@/components/facturation/InvoicePreviewModal";
import { InvoiceCard } from "@/components/facturation/InvoiceCard";

type InvoiceWithRelations = Invoice & {
  client: { id: string; raisonSociale: string | null };
  dossier: { id: string; intitule: string } | null;
  invoiceLines: InvoiceLine[];
};

interface SuiviPipelineViewProps {
  brouillons: InvoiceWithRelations[];
  validees: InvoiceWithRelations[];
  envoyees: InvoiceWithRelations[];
  cabinetId: string;
}

export function SuiviPipelineView({
  brouillons,
  validees,
  envoyees,
  cabinetId,
}: SuiviPipelineViewProps) {
  const t = useTranslations("facturation");
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceWithRelations | null>(null);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Brouillon Column */}
        <div className="rounded-lg border border-[var(--safe-neutral-border)] bg-[var(--safe-neutral-50)] p-4">
          <h3 className="font-semibold text-[var(--safe-text-title)] mb-4">
            Brouillon
            <span className="ml-2 text-sm font-normal text-[var(--safe-text-secondary)]">
              ({brouillons.length})
            </span>
          </h3>
          <div className="space-y-3 max-h-[calc(100vh-300px)] overflow-y-auto">
            {brouillons.length === 0 ? (
              <p className="text-sm text-[var(--safe-text-secondary)] py-8 text-center">
                Aucune facture en brouillon
              </p>
            ) : (
              brouillons.map((invoice) => (
                <InvoiceCard
                  key={invoice.id}
                  invoice={invoice}
                  onPreview={() => setSelectedInvoice(invoice)}
                  status="brouillon"
                />
              ))
            )}
          </div>
        </div>

        {/* Validée Column */}
        <div className="rounded-lg border border-[var(--safe-neutral-border)] bg-[var(--safe-neutral-50)] p-4">
          <h3 className="font-semibold text-[var(--safe-text-title)] mb-4">
            Validée
            <span className="ml-2 text-sm font-normal text-[var(--safe-text-secondary)]">
              ({validees.length})
            </span>
          </h3>
          <div className="space-y-3 max-h-[calc(100vh-300px)] overflow-y-auto">
            {validees.length === 0 ? (
              <p className="text-sm text-[var(--safe-text-secondary)] py-8 text-center">
                Aucune facture validée
              </p>
            ) : (
              validees.map((invoice) => (
                <InvoiceCard
                  key={invoice.id}
                  invoice={invoice}
                  onPreview={() => setSelectedInvoice(invoice)}
                  status="validee"
                />
              ))
            )}
          </div>
        </div>

        {/* Envoyée Column */}
        <div className="rounded-lg border border-[var(--safe-neutral-border)] bg-[var(--safe-neutral-50)] p-4">
          <h3 className="font-semibold text-[var(--safe-text-title)] mb-4">
            Envoyée
            <span className="ml-2 text-sm font-normal text-[var(--safe-text-secondary)]">
              ({envoyees.length})
            </span>
          </h3>
          <div className="space-y-3 max-h-[calc(100vh-300px)] overflow-y-auto">
            {envoyees.length === 0 ? (
              <p className="text-sm text-[var(--safe-text-secondary)] py-8 text-center">
                Aucune facture envoyée
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
