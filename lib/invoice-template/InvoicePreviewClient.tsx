"use client";

import { PDFViewer } from "@react-pdf/renderer";
import { InvoiceDocument } from "./InvoiceDocument";
import type { InvoicePreviewProps } from "./InvoicePreview";

/**
 * Implémentation interne de l'aperçu — ne PAS importer directement.
 *
 * Utilise `<PDFViewer>` de `@react-pdf/renderer` qui rend le document
 * dans une iframe PDF. Garantit que le rendu UI est BIT-A-BIT identique
 * au PDF téléchargé — c'est la même implémentation à la sortie binaire.
 *
 * IMPORTANT : `<InvoiceDocument>` doit être importé statiquement (pas via
 * `next/dynamic`). Le reconciler de react-pdf ne sait pas traverser un
 * wrapper lazy et lève "su is not a function" si on lui en passe un.
 *
 * Le wrapper public `./InvoicePreview.tsx` se charge du SSR-safe loading
 * via `next/dynamic` avec `ssr: false` (PDFViewer est browser-only).
 */

export function InvoicePreviewClient({ invoice, language = "fr", className = "" }: InvoicePreviewProps) {
  return (
    <div className={`w-full h-full min-h-[800px] ${className}`}>
      <PDFViewer
        width="100%"
        height="100%"
        showToolbar={false}
        style={{ border: "none", minHeight: 800 }}
      >
        <InvoiceDocument invoice={invoice} language={language} />
      </PDFViewer>
    </div>
  );
}

export default InvoicePreviewClient;
