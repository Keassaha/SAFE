/**
 * Moteur de rendu des registres réglementaires.
 *
 * Un registre n'est conforme que s'il peut être PRODUIT :
 *   art. 30 B-1 r.5 — copies tirées « immédiatement, en tout temps »
 *   s. 21(2) By-Law 9 — « a paper copy […] may be produced promptly on request »
 *
 * Ce module transforme une définition de registre et ses lignes en trois sorties
 * portant EXACTEMENT les mêmes données : écran, CSV, et HTML imprimable. Elles
 * partagent le même formatage, donc un inspecteur qui compare l'export au document
 * imprimé ne trouve aucune divergence.
 *
 * L'empreinte SHA-256 en pied n'est exigée par aucun article. Elle sert à prouver
 * qu'une copie remise correspond bien au registre au moment de sa production, ce qui
 * répond à l'esprit de l'art. 30 (registres « permanents »). C'est dit ici pour que
 * personne ne la cite comme une exigence du Barreau.
 */

import { createHash } from "node:crypto";
import type { CabinetProvince } from "@/lib/compliance/rules";
import {
  getRegulatoryColumns,
  type RegisterColumn,
  type RegisterDefinition,
} from "@/lib/compliance/registers";

export type RegisterCell = string | number | boolean | Date | null | undefined;
export type RegisterRow = Record<string, RegisterCell>;

export interface RenderedRegister {
  definition: RegisterDefinition;
  province: CabinetProvince;
  /** En-tête : cabinet, compte, période. */
  header: {
    cabinetName: string;
    accountLabel: string | null;
    periodLabel: string;
    generatedAt: Date;
    generatedBy: string;
  };
  columns: RegisterColumn[];
  rows: RegisterRow[];
  /** Totaux des colonnes monétaires. */
  totals: Record<string, number>;
  rowCount: number;
  /** Empreinte du contenu rendu. Déterministe pour un même jeu de données. */
  fingerprint: string;
}

/* ════════════════════════════════════════════════════════════════
   FORMATAGE — une seule source pour les trois sorties
   ════════════════════════════════════════════════════════════════ */

/**
 * Formate une cellule. Volontairement unique et déterministe : c'est ce qui garantit
 * que le CSV, l'écran et l'impression portent la même chaîne, au caractère près.
 *
 * Les montants sont formatés sans séparateur de milliers ni symbole : un registre
 * comptable se lit et se recoupe, il ne se décore pas. Le CSV reste importable dans
 * un tableur sans retraitement.
 */
export function formatCell(value: RegisterCell, column: RegisterColumn): string {
  if (value === null || value === undefined) return "";
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (typeof value === "boolean") return value ? "Oui" : "";
  if (typeof value === "number") {
    return column.money ? value.toFixed(2) : String(value);
  }
  return String(value);
}

function sumMoneyColumns(columns: RegisterColumn[], rows: RegisterRow[]): Record<string, number> {
  const totals: Record<string, number> = {};
  for (const col of columns) {
    if (!col.money) continue;
    const sum = rows.reduce((acc, row) => {
      const v = row[col.key];
      return acc + (typeof v === "number" ? v : 0);
    }, 0);
    totals[col.key] = Math.round(sum * 100) / 100;
  }
  return totals;
}

/**
 * Empreinte du contenu.
 *
 * Calculée sur les données FORMATÉES, pas sur les objets bruts : c'est ce que
 * l'inspecteur lit. Exclut la date de génération, sinon deux productions du même
 * registre donneraient deux empreintes et la comparaison ne prouverait rien.
 */
export function computeFingerprint(params: {
  definition: RegisterDefinition;
  columns: RegisterColumn[];
  rows: RegisterRow[];
  periodLabel: string;
}): string {
  const lines: string[] = [
    params.definition.id,
    params.definition.reference,
    params.periodLabel,
    params.columns.map((c) => c.key).join(""),
  ];
  for (const row of params.rows) {
    lines.push(params.columns.map((c) => formatCell(row[c.key], c)).join(""));
  }
  return createHash("sha256").update(lines.join(""), "utf8").digest("hex");
}

export interface RenderRegisterParams {
  definition: RegisterDefinition;
  province: CabinetProvince;
  rows: RegisterRow[];
  cabinetName: string;
  accountLabel?: string | null;
  periodLabel: string;
  generatedBy: string;
  generatedAt?: Date;
  /** Ne conserver que les colonnes exigées par un article. */
  regulatoryColumnsOnly?: boolean;
}

/** Assemble un registre prêt à rendre. */
export function renderRegister(params: RenderRegisterParams): RenderedRegister {
  const columns = params.regulatoryColumnsOnly
    ? getRegulatoryColumns(params.definition)
    : params.definition.columns;

  return {
    definition: params.definition,
    province: params.province,
    header: {
      cabinetName: params.cabinetName,
      accountLabel: params.accountLabel ?? null,
      periodLabel: params.periodLabel,
      generatedAt: params.generatedAt ?? new Date(),
      generatedBy: params.generatedBy,
    },
    columns,
    rows: params.rows,
    totals: sumMoneyColumns(columns, params.rows),
    rowCount: params.rows.length,
    fingerprint: computeFingerprint({
      definition: params.definition,
      columns,
      rows: params.rows,
      periodLabel: params.periodLabel,
    }),
  };
}

/* ════════════════════════════════════════════════════════════════
   SORTIE CSV
   ════════════════════════════════════════════════════════════════ */

