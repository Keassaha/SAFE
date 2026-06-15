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
  subtotalBeforeTax?: number | null;
  taxTotal?: number | null;
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

function pushLine(
  lines: AccountingExportLine[],
  params: {
    date: string;
    accountCode: string;
    accountName: string;
    debit?: number;
    credit?: number;
    memo: string;
    reference: string;
    name: string;
  },
) {
  const debit = round2(params.debit ?? 0);
  const credit = round2(params.credit ?? 0);
  if (debit <= 0 && credit <= 0) return;
  lines.push({
    date: params.date,
    accountCode: params.accountCode,
    accountName: params.accountName,
    debit,
    credit,
    memo: params.memo,
    reference: params.reference,
    name: params.name,
  });
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
    const date = toIsoDate(e.dateTransaction);
    const reference = e.reference ?? "";
    const name = e.clientName ?? "";
    const memoParts = [e.description ?? "", e.dossierLabel ?? ""].filter(Boolean);
    const memo = memoParts.join(" — ");

    if (e.typeTransaction === "FACTURE" && e.sourceModule === "FACTURATION") {
      const total = round2(e.montantEntree);
      if (total <= 0) continue;
      const hasTaxBreakdown = (e.subtotalBeforeTax ?? 0) > 0 || (e.taxTotal ?? 0) > 0;
      const subtotal = hasTaxBreakdown ? round2(e.subtotalBeforeTax ?? total - (e.taxTotal ?? 0)) : total;
      const taxTotal = hasTaxBreakdown ? round2(total - subtotal) : 0;

      const ar = chart.accounts_receivable;
      const revenue = chart.revenue_fees;
      const tax = chart.tax_payable;
      pushLine(lines, { date, accountCode: ar.code, accountName: ar.name, debit: total, memo, reference, name });
      pushLine(lines, { date, accountCode: revenue.code, accountName: revenue.name, credit: subtotal, memo, reference, name });
      pushLine(lines, { date, accountCode: tax.code, accountName: tax.name, credit: taxTotal, memo, reference, name });
      continue;
    }

    const rule = deriveDoubleEntry(e);
    const amount = round2(rule.amount);
    if (amount <= 0) continue;

    const debitAcc = chart[rule.debit];
    const creditAcc = chart[rule.credit];

    pushLine(lines, { date, accountCode: debitAcc.code, accountName: debitAcc.name, debit: amount, memo, reference, name });
    pushLine(lines, { date, accountCode: creditAcc.code, accountName: creditAcc.name, credit: amount, memo, reference, name });
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
