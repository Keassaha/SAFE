/**
 * Construit les lignes d'export comptable double-entrée à partir des écritures du
 * journal SAFE. Module PUR (aucun accès base). Chaque écriture produit DEUX lignes
 * balancées (une au débit, une au crédit), prêtes pour un import journal externe.
 */

import type { JournalTransactionType, JournalSourceModule } from "@prisma/client";
import {
  type Account,
  type AccountChart,
  deriveDoubleEntry,
  expenseAccountFor,
  resolveAccountChart,
} from "./account-mapping";
import { toIsoDay } from "@/lib/utils/calendar-date";

export interface ExportableEntry {
  id?: string;
  dateTransaction: Date;
  typeTransaction: JournalTransactionType;
  sourceModule: JournalSourceModule;
  montantEntree: number;
  montantSortie: number;
  subtotalBeforeTax?: number | null;
  taxTotal?: number | null;
  /** Dépenses (lot 3) : code de catégorie, pour choisir le compte d'imputation. */
  categoryCode?: string | null;
  /**
   * Dépenses : taxe RÉCLAMABLE, déjà filtrée par origine et par taux de catégorie.
   * Volontairement distincte de la taxe payée : une taxe estimée ou limitée à 50 %
   * ne doit jamais atterrir en actif chez le comptable.
   */
  taxReclamable?: number | null;
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

/**
 * Sérialise un jour en `YYYY-MM-DD`.
 *
 * Lecture en UTC, jamais locale : les dates comptables sont stockées à minuit UTC
 * (voir lib/utils/calendar-date.ts). Les getters locaux les faisaient tomber la
 * veille à 20 h côté Montréal, et le décalage partait tel quel dans les fichiers
 * QuickBooks, Xero et Sage, où il devient l'écriture d'un autre jour, parfois d'un
 * autre mois et donc d'une autre période de TPS/TVQ.
 */
function toIsoDate(d: Date): string {
  return toIsoDay(d);
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
  /** Surcharge cabinet des comptes de dépense par catégorie. */
  expenseAccountsOverride?: Readonly<Record<string, Account>> | null,
): AccountingExportLine[] {
  const chart = resolveAccountChart(chartOverride);
  const lines: AccountingExportLine[] = [];

  for (const e of entries) {
    const date = toIsoDate(e.dateTransaction);
    const reference = e.reference ?? "";
    const name = e.clientName ?? "";
    // La catégorie rejoint le mémo : même avec un compte dédié, le comptable qui
    // relit une ligne isolée doit voir le classement d'origine.
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

    // ── Dépense : trois lignes quand une taxe est réellement récupérable ─────
    //
    // L'export envoyait le TTC entier en dépense, taxe noyée. Deux effets : les
    // dépenses partaient surévaluées chez le comptable, et la taxe récupérable
    // était invisible. L'asymétrie sautait aux yeux à côté de la facture, traitée
    // en trois lignes deux blocs plus haut.
    //
    // Ce qui va en ACTIF est la taxe réclamable, pas la taxe payée. Une taxe
    // estimée n'est pas justifiable en vérification, et sur un repas seule la
    // moitié du crédit est permise : le reste est un COÛT, et reste donc dans la
    // dépense. C'est ce qui relie les lots 1, 2 et 3.
    if (e.typeTransaction === "DEPENSE") {
      const total = round2(e.montantSortie);
      if (total <= 0) continue;

      const recuperable = round2(Math.max(0, Math.min(e.taxReclamable ?? 0, total)));
      const compteDepense: Account = expenseAccountFor(e.categoryCode, chart, expenseAccountsOverride);
      const bank = chart.bank_admin;

      if (recuperable <= 0) {
        // Rien de récupérable : deux lignes, et c'est correct. Inscrire zéro dans
        // un compte de taxe à recouvrer polluerait le grand livre du comptable.
        pushLine(lines, { date, accountCode: compteDepense.code, accountName: compteDepense.name, debit: total, memo, reference, name });
        pushLine(lines, { date, accountCode: bank.code, accountName: bank.name, credit: total, memo, reference, name });
        continue;
      }

      const taxeCompte = chart.tax_receivable;
      pushLine(lines, { date, accountCode: compteDepense.code, accountName: compteDepense.name, debit: round2(total - recuperable), memo, reference, name });
      pushLine(lines, { date, accountCode: taxeCompte.code, accountName: taxeCompte.name, debit: recuperable, memo, reference, name });
      pushLine(lines, { date, accountCode: bank.code, accountName: bank.name, credit: total, memo, reference, name });
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
