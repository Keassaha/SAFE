/**
 * Construit les lignes d'export comptable double-entrée à partir des écritures du
 * journal SAFE. Module PUR (aucun accès base). Chaque écriture produit DEUX lignes
 * balancées (une au débit, une au crédit), prêtes pour un import journal externe.
 */

import type { JournalTransactionType, JournalSourceModule } from "@prisma/client";
import {
  type AccountChart,
  deriveDoubleEntry,
  resolveAccountChart,
} from "./account-mapping";

export interface ExportableEntry {
  id?: string;
  dateTransaction: Date;
  typeTransaction: JournalTransactionType;
  sourceModule: JournalSourceModule;
  montantEntree: number;
  montantSortie: number;
  reference?: string | null;
  description?: string | null;
  clientName?: string | null;
  dossierLabel?: string | null;
}

export interface AccountingExportLine {
  date: string; // YYYY-MM-DD
  accountCode: string;
  accountName: string;
  debit: number; // 0 si ligne de crédit
  credit: number; // 0 si ligne de débit
  memo: string;
  reference: string;
  name: string; // tiers (client) si présent
}

function toIsoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

/**
 * Transforme les écritures en lignes d'export double-entrée balancées.
 * Les écritures de montant nul sont ignorées (rien à exporter).
 */
export function buildAccountingExportLines(
  entries: ExportableEntry[],
  chartOverride?: Partial<AccountChart> | null,
): AccountingExportLine[] {
  const chart = resolveAccountChart(chartOverride);
  const lines: AccountingExportLine[] = [];

  for (const e of entries) {
    const rule = deriveDoubleEntry(e);
    const amount = round2(rule.amount);
    if (amount <= 0) continue;

    const date = toIsoDate(e.dateTransaction);
    const reference = e.reference ?? "";
    const name = e.clientName ?? "";
    const memoParts = [e.description ?? "", e.dossierLabel ?? ""].filter(Boolean);
    const memo = memoParts.join(" — ");

    const debitAcc = chart[rule.debit];
    const creditAcc = chart[rule.credit];

    lines.push({
      date,
      accountCode: debitAcc.code,
      accountName: debitAcc.name,
      debit: amount,
      credit: 0,
      memo,
      reference,
      name,
    });
    lines.push({
      date,
      accountCode: creditAcc.code,
      accountName: creditAcc.name,
      debit: 0,
      credit: amount,
      memo,
      reference,
      name,
    });
  }

  return lines;
}

/** Totaux de contrôle : un export valide a Σ débits == Σ crédits. */
export function exportTotals(lines: AccountingExportLine[]): {
  totalDebit: number;
  totalCredit: number;
  balanced: boolean;
} {
  let totalDebit = 0;
  let totalCredit = 0;
  for (const l of lines) {
    totalDebit += l.debit;
    totalCredit += l.credit;
  }
  totalDebit = round2(totalDebit);
  totalCredit = round2(totalCredit);
  return { totalDebit, totalCredit, balanced: totalDebit === totalCredit };
}
