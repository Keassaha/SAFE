"use client";

import { useEffect, useRef, useState } from "react";
import type { PresentedInvoice } from "@/lib/services/billing/invoice-presenter";
import type { InvoiceLanguage } from "./InvoiceDocument";

/**
 * Wrapper client pour l'aperçu de la facture.
 *
 * IMPORTANT — pourquoi on n'utilise PAS `<PDFViewer>` / `usePDF` :
 *   `<PDFViewer>` appelle `instance.updateContainer()` de façon SYNCHRONE
 *   dans un `useEffect`. Le reconciler de react-pdf flush alors son rendu
 *   IMBRIQUÉ dans le commit de react-dom. Sous React 19.2, cet imbriquement
 *   corrompt l'état des « lanes » et fait entrer React dans la branche de
 *   commit « suspensey » dont la fonction hôte (`startSuspendingCommit`) est
 *   nulle → plantage « su is not a function ».
 *
 * Correctif : on rend le document en Blob via `pdf(...).toBlob()` depuis un
 * effet ASYNCHRONE (après un `await`), donc le travail du reconciler s'exécute
 * dans une micro-tâche DÉTACHÉE du commit react-dom (comme le rendu serveur
 * `toBuffer()`, qui fonctionne). On affiche le Blob dans une `<iframe>`.
 *
 * Doctrine préservée : c'est le MÊME composant `InvoiceDocument` et le MÊME
 * moteur de rendu que le PDF téléchargé → l'aperçu reste identique au PDF.
 */

interface InvoicePreviewProps {
  invoice: PresentedInvoice;
  language?: InvoiceLanguage;
  className?: string;
  /** Affiche la signature reproduite (option cochée par facture). */
  showSignature?: boolean;
}

function PreviewSkeleton({ label }: { label: string }) {
  return (
    <div className="w-full h-full min-h-[800px] bg-neutral-50 flex items-center justify-center text-sm text-neutral-400">
      {label}
    </div>
  );
}

export function InvoicePreview({
  invoice,
  language = "fr",
  className = "",
  showSignature = false,
}: InvoicePreviewProps) {
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Conserve l'URL objet courante pour la révoquer au changement / démontage.
  const urlRef = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function render() {
      try {
        setError(null);
        // L'`await` garantit que le rendu react-pdf s'exécute hors du commit
        // react-dom (micro-tâche détachée) → évite le bug « su is not a function ».
        const [{ pdf }, { InvoiceDocument }] = await Promise.all([
          import("@react-pdf/renderer"),
          import("./InvoiceDocument"),
        ]);
        if (cancelled) return;

        const blob = await pdf(
          <InvoiceDocument invoice={invoice} language={language} showSignature={showSignature} />,
        ).toBlob();
        if (cancelled) return;

        const nextUrl = URL.createObjectURL(blob);
        // Révoque l'ancienne URL avant de la remplacer.
        if (urlRef.current) URL.revokeObjectURL(urlRef.current);
        urlRef.current = nextUrl;
        setUrl(nextUrl);
      } catch (e) {
        if (cancelled) return;
        console.error("Échec du rendu de l'aperçu de facture", e);
        setError("Impossible de générer l'aperçu PDF.");
      }
    }

    void render();

    return () => {
      cancelled = true;
    };
  }, [invoice, language, showSignature]);

  // Nettoyage final : révoque l'URL objet au démontage.
  useEffect(() => {
    return () => {
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
      urlRef.current = null;
    };
  }, []);

  return (
    <div className={`w-full h-full min-h-[800px] ${className}`}>
      {error ? (
        <div className="w-full h-full min-h-[800px] bg-neutral-50 flex items-center justify-center text-sm text-red-500">
          {error}
        </div>
      ) : url ? (
        <iframe
          title="Aperçu de la facture"
          src={url}
          className="w-full h-full"
          style={{ border: "none", minHeight: 800 }}
        />
      ) : (
        <PreviewSkeleton label="Génération de l'aperçu PDF…" />
      )}
    </div>
  );
}
