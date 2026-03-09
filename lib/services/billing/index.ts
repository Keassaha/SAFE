/**
 * Module facturation SAFE — services métier.
 */

export {
  createDraftFromBillableItems,
  approveInvoice,
  issueInvoice,
  cancelDraft,
  recalculateInvoiceTotals,
  canModifyInvoice,
} from "./invoice-service";
export { createPayment, allocateToInvoices } from "./payment-allocation-service";
export { getOrCreateTrustAccount, applyTrustToInvoice } from "./trust-service";
export {
  getDaysOverdue,
  createOrUpdateInterestCharge,
} from "./interest-service";
export { createCreditNote, applyCreditNote } from "./credit-note-service";
export {
  createReminder,
  listOverdueInvoices,
} from "./reminder-service";
export type { ReminderType, ReminderChannel } from "./reminder-service";
