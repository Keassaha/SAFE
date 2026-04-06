"use client";

import { useState } from "react";
import { FileDown, FileSpreadsheet, FileText } from "lucide-react";

type ExportFormat = "csv" | "xlsx" | "pdf";

interface ExportButtonsProps {
  sectionId: string;
  sectionTitle: string;
  /** Données à exporter (tableau d’objets pour CSV/Excel) */
  data: Record<string, unknown>[];
  /** En-têtes pour CSV/Excel : [clé, libellé affiché] */
  columns: { key: string; header: string }[];
  /** Nom du fichier sans extension */
  filenamePrefix: string;
}

function escapeCsvCell(value: unknown): string {
  if (value == null) return "";
  const s = String(value);
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function downloadCsv(data: Record<string, unknown>[], columns: { key: string; header: string }[], filename: string) {
  const headers = columns.map((c) => escapeCsvCell(c.header)).join(",");
  const rows = data.map((row) =>
    columns.map((c) => escapeCsvCell((row as Record<string, unknown>)[c.key])).join(",")
  );
  const csv = [headers, ...rows].join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function ExportButtons({
  sectionId,
  sectionTitle,
  data,
  columns,
  filenamePrefix,
}: ExportButtonsProps) {
  const [exporting, setExporting] = useState<ExportFormat | null>(null);

  const handleCsv = () => {
    setExporting("csv");
    try {
      const flatData = data.map((row) => {
        const out: Record<string, unknown> = {};
        for (const col of columns) {
          out[col.header] = (row as Record<string, unknown>)[col.key];
        }
        return out;
      });
      const flatCols = columns.map((c) => ({ key: c.header, header: c.header }));
      downloadCsv(flatData, flatCols, `${filenamePrefix}-${new Date().toISOString().slice(0, 10)}`);
    } finally {
      setExporting(null);
    }
  };

  const handleExcel = () => {
    setExporting("xlsx");
    try {
      const flatData = data.map((row) => {
        const out: Record<string, unknown> = {};
        for (const col of columns) {
          const v = (row as Record<string, unknown>)[col.key];
          out[col.header] = v instanceof Date ? v.toISOString().slice(0, 10) : v;
        }
        return out;
      });
      const flatCols = columns.map((c) => ({ key: c.header, header: c.header }));
      downloadCsv(flatData, flatCols, `${filenamePrefix}-${new Date().toISOString().slice(0, 10)}`);
    } finally {
      setExporting(null);
    }
  };

  const handlePdf = () => {
    setExporting("pdf");
    try {
      window.print();
    } finally {
      setExporting(null);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Exporter le rapport">
      <button
        type="button"
        onClick={handleCsv}
        disabled={exporting !== null}
        className="inline-flex items-center gap-2 px-3 py-2 rounded-safe-sm border border-[var(--safe-neutral-border)] bg-white/90 safe-text-title text-sm font-medium hover:bg-neutral-50 transition-colors disabled:opacity-50"
      >
        <FileDown className="w-4 h-4" aria-hidden />
        CSV
      </button>
      <button
        type="button"
        onClick={handleExcel}
        disabled={exporting !== null}
        className="inline-flex items-center gap-2 px-3 py-2 rounded-safe-sm border border-[var(--safe-neutral-border)] bg-white/90 safe-text-title text-sm font-medium hover:bg-neutral-50 transition-colors disabled:opacity-50"
      >
        <FileSpreadsheet className="w-4 h-4" aria-hidden />
        Excel
      </button>
      <button
        type="button"
        onClick={handlePdf}
        disabled={exporting !== null}
        className="inline-flex items-center gap-2 px-3 py-2 rounded-safe-sm border border-[var(--safe-neutral-border)] bg-white/90 safe-text-title text-sm font-medium hover:bg-neutral-50 transition-colors disabled:opacity-50"
      >
        <FileText className="w-4 h-4" aria-hidden />
        PDF
      </button>
    </div>
  );
}