function csvEscape(value: string): string {
  if (/[",;\n\r]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

/**
 * Sortie CSV.
 *
 * L'en-tête réglementaire est repris en commentaire de tête : un fichier détaché de
 * son contexte ne prouve rien. On y met le registre, son article, le cabinet, le
 * compte, la période et l'empreinte.
 */
export function toCsv(rendered: RenderedRegister, locale: "fr" | "en" = "fr"): string {
  const label = (c: RegisterColumn) => (locale === "fr" ? c.labelFr : c.labelEn);
  const title = locale === "fr" ? rendered.definition.titleFr : rendered.definition.titleEn;

  const lines: string[] = [
    `# ${title}`,
    `# ${rendered.definition.reference}`,
    `# ${rendered.header.cabinetName}`,
    ...(rendered.header.accountLabel ? [`# ${rendered.header.accountLabel}`] : []),
    `# ${rendered.header.periodLabel}`,
    `# ${rendered.rowCount} ligne(s)`,
    `# SHA-256 ${rendered.fingerprint}`,
    "",
    rendered.columns.map((c) => csvEscape(label(c))).join(","),
  ];

  for (const row of rendered.rows) {
    lines.push(rendered.columns.map((c) => csvEscape(formatCell(row[c.key], c))).join(","));
  }

  // Ligne de totaux, alignée sur les mêmes colonnes.
  if (Object.keys(rendered.totals).length > 0) {
    lines.push(
      rendered.columns
        .map((c) => (c.money ? csvEscape((rendered.totals[c.key] ?? 0).toFixed(2)) : ""))
        .join(","),
    );
  }

  return lines.join("\n");
}

/* ════════════════════════════════════════════════════════════════
   SORTIE HTML IMPRIMABLE
   ════════════════════════════════════════════════════════════════ */

function htmlEscape(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * HTML prêt à imprimer.
 *
 * Pas de dépendance externe, pas de police distante : la copie doit pouvoir être
 * produite « en tout temps », y compris hors ligne. La pagination est confiée aux
 * règles `@page` du navigateur, avec répétition de l'en-tête de tableau sur chaque
 * page — sans quoi un registre de trente pages devient illisible.
 */
export function toPrintableHtml(rendered: RenderedRegister, locale: "fr" | "en" = "fr"): string {
  const label = (c: RegisterColumn) => (locale === "fr" ? c.labelFr : c.labelEn);
  const title = locale === "fr" ? rendered.definition.titleFr : rendered.definition.titleEn;
  const h = rendered.header;

  const head = rendered.columns
    .map((c) => `<th class="a-${c.align}">${htmlEscape(label(c))}${
      c.reference ? `<span class="ref">${htmlEscape(c.reference)}</span>` : ""
    }</th>`)
    .join("");

  const body = rendered.rows
    .map(
      (row) =>
        `<tr>${rendered.columns
          .map((c) => `<td class="a-${c.align}">${htmlEscape(formatCell(row[c.key], c))}</td>`)
          .join("")}</tr>`,
    )
    .join("");

  const foot =
    Object.keys(rendered.totals).length > 0
      ? `<tfoot><tr>${rendered.columns
          .map((c) =>
            c.money
              ? `<td class="a-right total">${(rendered.totals[c.key] ?? 0).toFixed(2)}</td>`
              : `<td></td>`,
          )
          .join("")}</tr></tfoot>`
      : "";

  const note = rendered.definition.noteFr
    ? `<p class="note">${htmlEscape(rendered.definition.noteFr)}</p>`
    : "";

  return `<!doctype html>
<html lang="${locale}">
<head>
<meta charset="utf-8">
<title>${htmlEscape(title)} — ${htmlEscape(h.periodLabel)}</title>
<style>
  @page { size: letter landscape; margin: 14mm 12mm 16mm; }
  * { box-sizing: border-box; }
  body { font: 10pt/1.35 "Times New Roman", Georgia, serif; color: #111; margin: 0; }
  header { border-bottom: 1.5pt solid #111; padding-bottom: 6pt; margin-bottom: 10pt; }
  h1 { font-size: 14pt; margin: 0 0 2pt; }
  .reference { font-size: 9pt; font-style: italic; }
  .meta { font-size: 9pt; margin-top: 4pt; }
  .meta span { margin-right: 14pt; }
  .note { font-size: 8.5pt; font-style: italic; margin: 0 0 8pt; }
  table { width: 100%; border-collapse: collapse; }
  thead { display: table-header-group; }
  th, td { border: 0.5pt solid #999; padding: 3pt 4pt; font-size: 9pt; vertical-align: top; }
  th { background: #eee; text-align: left; font-weight: bold; }
  th .ref { display: block; font-weight: normal; font-size: 7pt; font-style: italic; }
  tr { break-inside: avoid; }
  .a-left { text-align: left; } .a-right { text-align: right; } .a-center { text-align: center; }
  tfoot td { font-weight: bold; border-top: 1.5pt solid #111; }
  footer { margin-top: 10pt; font-size: 8pt; border-top: 0.5pt solid #999; padding-top: 4pt; }
  .fingerprint { font-family: "Courier New", monospace; word-break: break-all; }
</style>
</head>
<body>
<header>
  <h1>${htmlEscape(title)}</h1>
  <div class="reference">${htmlEscape(rendered.definition.reference)}</div>
  <div class="meta">
    <span>${htmlEscape(h.cabinetName)}</span>
    ${h.accountLabel ? `<span>${htmlEscape(h.accountLabel)}</span>` : ""}
    <span>${htmlEscape(h.periodLabel)}</span>
    <span>${rendered.rowCount} ligne(s)</span>
  </div>
</header>
${note}
<table>
  <thead><tr>${head}</tr></thead>
  <tbody>${body}</tbody>
  ${foot}
</table>
<footer>
  <div>Produit le ${h.generatedAt.toISOString().slice(0, 19).replace("T", " ")} par ${htmlEscape(h.generatedBy)}.</div>
  <div class="fingerprint">SHA-256 ${rendered.fingerprint}</div>
</footer>
</body>
</html>`;
}
