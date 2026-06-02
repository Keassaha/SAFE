"use client";

import { InvoicePreview } from "@/lib/invoice-template/InvoicePreview";
import type { PresentedInvoice } from "@/lib/services/billing/invoice-presenter";

interface FactureClientViewProps {
  invoice: PresentedInvoice;
}

/**
 * Vue publique de la facture (lien partagé envoyé au client par email).
 *
 * Rend strictement le même aperçu que l'écran cabinet et que le PDF
 * téléchargé : `InvoicePreview` → `InvoiceDocument`. Aucune divergence
 * possible — source unique de rendu.
 */
export function FactureClientView({ invoice }: FactureClientViewProps) {
  return (
    <div className="w-full h-[1100px]">
      <InvoicePreview invoice={invoice} language="fr" />
    </div>
  );
}
