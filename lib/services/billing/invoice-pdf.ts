/**
 * SAFE — Génération du PDF officiel de facture.
 *
 * SOURCE UNIQUE du rendu : ce module ne fait que wrapper le composant
 * canonique `lib/invoice-template/InvoiceDocument.tsx` qui est utilisé
 * AUSSI à l'écran (via `<PDFViewer>` dans `lib/invoice-template/InvoicePreview.tsx`).
 *
 * Garantie : l'aperçu écran et le PDF téléchargé/envoyé par email
 * sont rendus à partir du même composant React, à la même version,
 * avec les mêmes design tokens. Aucune divergence possible.
 */

import { pdf } from "@react-pdf/renderer";
import * as React from "react";
import type { PresentedInvoice } from "./invoice-presenter";
import { InvoiceDocument } from "@/lib/invoice-template/InvoiceDocument";

/**
 * Génère le PDF officiel d'une facture présentée.
 * @returns Buffer PDF (utilisable comme attachment dans `sendEmail` ou
 *          réponse HTTP côté route /api/.../pdf).
 */
export async function generateInvoicePdf(data: PresentedInvoice): Promise<Buffer> {
  // La langue de la facture pourrait être lue depuis Cabinet.config plus tard.
  // Pour l'instant : français par défaut (cabinets canadiens — Derisier ON).
  const doc = React.createElement(InvoiceDocument, { invoice: data, language: "fr" });
  const stream = await pdf(doc as never).toBuffer();
  return await streamToBuffer(stream);
}

/** Format "facture-2026-001.pdf". */
export function invoicePdfFilename(data: PresentedInvoice): string {
  const safeNumero = data.numero.replace(/[^a-zA-Z0-9_-]/g, "");
  return `facture-${safeNumero || "sans-numero"}.pdf`;
}

function streamToBuffer(stream: NodeJS.ReadableStream): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    stream.on("data", (chunk: Buffer | string) => {
      chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
    });
    stream.on("end", () => resolve(Buffer.concat(chunks)));
    stream.on("error", reject);
  });
}
