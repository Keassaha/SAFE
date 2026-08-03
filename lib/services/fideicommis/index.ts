/**
 * Module fidéicommis — soldes, transactions et rapprochement.
 */

export { getTrustBalance, getGlobalTrustBalance, countClientsWithTrustFunds, getTrustBalancesByDossier } from "./trust-balance-service";
export {
  createTrustDeposit,
  createTrustWithdrawal,
  createTrustCorrection,
  type CreateTrustDepositParams,
  type CreateTrustWithdrawalParams,
  type CreateTrustCorrectionParams,
} from "./trust-transaction-service";
export {
  createReconciliation,
  certifyReconciliation,
  getLatestReconciliation,
  getReconciliations,
  getReconciliation,
  getReconciliationStatus,
  type CreateReconciliationParams,
  type CertifyReconciliationParams,
} from "./reconciliation-service";
export {
  generateReportData,
  createComplianceReport,
  getComplianceReports,
  certifyComplianceReport,
  type GenerateReportParams,
} from "./lso-report-service";

export {
  openTrustBankAccount,
  closeTrustBankAccount,
  listTrustBankAccounts,
  resolveDefaultTrustBankAccountId,
  getTrustBankAccountBalance,
  getClientBalanceInAccount,
  getTrustBankAccountCompliance,
  TrustBankAccountInvalidError,
} from "./trust-bank-account-service";

export {
  registerTrustCheque,
  voidTrustCheque,
  getChequeSequenceGaps,
  getOutstandingCheques,
  getOutstandingChequesTotal,
  markChequesCleared,
  TrustChequeInvalidError,
} from "./trust-cheque-service";

export {
  attachSupportingDocument,
  getTransactionDocumentStatus,
  buildMissingDocumentsReport,
} from "./trust-supporting-documents-service";

export {
  generateMonthlyReport,
  certifyMonthlyReport,
  recordDiscrepancyReason,
  attachBankStatement,
  getDepositInTransitCandidates,
  listMonthlyReports,
  getMonthlyReport,
  periodBounds,
  MonthlyReportBlockedError,
} from "./monthly-report-service";

export { loadRegister } from "./register-service";
export {
  renderRegister,
  toCsv,
  toPrintableHtml,
  computeFingerprint,
  formatCell,
  type RenderedRegister,
  type RegisterRow,
} from "./register-render";

export {
  recordCashReceipt,
  recordCashRefund,
  getCashAggregateForDossier,
  getPendingCashDeclarations,
  markDeclarationSent,
  listCashReceipts,
  CashComplianceError,
} from "./cash-service";

export {
  createTransferRequisition,
  recordTransferExecution,
  recordTransferConfirmation,
  countersignTransferConfirmation,
  getPendingCountersignatures,
  recordClientLedgerTransfer,
  recordReferralFee,
  checkSignatory,
  getMaxBalancePreviousFiscalYear,
  TransferComplianceError,
} from "./electronic-transfer-service";

export {
  recordTrustProperty,
  moveTrustProperty,
  recordClientNotice,
  releaseTrustProperty,
  listTrustProperties,
  getPendingPropertyNotices,
  checkPropertiesBeforeDossierClosure,
  getPropertyRetention,
  getPropertyFormFields,
  TrustPropertyError,
} from "./trust-property-service";

export {
  generateAnnualReport,
  certifyAnnualReport,
  attachAnnualBankStatement,
  markAnnualReportSubmitted,
  listAnnualReports,
  AnnualReportBlockedError,
} from "./annual-report-service";

export {
  detectShortfalls,
  getOpenShortfalls,
  getShortfallsForPeriod,
  recordRemediation,
  recordInterestRemittance,
  getInterestRemittances,
  TrustShortfallError,
  type DetectedShortfall,
  type ShortfallStatus,
} from "./trust-shortfall-service";
