"use client";

import dynamic from "next/dynamic";
import type { PresentedInvoice } from "@/lib/services/billing/invoice-presenter";
import type { InvoiceLanguage } from "./InvoiceDocument";

/**
 * API publique de l'aperçu facture — wrapper SSR-safe.
 *
 * Doctrine :
 *   - SOURCE UNIQUE de rendu : importe `InvoicePreviewClient` qui rend
 *     `<InvoiceDocument>` via `<PDFViewer>`. C'est strictement le même
 *     composant que celui utilisé pour générer le PDF officiel envoyé au
 *     client (`generateInvoicePdf` dans `lib/services/billing/invoice-pdf.ts`).
 *     Garantie : preview UI === PDF téléchargé / emailé, à la version binaire.
 *
 *   - SSR-safe : `<PDFViewer>` est strictement browser-only (canvas/iframe).
 *     `next/dynamic` avec `ssr: false` diffère le chargement au navigateur,
 *     évitant l'erreur « PDFViewer is a web specific API » côté Node.
 *
 *   - Utilisable depuis un Server Component sans précaution : le wrapper
 *     gère lui-même la SSR-safety. Importez directement `InvoicePreview`.
 */

export interface InvoicePreviewProps {
  invoice: PresentedInvoice;
  language?: InvoiceLanguage;
  className?: string;
}

const InvoicePreviewLazy = dynamic(
  () => import("./InvoicePreviewClient").then((m) => m.InvoicePreviewClient),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full min-h-[800px] animate-pulse bg-neutral-100 rounded-safe" />
    ),
  },
);

export function InvoicePreview(props: InvoicePreviewProps) {
  return <InvoicePreviewLazy {...props} />;
}
