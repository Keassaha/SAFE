/**
 * Export du journal général (CSV, Excel, PDF).
 * Utilise les mêmes filtres que getJournalEntries.
 */

import type { JournalSourceModule, JournalTransactionType } from "@prisma/client";
import { getJournalEntries } from "./journal-service";
import type { JournalListParams } from "@/types/journal";
import { JOURNAL_SOURCE_MODULE_LABELS, JOURNAL_TRANSACTION_TYPE_LABELS } from "@/types/journal";
import { formatCurrency, formatDate } from "@/lib/utils/format";

export type ExportFormat = "csv" | "excel" | "pdf";

/** Génère le contenu CSV du journal (UTF-8 avec BOM pour Excel). */
export async function exportJournalCsv(params: JournalListParams): Promise<string> {
  const { entries } = await getJournalEntries({
    ...params,
    pageSize: 10000,
    orderBy: "dateTransaction",
    orderDir: "asc",
  });

  const headers = [
    "Date",
    "Type",
    "Référence",
    "Client",
    "Dossier",
    "Description",
    "Catégorie",
    "Entrée",
    "Sortie",
    "Solde",
    "Source",
    "Utilisateur",
  ];

  const rows = entries.map((e) => [
    formatDate(e.dateTransaction),
    JOURNAL_TRANSACTION_TYPE_LABELS[e.typeTransaction],
    e.reference ?? "",
    e.clientName ?? "",
    e.dossierLabel ?? "",
    escapeCsv(e.description),
    e.categorie ?? "",
    e.montantEntree > 0 ? e.montantEntree.toFixed(2) : "",
    e.montantSortie > 0 ? e.montantSortie.toFixed(2) : "",
    e.solde.toFixed(2),
    JOURNAL_SOURCE_MODULE_LABELS[e.sourceModule],
    e.utilisateurName ?? "",
  ]);

  const BOM = "\uFEFF";
  const csvContent =
    BOM +
    [headers.join(";"), ...rows.map((r) => r.join(";"))].join("\r\n");
  return csvContent;
}

function escapeCsv(value: string): string {
  if (/[;\r\n"]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/** Génère les lignes pour export Excel (structure simple, consommable par xlsx). */
export async function exportJournalExcelRows(
  params: JournalListParams
): Promise<{ headers: string[]; rows: string[][] }> {
  const { entries } = await getJournalEntries({
    ...params,
    pageSize: 10000,
    orderBy: "dateTransaction",
    orderDir: "asc",
  });

  const headers = [
    "Date",
    "Type",
    "Référence",
    "Client",
    "Dossier",
    "Description",
    "Catégorie",
    "Entrée",
    "Sortie",
    "Solde",
    "Source",
    "Utilisateur",
  ];

  const rows = entries.map((e) => [
    formatDate(e.dateTransaction),
    JOURNAL_TRANSACTION_TYPE_LABELS[e.typeTransaction],
    e.reference ?? "",
    e.clientName ?? "",
    e.dossierLabel ?? "",
    e.description,
    e.categorie ?? "",
    e.montantEntree.toString(),
    e.montantSortie.toString(),
    e.solde.toString(),
    JOURNAL_SOURCE_MODULE_LABELS[e.sourceModule],
    e.utilisateurName ?? "",
  ]);

  return { headers, rows };
}
