/**
 * Rend un document HTML autonome en PDF, via le Chromium de Playwright.
 *
 * Sert aux documents opposables remis aux cabinets : bilan de conformité, rapport
 * d'audit, description produit. Le HTML source reste dans le dépôt à côté du PDF,
 * pour que le document se corrige et se regénère au lieu de se refaire.
 *
 * ⚠️ LE LOGO N'EST JAMAIS RECOPIÉ. Les formes vivent uniquement dans
 * `components/brand/safe-mark.ts` (règle dure, CLAUDE.md). Ce script les IMPORTE et
 * remplace le marqueur `<!--SAFE_MARK-->` du gabarit. Un `path` recopié dans un HTML
 * dériverait de la marque au premier ajustement de la charte.
 *
 *   npx tsx scripts/render-doc-pdf.ts <source.html> <sortie.pdf> ["pied de page"]
 */
import { chromium } from "playwright";
import path from "node:path";
import fs from "node:fs";
import {
  ASSEMBLY_PIECE_A_PATH,
  ASSEMBLY_PIECE_B_PATH,
  MARK_VIEWBOX,
} from "../components/brand/safe-mark";

const [src, out, pied = ""] = process.argv.slice(2);

if (!src || !out) {
  console.error('Usage : npx tsx scripts/render-doc-pdf.ts <source.html> <sortie.pdf> ["pied"]');
  process.exit(1);
}
if (!fs.existsSync(src)) {
  console.error(`Source introuvable : ${src}`);
  process.exit(1);
}

/** Le mark à la couleur du texte courant, comme dans le rapport d'audit. */
function markSvg(size: number): string {
  return (
    `<svg width="${size}" height="${size}" viewBox="${MARK_VIEWBOX}" ` +
    `fill="currentColor" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">` +
    `<path d="${ASSEMBLY_PIECE_A_PATH}"/><path d="${ASSEMBLY_PIECE_B_PATH}"/></svg>`
  );
}

const html = fs.readFileSync(src, "utf-8").replaceAll("<!--SAFE_MARK-->", markSvg(20));

const tmp = path.join(path.dirname(path.resolve(src)), `.rendu-${path.basename(src)}`);
fs.writeFileSync(tmp, html, "utf-8");

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto("file://" + tmp, { waitUntil: "networkidle" });

  await page.pdf({
    path: out,
    // `preferCSSPageSize` laisse chaque document choisir son format via @page.
    // Le bilan A4 et le carrousel LinkedIn 1080x1350 vivent ainsi côte à côte.
    preferCSSPageSize: true,
    printBackground: true,
    displayHeaderFooter: Boolean(pied),
    headerTemplate: "<div></div>",
    footerTemplate: pied
      ? `<div style="width:100%;font-family:ui-monospace,Menlo,monospace;font-size:7pt;color:rgba(22,59,46,0.5);padding:0 16mm;display:flex;justify-content:space-between;"><span>${pied}</span><span class="pageNumber"></span></div>`
      : "<div></div>",
    margin: { top: "16mm", bottom: "16mm", left: "16mm", right: "16mm" },
  });

  await browser.close();
  fs.unlinkSync(tmp);
  console.log(`PDF écrit : ${out} (${(fs.statSync(out).size / 1024).toFixed(0)} ko)`);
}

main();
