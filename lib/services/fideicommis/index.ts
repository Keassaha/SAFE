/**
 * Module fidéicommis — soldes, transactions et rapprochement.
 */

export { getTrustBalance, getGlobalTrustBalance, countClientsWithTrustFunds } from "./trust-balance-service";
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
