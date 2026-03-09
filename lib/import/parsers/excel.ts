import readXlsxFile from "read-excel-file/browser";
import type { ParsedFile, RawRow } from "../types";

function isHeaderRow(cells: string[]): boolean {
  const nonEmpty = cells.filter((c) => c.trim() !== "");
  if (nonEmpty.length < 2) return false;
  const numericCount = nonEmpty.filter((c) => /^\d+([.,]\d+)?$/.test(c.trim())).length;
  const dateCount = nonEmpty.filter((c) => /^\d{4}-\d{2}-\d{2}/.test(c.trim())).length;
  return numericCount / nonEmpty.length < 0.4 && dateCount / nonEmpty.length < 0.4;
}

function cellToString(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value);
}

export async function parseExcelBuffer(buffer: ArrayBuffer, fileName: string): Promise<ParsedFile> {
  const rows = await readXlsxFile(buffer);
  if (rows.length === 0) throw new Error("Fichier Excel vide (aucune feuille).");

  const rawData: string[][] = rows.map((row) => row.map(cellToString));

  let headerRowIndex = 0;
  let titleRow: string | undefined;

  for (let i = 0; i < Math.min(rawData.length, 5); i++) {
    const row = rawData[i]!;
    if (isHeaderRow(row)) {
      headerRowIndex = i;
      if (i > 0) {
        titleRow = rawData[0]!.filter(Boolean).join(" ").trim();
      }
      break;
    }
  }

  const headerCells = rawData[headerRowIndex]!.map((c) => c.trim());
  const headers = headerCells.map((h, i) => h || `Colonne_${i + 1}`);

  const outRows: RawRow[] = [];
  for (let i = headerRowIndex + 1; i < rawData.length; i++) {
    const cells = rawData[i]!;
    const row: RawRow = {};
    let hasData = false;
    headers.forEach((h, j) => {
      const val = (cells[j] ?? "").trim();
      row[h] = val;
      if (val) hasData = true;
    });
    if (hasData) outRows.push(row);
  }

  return { fileName, headers, rows: outRows, titleRow, headerRowIndex };
}
