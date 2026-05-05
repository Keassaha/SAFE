"use client";

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
  envoyees: InvoiceWithRelations[];
  enRetard: InvoiceWithRelations[];
  cabinetId: string;
}

export function SuiviPipelineView({
  envoyees,
  enRetard,
  cabinetId,
}: SuiviPipelineViewProps) {
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceWithRelations | null>(null);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Envoyées : factures émises actives + payées (historique du pipeline) */}
        <div className="rounded-lg border border-[var(--safe-neutral-border)] bg-[var(--safe-neutral-50)] p-4">
          <h3 className="font-semibold text-[var(--safe-text-title)] mb-4">
            Envoyées
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

        {/* En retard : dérivé de dateEcheance < now sur factures émises non payées */}
        <div className="rounded-lg border border-[var(--safe-neutral-border)] bg-[var(--safe-neutral-50)] p-4">
          <h3 className="font-semibold text-[var(--safe-text-title)] mb-4">
            En retard
            <span className="ml-2 text-sm font-normal text-[var(--safe-text-secondary)]">
              ({enRetard.length})
            </span>
          </h3>
          <div className="space-y-3 max-h-[calc(100vh-300px)] overflow-y-auto">
            {enRetard.length === 0 ? (
              <p className="text-sm text-[var(--safe-text-secondary)] py-8 text-center">
                Aucune facture en retard
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
