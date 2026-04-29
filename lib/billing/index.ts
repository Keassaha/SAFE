/**
 * SAFE — Noyau commun de facturation.
 *
 * Point d'entrée unique. Tout consommateur (server actions, API routes,
 * écrans server components) doit importer depuis `@/lib/billing` et jamais
 * depuis les fichiers internes.
 *
 * Voir docs/accounting/BILLING_CORE_MODEL.md
 *      docs/accounting/SAFE_ACCOUNTING_DOCTRINE.md
 *      docs/accounting/EXPENSES_AND_DISBURSEMENTS_DOCTRINE.md
 *      docs/accounting/TAX_AND_PROVINCE_MODEL.md
 */

export * from "./types";
export {
  getCabinetTaxConfig,
  getDefaultTaxConfig,
  applyTaxes,
  splitInclusiveTaxes,
  describeTaxConfig,
} from "./taxes";
export {
  getTimeEntryBillableAmount,
  getTimeEntryProducedAmount,
  classifyTimeEntryForBilling,
  isTimeEntryReadyForBilling,
  getRegistreTacheBillableAmount,
  recomputeRegistreTacheFinal,
  computeWipForDossier,
  computeRealizationRate,
  computeRecoveryRate,
  computeBillingRatios,
} from "./wip";
export {
  classifyExpense,
  isCabinetExpense,
  isClientDisbursement,
  isRebillable,
  validateExpenseConsistency,
} from "./expenses-doctrine";
