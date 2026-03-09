import type { ParsedFile, RawRow } from "../types";

export function parseCsvText(csvText: string, fileName: string): ParsedFile {
  const lines = csvText.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length === 0) throw new Error("Fichier CSV vide.");

  const headerLine = lines[0]!;
  const sep = headerLine.includes(";") ? ";" : headerLine.includes("\t") ? "\t" : ",";
  const headers = headerLine.split(sep).map((h) => h.replace(/^"|"$/g, "").trim());

  const rows: RawRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i]!.split(sep).map((p) => p.replace(/^"|"$/g, "").trim());
    const row: RawRow = {};
    let hasData = false;
    headers.forEach((h, j) => {
      const val = parts[j] ?? "";
      row[h] = val;
      if (val) hasData = true;
    });
    if (hasData) rows.push(row);
  }

  return { fileName, headers, rows, headerRowIndex: 0 };
}
