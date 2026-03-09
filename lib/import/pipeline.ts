import { parseExcelBuffer } from "./parsers/excel";
import { parseCsvText } from "./parsers/csv";
import { classifyDocument } from "./classify";
import { detectColumns, getFieldLabels } from "./detect-columns";
import { normalizeClientRow } from "./normalizers/client";
import { normalizeTimeEntryRow } from "./normalizers/time-entry";
import { normalizeBankRow } from "./normalizers/bank-statement";
import type {
  ParsedFile,
  DocumentType,
  ClassificationResult,
  ColumnMapping,
  NormalizedRow,
  PreviewResult,
} from "./types";

export type AnalysisResult = {
  parsed: ParsedFile;
  classification: ClassificationResult;
  mapping: ColumnMapping;
  fieldLabels: Record<string, string>;
};

export async function parseFile(
  buffer: ArrayBuffer | string,
  fileName: string,
): Promise<ParsedFile> {
  const ext = fileName.split(".").pop()?.toLowerCase() ?? "";
  if (ext === "xlsx") {
    if (typeof buffer === "string") throw new Error("Excel nécessite un ArrayBuffer");
    return parseExcelBuffer(buffer, fileName);
  }
  if (ext === "xls") {
    throw new Error(
      "Le format .xls (Excel 97-2003) n’est pas pris en charge pour des raisons de sécurité. Enregistrez le fichier au format .xlsx puis réessayez.",
    );
  }
  if (ext === "csv" || ext === "txt") {
    const text = typeof buffer === "string" ? buffer : new TextDecoder().decode(buffer);
    return parseCsvText(text, fileName);
  }
  throw new Error(`Format non supporté : .${ext}. Formats acceptés : .xlsx, .csv, .txt`);
}

export async function analyzeFile(
  buffer: ArrayBuffer | string,
  fileName: string,
): Promise<AnalysisResult> {
  const parsed = await parseFile(buffer, fileName);
  const classification = classifyDocument(fileName, parsed.headers, parsed.titleRow);
  const mapping = detectColumns(parsed.headers, classification.type);
  const fieldLabels = getFieldLabels(classification.type);
  return { parsed, classification, mapping, fieldLabels };
}

export function normalizeRows(
  rows: ParsedFile["rows"],
  type: DocumentType,
  mapping: ColumnMapping,
): NormalizedRow[] {
  return rows.map((row, i) => {
    switch (type) {
      case "registre_clients":
        return normalizeClientRow(row, mapping, i);
      case "fiches_temps":
        return normalizeTimeEntryRow(row, mapping, i);
      case "releve_bancaire":
        return normalizeBankRow(row, mapping, i);
    }
  });
}

export function generatePreview(
  parsed: ParsedFile,
  type: DocumentType,
  mapping: ColumnMapping,
  maxRows = 50,
): PreviewResult {
  const previewRows = parsed.rows.slice(0, maxRows);
  const normalized = normalizeRows(previewRows, type, mapping);
  const validCount = normalized.filter((r) => r.errors.length === 0).length;
  const errorCount = normalized.filter((r) => r.errors.length > 0).length;

  return {
    fileName: parsed.fileName,
    documentType: type,
    totalRows: parsed.rows.length,
    mapping,
    preview: normalized,
    validCount,
    errorCount,
  };
}
