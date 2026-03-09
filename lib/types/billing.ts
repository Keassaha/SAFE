/**
 * Types et enums pour le module facturation SAFE.
 * Alignés sur le schéma Prisma et les règles métier.
 */

export type BillingStatus =
  | "NON_BILLED"
  | "READY_TO_BILL"
  | "IN_DRAFT_INVOICE"
  | "BILLED"
  | "NON_BILLABLE"
  | "WRITTEN_OFF"
  | "CANCELLED";

export type InvoiceStatusBilling =
  | "DRAFT"
  | "READY_TO_ISSUE"
  | "ISSUED"
  | "PARTIALLY_PAID"
  | "PAID"
  | "OVERDUE"
  | "CANCELLED"
  | "CREDITED";

export type PaymentStatus = "UNPAID" | "PARTIAL" | "PAID" | "OVERPAID";

export type AllocationStatus =
  | "UNALLOCATED"
  | "PARTIALLY_ALLOCATED"
  | "ALLOCATED"
  | "REVERSED";

export type IssueMethod =
  | "manual"
  | "generated_from_billing"
  | "recurring"
  | "trust_transfer";

export type InvoiceLineType =
  | "fee"
  | "expense"
  | "adjustment"
  | "interest"
  | "credit"
  | "trust_application"
  | "fee_after_tax"   // frais ajoutés après TPS/TVQ (non taxés)
  | "non_taxable";    // débours non taxables, ajoutés après taxes

export type InvoiceLineSourceType =
  | "time_entry"
  | "expense"
  | "manual"
  | "interest_run"
  | "credit_note"
  | "trust";

export type CreditNoteStatus =
  | "DRAFT"
  | "ISSUED"
  | "PARTIALLY_APPLIED"
  | "FULLY_APPLIED"
  | "CANCELLED";

export type ReminderType =
  | "reminder_1"
  | "reminder_2"
  | "final_notice"
  | "interest_notice";

export type ReminderChannel = "email" | "manual" | "printed";

export type SourceAccountType = "operating" | "trust" | "external";

export type PaymentMethodBilling =
  | "cash"
  | "cheque"
  | "e_transfer"
  | "card"
  | "bank_transfer"
  | "trust"
  | "other";

export type BillingRunType =
  | "preview"
  | "draft_generation"
  | "final_generation";

export type MatterGroupMode = "by_matter" | "by_client" | "mixed";

/** Totaux calculés d'une facture */
export interface InvoiceTotals {
  subtotalFees: number;
  subtotalExpenses: number;
  subtotalAdjustments: number;
  subtotalInterest: number;
  subtotalBeforeTax: number;
  taxGst: number;
  taxQst: number;
  taxTotal: number;
  trustAppliedAmount: number;
  creditAppliedAmount: number;
  totalInvoiceAmount: number;
  totalPaidAmount: number;
  balanceDue: number;
}

/** Ligne de facture pour calcul */
export interface InvoiceLineRow {
  lineType: InvoiceLineType;
  lineSubtotal: number;
  taxable: boolean;
  gstAmount?: number;
  qstAmount?: number;
  lineTotal?: number;
}

/** Entrée pour allocation de paiement */
export interface PaymentAllocationInput {
  invoiceId: string;
  allocatedAmount: number;
}

/** Application d'une note de crédit */
export interface CreditNoteApplicationInput {
  invoiceId: string;
  appliedAmount: number;
}

/** Paramètres de calcul d'intérêts */
export interface InterestCalculationParams {
  baseAmount: number;
  annualRate: number;
  daysOverdue: number;
}
