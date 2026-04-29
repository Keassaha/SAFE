import type { ParsedFile, RawRow } from "../types";

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
];

function isSummary(firstCell: string): boolean {
  const v = firstCell.trim();
  if (!v) return false;
  return SUMMARY_PATTERNS.some((re) => re.test(v));
}

function fingerprintRow(rowText: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < rowText.length; i++) {
    h ^= rowText.charCodeAt(i);
    h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0;
  }
  return h.toString(16).padStart(8, "0");
}

export function parseCsvText(csvText: string, fileName: string): ParsedFile {
  // On garde toutes les lignes (y compris vides) le temps de calculer un index source fidèle.
  const allLines = csvText.split(/\r?\n/);
  const nonEmpty = allLines
    .map((line, idx) => ({ line, idx }))
    .filter(({ line }) => line.trim() !== "");

  if (nonEmpty.length === 0) throw new Error("Fichier CSV vide.");

  const headerEntry = nonEmpty[0]!;
  const headerLine = headerEntry.line;
  const sep = headerLine.includes(";") ? ";" : headerLine.includes("\t") ? "\t" : ",";
  const headers = headerLine.split(sep).map((h) => h.replace(/^"|"$/g, "").trim());

  const rows: RawRow[] = [];
  let ignoredCount = 0;
  for (let i = 1; i < nonEmpty.length; i++) {
    const { line, idx: srcIdx } = nonEmpty[i]!;
    const parts = line.split(sep).map((p) => p.replace(/^"|"$/g, "").trim());
    const rowText = parts.filter(Boolean).join(" | ");
    const row: RawRow = {};
    let hasData = false;
    headers.forEach((h, j) => {
      const val = parts[j] ?? "";
      row[h] = val;
      if (val) hasData = true;
    });
    if (!hasData) {
      ignoredCount++;
      continue;
    }

    row.__sourceRowIndex = String(srcIdx + 1);
    row.__rawRowText = rowText;
    row.__rowFingerprint = fingerprintRow(rowText);
    row.__sourceRowKind = isSummary(parts[0] ?? "") ? "summary" : "data";

    rows.push(row);
  }

  return {
    fileName,
    headers,
    rows,
    headerRowIndex: 0,
    ignoredCount,
  };
}
