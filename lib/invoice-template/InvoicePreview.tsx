"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { PDFViewer } from "@react-pdf/renderer";
import type { PresentedInvoice } from "@/lib/services/billing/invoice-presenter";
import type { InvoiceLanguage } from "./InvoiceDocument";

/**
 * Wrapper client pour `<InvoiceDocument>` rendu en aperçu.
 *
 * Utilise `<PDFViewer>` de `@react-pdf/renderer` qui rend le document
 * dans une iframe PDF. Garantit que le rendu UI est BIT-A-BIT identique
 * au PDF téléchargé — c'est la même implémentation à la sortie binaire.
 *
 * Doctrine : le composant `InvoiceDocument` ne doit JAMAIS être importé
 * directement par un composant "use client" (PDFViewer dépend de l'env
 * navigateur). Toujours passer par ce wrapper.
 */

const InvoiceDocumentLazy = dynamic(
  async () => {
    const mod = await import("./InvoiceDocument");
    return mod.InvoiceDocument;
  },
  { ssr: false },
);

function PreviewSkeleton() {
  return (
    <div className="w-full h-full min-h-[800px] bg-neutral-50 flex items-center justify-center text-sm text-neutral-400">
      Génération de l&apos;aperçu PDF…
    </div>
  );
}

interface InvoicePreviewProps {
  invoice: PresentedInvoice;
  language?: InvoiceLanguage;
  className?: string;
}

export function InvoicePreview({ invoice, language = "fr", className = "" }: InvoicePreviewProps) {
  // `PDFViewer` est une API strictement navigateur : elle lève une exception si
  // elle est évaluée pendant le SSR (Next pré-rend aussi les composants client).
  // On ne la monte donc qu'après l'hydratation côté client.
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className={`w-full h-full min-h-[800px] ${className}`}>
        <PreviewSkeleton />
      </div>
    );
  }

  return (
    <div className={`w-full h-full min-h-[800px] ${className}`}>
      <PDFViewer
        width="100%"
        height="100%"
        showToolbar={false}
        style={{ border: "none", minHeight: 800 }}
      >
        <InvoiceDocumentLazy invoice={invoice} language={language} />
      </PDFViewer>
    </div>
  );
}
