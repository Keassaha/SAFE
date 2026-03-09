"use client";

import { useCallback, useState } from "react";
import { exportJournalAction } from "@/app/(app)/journal/general/actions";
import type { JournalListParams } from "@/types/journal";

function downloadBlob(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function useJournalExport() {
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const exportCsv = useCallback(
    async (params: Omit<JournalListParams, "cabinetId">) => {
      setIsExporting(true);
      setError(null);
      try {
        const { blob, filename } = await exportJournalAction(params, "csv");
        downloadBlob(blob, filename, "text/csv;charset=utf-8");
        return true;
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erreur lors de l’export");
        return false;
      } finally {
        setIsExporting(false);
      }
    },
    []
  );

  return { exportCsv, isExporting, error };
}
