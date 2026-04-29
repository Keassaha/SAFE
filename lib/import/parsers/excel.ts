import readXlsxFile, { readSheetNames } from "read-excel-file/browser";
import type { ParsedFile, RawRow } from "../types";

const HEADER_SCAN_DEPTH = 10;
const SUMMARY_PATTERNS = [
  /^total\b/i,
  /^totaux\b/i,
  /^sub[\s-]?total\b/i,
  /^sous[\s-]?total\b/i,
  /^report\b/i,
  /^carry[\s-]?forward\b/i,
  /^solde\s+d['’]ouverture\b/i,
  /^opening\s+balance\b/i,
  /^solde\s+de\s+cl[oô]ture\b/i,
  /^closing\s+balance\b/i,
  /^grand\s+total\b/i,
];

const COMMENT_PATTERNS = [/^#\s*/, /^\/\/\s*/, /^note\s*:/i];

const ACCOUNTING_HINT_HEADERS = [
  /\bd[ée]bit\b/i,
  /\bcr[ée]dit\b/i,
  /\bcompte\b/i,
  /\baccount\b/i,
  /\bjournal\b/i,
  /\bsource\s*module\b/i,
  /\btype\s*transaction\b/i,
];

function isHeaderRow(cells: string[]): boolean {
  const nonEmpty = cells.filter((c) => c.trim() !== "");
  if (nonEmpty.length < 2) return false;
  const numericCount = nonEmpty.filter((c) => /^-?\d+([.,]\d+)?$/.test(c.trim())).length;
  const dateCount = nonEmpty.filter((c) => /^\d{4}-\d{2}-\d{2}/.test(c.trim())).length;
  // Une bonne ligne d'entête est plutôt textuelle, pas une rangée de chiffres ou de dates.
  return numericCount / nonEmpty.length < 0.4 && dateCount / nonEmpty.length < 0.4;
}

function cellToString(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value);
}

function isBlankRow(cells: string[]): boolean {
  return cells.every((c) => c == null || String(c).trim() === "");
}

function isSummaryRow(cells: string[]): boolean {
  // On considère "summary" si la 1ère cellule textuelle correspond à un pattern connu.
  const firstText = cells.find((c) => c && /[A-Za-zÀ-ÿ]/.test(c));
  if (!firstText) return false;
  return SUMMARY_PATTERNS.some((re) => re.test(firstText.trim()));
}

function isCommentRow(cells: string[]): boolean {
  const first = (cells[0] ?? "").trim();
  if (!first) return false;
  return COMMENT_PATTERNS.some((re) => re.test(first));
}

function fingerprintRow(rowText: string, sheetName: string): string {
  // Hash simple stable (FNV-1a 32 bits) — déterministe entre deux imports du même fichier.
  let h = 0x811c9dc5;
  const seed = `${sheetName}::${rowText}`;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0;
  }
  return h.toString(16).padStart(8, "0");
}

function scoreSheetForAccounting(rows: string[][]): number {
  // On regarde les 15 premières lignes non vides à la recherche de hints comptables
  // dans n'importe quelle cellule.
  const peek = rows.slice(0, 15).flat();
  let score = 0;
  for (const cell of peek) {
    if (!cell) continue;
    const c = String(cell);
    for (const re of ACCOUNTING_HINT_HEADERS) {
      if (re.test(c)) {
        score++;
        break;
      }
    }
  }
  // Bonus si la feuille a au moins une vingtaine de lignes utiles.
  const dataRows = rows.filter((r) => r.some((c) => c && String(c).trim() !== "")).length;
  if (dataRows >= 20) score += 2;
  if (dataRows >= 100) score += 2;
  return score;
}

async function pickSheet(buffer: ArrayBuffer): Promise<{ sheet: string; available: string[] }> {
  let sheets: string[] = [];
  try {
    sheets = await readSheetNames(buffer);
  } catch {
    sheets = [];
  }
  if (sheets.length <= 1) {
    return { sheet: sheets[0] ?? "Sheet1", available: sheets };
  }

  // Pour chaque feuille, on échantillonne et on garde la meilleure pour la comptabilité.
  let bestIdx = 0;
  let bestScore = -1;
  const scores: number[] = [];
  for (let i = 0; i < sheets.length; i++) {
    try {
      const rows = await readXlsxFile(buffer, { sheet: i + 1 });
      const stringRows = rows.map((r) => r.map(cellToString));
      const s = scoreSheetForAccounting(stringRows);
      scores.push(s);
      if (s > bestScore) {
        bestScore = s;
        bestIdx = i;
      }
    } catch {
      scores.push(0);
    }
  }
  // Si toutes les feuilles ont 0, on retombe sur la première.
  return { sheet: sheets[bestIdx]!, available: sheets };
}

export async function parseExcelBuffer(buffer: ArrayBuffer, fileName: string): Promise<ParsedFile> {
  const { sheet: chosenSheet, available } = await pickSheet(buffer);

  const rows = await readXlsxFile(buffer, available.length > 1 ? { sheet: chosenSheet } : undefined);
  if (rows.length === 0) throw new Error("Fichier Excel vide (aucune feuille).");

  const rawData: string[][] = rows.map((row) => row.map(cellToString));

  // Détection de l'entête sur les HEADER_SCAN_DEPTH premières lignes (au lieu de 5).
  let headerRowIndex = 0;
  let titleRow: string | undefined;

  for (let i = 0; i < Math.min(rawData.length, HEADER_SCAN_DEPTH); i++) {
    const row = rawData[i]!;
    if (isHeaderRow(row)) {
      headerRowIndex = i;
      if (i > 0) {
        // Concatène tout ce qui précède l'entête dans titleRow pour aider la classification
        // (souvent c'est "Relevé de compte / Septembre 2025 / Banque X").
        titleRow = rawData
          .slice(0, i)
          .map((r) => r.filter(Boolean).join(" "))
          .filter(Boolean)
          .join(" | ")
          .trim();
      }
      break;
    }
  }

  const headerCells = rawData[headerRowIndex]!.map((c) => c.trim());
  const headers = headerCells.map((h, i) => h || `Colonne_${i + 1}`);

  const outRows: RawRow[] = [];
  let ignoredCount = 0;

  for (let i = headerRowIndex + 1; i < rawData.length; i++) {
    const cells = rawData[i]!;
    if (isBlankRow(cells)) {
      ignoredCount++;
      continue;
    }

    const rowText = cells.map((c) => c.trim()).filter(Boolean).join(" | ");
    const summary = isSummaryRow(cells);
    const comment = isCommentRow(cells);
    const kind = comment ? "comment" : summary ? "summary" : "data";

    const row: RawRow = {};
    let hasData = false;
    headers.forEach((h, j) => {
      const val = (cells[j] ?? "").trim();
      row[h] = val;
      if (val) hasData = true;
    });
    if (!hasData) {
      ignoredCount++;
      continue;
    }

    row.__sheetName = chosenSheet;
    row.__sourceRowIndex = String(i + 1); // 1-based comme dans Excel
    row.__rawRowText = rowText;
    row.__rowFingerprint = fingerprintRow(rowText, chosenSheet);
    row.__sourceRowKind = kind;

    outRows.push(row);
  }

  return {
    fileName,
    headers,
    rows: outRows,
    titleRow,
    headerRowIndex,
    sheetName: chosenSheet,
    availableSheets: available.length > 1 ? available : undefined,
    ignoredCount,
  };
}
