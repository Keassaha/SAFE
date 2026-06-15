/**
 * Sérialisation CSV de l'export comptable, par format cible. Module PUR.
 *
 * Les trois logiciels acceptent un import de journal en CSV avec des en-têtes
 * proches mais distincts. On produit les mêmes données (lignes double-entrée)
 * avec l'en-tête attendu par chaque cible. Selon la version du logiciel, un léger
 * ajustement de colonnes peut rester nécessaire ; le mappage de comptes
 * (account-mapping) reste la source de vérité.
 */

import type { AccountingExportLine } from "./build-export";

export type AccountingExportFormat = "generic" | "quickbooks" | "xero" | "sage";

function escapeCsv(value: string): string {
  if (/[;,\r\n"]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function fmt(n: number): string {
  return n > 0 ? n.toFixed(2) : "";
}

interface FormatSpec {
  /** Séparateur de colonnes. */
  sep: string;
  /** En-têtes. */
  headers: string[];
  /** Construit une ligne de valeurs à partir d'une ligne d'export. */
  row: (l: AccountingExportLine) => string[];
}

const FORMATS: Record<AccountingExportFormat, FormatSpec> = {
  // Générique / Sage-like : explicite, point-virgule (Excel FR).
  generic: {
    sep: ";",
    headers: ["Date", "Code compte", "Compte", "Débit", "Crédit", "Description", "Référence", "Tiers"],
    row: (l) => [l.date, l.accountCode, l.accountName, fmt(l.debit), fmt(l.credit), l.memo, l.reference, l.name],
  },
  sage: {
    sep: ";",
    headers: ["Date", "Compte", "Libellé", "Débit", "Crédit", "Référence"],
    row: (l) => [l.date, l.accountCode, l.memo || l.accountName, fmt(l.debit), fmt(l.credit), l.reference],
  },
  // QuickBooks Online — import de journal général.
  quickbooks: {
    sep: ",",
    headers: ["Date", "Account", "Debit", "Credit", "Memo", "Name"],
    row: (l) => [l.date, l.accountName, fmt(l.debit), fmt(l.credit), l.memo, l.name],
  },
  // Xero — écriture manuelle.
  xero: {
    sep: ",",
    headers: ["Date", "Description", "AccountCode", "Debit", "Credit", "Reference"],
    row: (l) => [l.date, l.memo || l.accountName, l.accountCode, fmt(l.debit), fmt(l.credit), l.reference],
  },
};

/** Génère le CSV (UTF-8 avec BOM Excel) pour le format cible. */
export function serializeAccountingExport(
  lines: AccountingExportLine[],
  format: AccountingExportFormat = "generic",
): string {
  const spec = FORMATS[format];
  const head = spec.headers.join(spec.sep);
  const body = lines.map((l) => spec.row(l).map(escapeCsv).join(spec.sep));
  const BOM = String.fromCharCode(0xfeff);
  return BOM + [head, ...body].join("\r\n");
}
