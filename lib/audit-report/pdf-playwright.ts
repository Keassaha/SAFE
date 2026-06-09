/**
 * SAFE — Génération PDF headless
 *
 * Dev  → Playwright (Chromium local)
 * Prod → @sparticuz/chromium + puppeteer-core (compatible Vercel Fluid Compute)
 *
 * La route API appelle /audit/[id]/print en headless et retourne le buffer PDF.
 *
 * URL de base :
 *   - Dev  → http://localhost:PORT  (PORT = 3010 par défaut)
 *   - Prod → NEXTAUTH_URL (ex. https://safecabinet.ca)
 */

import type { Variant } from "@/types/audit-report";

/** Retourne l'URL de base de l'application selon l'environnement. */
function baseUrl(): string {
  if (process.env.NEXTAUTH_URL) {
    return process.env.NEXTAUTH_URL.replace(/\/$/, "");
  }
  const port = process.env.PORT ?? "3010";
  return `http://localhost:${port}`;
}

export interface PdfOptions {
  variant?: Variant;
  /** Timeout en ms (défaut : 30 000) */
  timeout?: number;
}

/**
 * Navigue vers `/audit/[id]/print` dans un navigateur headless
 * et retourne le buffer PDF (Letter, sans marges, avec fond).
 */
export async function renderAuditPrintToPdf(
  submissionId: string,
  opts: PdfOptions = {}
): Promise<Buffer> {
  const { variant = "cream", timeout = 30_000 } = opts;
  const url = `${baseUrl()}/audit/${submissionId}/print?variant=${variant}`;

  const isProduction = process.env.NODE_ENV === "production";

  if (isProduction) {
    // ── Production (Vercel Fluid Compute) ──────────────────────────────────
    // @sparticuz/chromium est un Chromium optimisé pour les environnements
    // serverless. Il télécharge le binaire depuis son CDN au 1er appel.
    const chromium = (await import("@sparticuz/chromium")).default;
    const puppeteer = (await import("puppeteer-core")).default;

    const executablePath = await chromium.executablePath();

    const browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath,
      headless: true,
    });

    try {
      const page = await browser.newPage();
      await page.setViewport({ width: 816, height: 1056 });
      await page.goto(url, { waitUntil: "networkidle0", timeout });

      // Force screen media — sinon @media print vide le contenu (Tailwind)
      await page.emulateMediaType("screen");

      const pdfBuffer = await page.pdf({
        format: "Letter",
        printBackground: true,
        margin: { top: "0", right: "0", bottom: "0", left: "0" },
      });

      return Buffer.from(pdfBuffer);
    } finally {
      await browser.close();
    }
  } else {
    // ── Développement local — Playwright ───────────────────────────────────
    const { chromium } = await import("playwright");
    const browser = await chromium.launch({ headless: true });

    try {
      const page = await browser.newPage();
      await page.setViewportSize({ width: 816, height: 1056 });
      await page.goto(url, { waitUntil: "networkidle", timeout });

      // Force screen media — sinon @media print vide le contenu (Tailwind)
      await page.emulateMedia({ media: "screen" });

      const pdfBuffer = await page.pdf({
        format: "Letter",
        printBackground: true,
        margin: { top: "0", right: "0", bottom: "0", left: "0" },
      });

      return Buffer.from(pdfBuffer);
    } finally {
      await browser.close();
    }
  }
}
