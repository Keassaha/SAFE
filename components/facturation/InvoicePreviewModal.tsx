"use client";

import { useState } from "react";
import type { Invoice, InvoiceLine } from "@prisma/client";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useRouter } from "next/navigation";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import { isInvoiceDraft, isInvoiceIssued, getInvoiceLifecycleCategory } from "@/lib/billing/invoice-status";
import { displayInvoiceNumero } from "@/lib/facturation/invoice-numero-format";

interface InvoicePreviewModalProps {
  invoice: Invoice & {
    client: { id: string; raisonSociale: string | null };
    dossier: { id: string; intitule: string } | null;
    invoiceLines: InvoiceLine[];
  };
  onClose: () => void;
  cabinetId: string;
}

export function InvoicePreviewModal({ invoice, onClose, cabinetId }: InvoicePreviewModalProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  // Doctrine: docs/accounting/INVOICE_STATUS_NORMALIZATION.md
  // Le label affiché est dérivé de la catégorie canonique pour rester
  // cohérent avec la vraie situation métier (invoiceStatus + paymentStatus).
  const isDraft = isInvoiceDraft(invoice);
  const isIssued = isInvoiceIssued(invoice);
  const getStatus = () => {
    const category = getInvoiceLifecycleCategory(invoice);
    switch (category) {
      case "draft": return "Brouillon";
      case "cancelled": return "Annulée";
      case "credited": return "Avoir émis";
      case "paid": return "Payée";
      case "overdue": return "En retard";
      case "partially_paid": return "Partiellement payée";
      case "issued_active": return "Envoyée";
    }
  };

  const handleValidate = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/facturation/factures/${invoice.id}/valider`, {
        method: "POST",
      });
      if (response.ok) {
        router.refresh();
        onClose();
      }
    } catch (error) {
      console.error("Erreur validation:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/facturation/factures/${invoice.id}/envoyer`, {
        method: "POST",
      });
      if (response.ok) {
        router.refresh();
        onClose();
      }
    } catch (error) {
      console.error("Erreur envoi:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleValidateAndSend = async () => {
    setIsLoading(true);
    try {
      const validateResponse = await fetch(`/api/facturation/factures/${invoice.id}/valider`, {
        method: "POST",
      });
      if (validateResponse.ok) {
        const sendResponse = await fetch(`/api/facturation/factures/${invoice.id}/envoyer`, {
          method: "POST",
        });
        if (sendResponse.ok) {
          router.refresh();
          onClose();
        }
      }
    } catch (error) {
      console.error("Erreur validation/envoi:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={`Facture ${displayInvoiceNumero(invoice.numero)} - ${getStatus()}`}
      maxWidth="max-w-2xl"
    >
      <div className="space-y-6">
        {/* Invoice Summary */}
        <div className="grid grid-cols-2 gap-4 pb-4 border-b">
          <div>
            <p className="text-xs text-[var(--safe-text-secondary)] mb-1">Client</p>
            <p className="font-semibold text-[var(--safe-text-title)]">
              {invoice.client.raisonSociale || "Sans client"}
            </p>
          </div>
          {invoice.dossier && (
            <div>
              <p className="text-xs text-[var(--safe-text-secondary)] mb-1">Dossier</p>
              <p className="font-semibold text-[var(--safe-text-title)]">{invoice.dossier.intitule}</p>
            </div>
          )}
          <div>
            <p className="text-xs text-[var(--safe-text-secondary)] mb-1">Date émission</p>
            <p className="font-semibold text-[var(--safe-text-title)]">
              {formatDate(invoice.dateEmission)}
            </p>
          </div>
          <div>
            <p className="text-xs text-[var(--safe-text-secondary)] mb-1">Date échéance</p>
            <p className="font-semibold text-[var(--safe-text-title)]">
              {formatDate(invoice.dateEcheance)}
            </p>
          </div>
        </div>

        {/* Totals */}
        <div className="space-y-2 py-4 border-b">
          <div className="flex justify-between text-sm">
            <span className="text-[var(--safe-text-secondary)]">Montant total:</span>
            <span className="font-semibold text-[var(--safe-text-title)]">
              {formatCurrency(invoice.montantTotal)}
            </span>
          </div>
          {invoice.balanceDue > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-[var(--safe-text-secondary)]">Reste à payer:</span>
              <span className="font-semibold text-orange-600">
                {formatCurrency(invoice.balanceDue)}
              </span>
            </div>
          )}
        </div>

        {/* Line Items Summary */}
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-[var(--safe-text-title)]">Lignes de facture</h4>
          <div className="text-xs text-[var(--safe-text-secondary)] space-y-1">
            <p>{invoice.invoiceLines.length} ligne(s) de facture</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 justify-end pt-4 border-t">
          <Button variant="secondary" onClick={onClose} disabled={isLoading}>
            Fermer
          </Button>

          {isDraft && (
            <>
              <Button variant="secondary" onClick={handleValidate} disabled={isLoading}>
                Valider
              </Button>
              <Button onClick={handleValidateAndSend} disabled={isLoading}>
                Valider & Envoyer
              </Button>
            </>
          )}

          {isIssued && (
            <Button variant="secondary" disabled={isLoading}>
              Voir détails
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}
