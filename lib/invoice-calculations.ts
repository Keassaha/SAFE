/**
 * Moteur de calcul des factures SAFE — conforme aux pratiques fiscales du Québec.
 * TPS 5 %, TVQ 9,975 %. Structure : honoraires, débours taxables, taxes, débours non taxables.
 */

import type { InvoiceLineType, InvoiceTotals as BillingInvoiceTotals } from "@/lib/types/billing";

export const TPS_RATE = 0.05;
export const TVQ_RATE = 0.09975;

/** Montant minimum (en $) pour pouvoir facturer un client. */
export const MIN_AMOUNT_TO_BILL = 100;

export type InvoiceItemType =
  | "honoraires"
  | "debours_taxable"
  | "debours_non_taxable"
  | "frais_rappel"
  | "interets";

export interface InvoiceItemRow {
  type: InvoiceItemType;
  amount: number;
  hours?: number;
  rate?: number;
}

export interface InvoiceTotals {
  /** Sous-total honoraires */
  subtotalHonoraires: number;
  /** Sous-total débours taxables */
  subtotalDeboursTaxables: number;
  /** SOUS-TOTAL TAXABLE = honoraires + débours taxables */
  subtotalTaxable: number;
  /** TPS 5 % */
  tps: number;
  /** TVQ 9,975 % */
  tvq: number;
  /** Sous-total débours non taxables */
  subtotalDeboursNonTaxables: number;
  /** TOTAL FACTURE = sous-total taxable + TPS + TVQ + débours non taxables */
  totalInvoice: number;
  /** Total des paiements reçus */
  paymentsTotal: number;
  /** Montant appliqué du fidéicommis */
  trustApplied: number;
  /** SOLDE À PAYER = total facture - paiements - fidéicommis */
  balanceDue: number;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * Calcule tous les totaux d'une facture à partir des lignes et des paiements.
 */
export function computeInvoiceTotals(
  items: InvoiceItemRow[],
  paymentsTotal: number,
  trustApplied: number
): InvoiceTotals {
  const honoraires = items
    .filter((i) => i.type === "honoraires")
    .reduce((s, i) => s + i.amount, 0);
  const deboursTaxables = items
    .filter((i) => i.type === "debours_taxable")
    .reduce((s, i) => s + i.amount, 0);
  const fraisRappel = items
    .filter((i) => i.type === "frais_rappel")
    .reduce((s, i) => s + i.amount, 0);
  const interets = items
    .filter((i) => i.type === "interets")
    .reduce((s, i) => s + i.amount, 0);
  const deboursNonTaxables = items
    .filter((i) => i.type === "debours_non_taxable")
    .reduce((s, i) => s + i.amount, 0);

  const subtotalHonoraires = round2(honoraires);
  const subtotalDeboursTaxables = round2(deboursTaxables);
  const subtotalFraisEtInterets = round2(fraisRappel + interets);
  const subtotalTaxable = round2(
    subtotalHonoraires + subtotalDeboursTaxables + subtotalFraisEtInterets
  );
  const tps = round2(subtotalTaxable * TPS_RATE);
  const tvq = round2(subtotalTaxable * TVQ_RATE);
  const subtotalDeboursNonTaxables = round2(deboursNonTaxables);
  const totalInvoice = round2(
    subtotalTaxable + tps + tvq + subtotalDeboursNonTaxables
  );
  const balanceDue = round2(totalInvoice - paymentsTotal - trustApplied);

  return {
    subtotalHonoraires,
    subtotalDeboursTaxables,
    subtotalTaxable,
    tps,
    tvq,
    subtotalDeboursNonTaxables,
    totalInvoice,
    paymentsTotal,
    trustApplied,
    balanceDue,
  };
}

/** Champs à persister sur le modèle Invoice après recalcul */
export function toInvoiceTotalsFields(totals: InvoiceTotals) {
  return {
    subtotalTaxable: totals.subtotalTaxable,
    tps: totals.tps,
    tvq: totals.tvq,
    deboursNonTaxableTotal: totals.subtotalDeboursNonTaxables,
    montantTotal: totals.totalInvoice,
    montantPaye: totals.paymentsTotal,
    trustApplied: totals.trustApplied,
    balanceDue: totals.balanceDue,
  };
}

/** Types de ligne facturation unifiés (module billing) */
export interface BillingLineRow {
  lineType: InvoiceLineType;
  lineSubtotal: number;
  taxable: boolean;
  gstAmount?: number;
  qstAmount?: number;
}

function round2Billing(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * Calcule les totaux facture à partir des lignes unifiées (fee, expense, adjustment, interest, etc.).
 * Utilisé par le module facturation complet.
 */
export function computeBillingTotals(
  lines: BillingLineRow[],
  totalPaidAmount: number,
  trustAppliedAmount: number,
  creditAppliedAmount: number
): BillingInvoiceTotals {
  const fees = lines
    .filter((l) => l.lineType === "fee")
    .reduce((s, l) => s + (l.lineSubtotal ?? 0), 0);
  const expenses = lines
    .filter((l) => l.lineType === "expense")
    .reduce((s, l) => s + (l.lineSubtotal ?? 0), 0);
  const adjustments = lines
    .filter((l) => l.lineType === "adjustment")
    .reduce((s, l) => s + (l.lineSubtotal ?? 0), 0);
  const interest = lines
    .filter((l) => l.lineType === "interest")
    .reduce((s, l) => s + (l.lineSubtotal ?? 0), 0);
  const credit = lines
    .filter((l) => l.lineType === "credit")
    .reduce((s, l) => s + (l.lineSubtotal ?? 0), 0);
  const trustApplication = lines
    .filter((l) => l.lineType === "trust_application")
    .reduce((s, l) => s + (l.lineSubtotal ?? 0), 0);
  // Frais et débours non taxables ajoutés après les taxes
  const feeAfterTax = lines
    .filter((l) => l.lineType === "fee_after_tax")
    .reduce((s, l) => s + (l.lineSubtotal ?? 0), 0);
  const nonTaxable = lines
    .filter((l) => l.lineType === "non_taxable")
    .reduce((s, l) => s + (l.lineSubtotal ?? 0), 0);

  const subtotalFees = round2Billing(fees);
  const subtotalExpenses = round2Billing(expenses);
  const subtotalAdjustments = round2Billing(adjustments);
  const subtotalInterest = round2Billing(interest);
  const subtotalFeeAfterTax = round2Billing(feeAfterTax);
  const subtotalNonTaxable = round2Billing(nonTaxable);
  const subtotalBeforeTax = round2Billing(
    subtotalFees + subtotalExpenses + subtotalAdjustments + subtotalInterest - credit
  );
  const taxBaseRounded = round2Billing(
    subtotalFees + subtotalExpenses + subtotalAdjustments + subtotalInterest - credit
  );
  const taxGst = round2Billing(taxBaseRounded * TPS_RATE);
  const taxQst = round2Billing(taxBaseRounded * TVQ_RATE);
  const taxTotal = round2Billing(taxGst + taxQst);
  const totalInvoiceAmount = round2Billing(
    subtotalBeforeTax + taxGst + taxQst + subtotalFeeAfterTax + subtotalNonTaxable
  );
  const balanceDue = round2Billing(
    totalInvoiceAmount - totalPaidAmount - creditAppliedAmount - trustAppliedAmount
  );

  return {
    subtotalFees,
    subtotalExpenses,
    subtotalAdjustments,
    subtotalInterest,
    subtotalBeforeTax,
    taxGst,
    taxQst,
    taxTotal,
    trustAppliedAmount,
    creditAppliedAmount,
    totalInvoiceAmount,
    totalPaidAmount,
    balanceDue,
  };
}

/** Calcule les intérêts (base × taux × jours / 365) */
export function computeInterestAmount(
  baseAmount: number,
  annualRate: number,
  daysOverdue: number
): number {
  return round2Billing((baseAmount * (annualRate / 100) * daysOverdue) / 365);
}
