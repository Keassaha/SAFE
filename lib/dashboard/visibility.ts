import type { EmployeeRole } from "@prisma/client";

export interface DashboardVisibility {
  showFinancialKpis: boolean;
  showRevenueChart: boolean;
  showExpenses: boolean;
  showTrustBalance: boolean;
  showLawyerProductivity: boolean;
  showActiveCases: boolean;
  showBillingFollowUp: boolean;
  showAlerts: boolean;
  showActivityFeed: boolean;
  showTransactionsList: boolean;
  showCalendar: boolean;
  /** When true, restrict data to current user (e.g. LAWYER sees only their hours/cases). */
  personalScope: boolean;
}

const FULL_FINANCIAL: DashboardVisibility = {
  showFinancialKpis: true,
  showRevenueChart: true,
  showExpenses: true,
  showTrustBalance: true,
  showLawyerProductivity: true,
  showActiveCases: true,
  showBillingFollowUp: true,
  showAlerts: true,
  showActivityFeed: true,
  showTransactionsList: true,
  showCalendar: true,
  personalScope: false,
};

const LEAD_LAWYER_VIEW: DashboardVisibility = {
  ...FULL_FINANCIAL,
  showExpenses: true,
  showTrustBalance: true,
};

const LAWYER_VIEW: DashboardVisibility = {
  showFinancialKpis: true,
  showRevenueChart: true,
  showExpenses: false,
  showTrustBalance: true,
  showLawyerProductivity: true,
  showActiveCases: true,
  showBillingFollowUp: true,
  showAlerts: true,
  showActivityFeed: true,
  showTransactionsList: true,
  showCalendar: true,
  personalScope: true,
};

const LEGAL_ASSISTANT_VIEW: DashboardVisibility = {
  showFinancialKpis: false,
  showRevenueChart: false,
  showExpenses: false,
  showTrustBalance: false,
  showLawyerProductivity: false,
  showActiveCases: true,
  showBillingFollowUp: true,
  showAlerts: true,
  showActivityFeed: true,
  showTransactionsList: true,
  showCalendar: true,
  personalScope: false,
};

const ACCOUNTING_TECHNICIAN_VIEW: DashboardVisibility = {
  ...FULL_FINANCIAL,
};

const INTERN_VIEW: DashboardVisibility = {
  showFinancialKpis: false,
  showRevenueChart: false,
  showExpenses: false,
  showTrustBalance: false,
  showLawyerProductivity: false,
  showActiveCases: true,
  showBillingFollowUp: false,
  showAlerts: true,
  showActivityFeed: true,
  showTransactionsList: false,
  showCalendar: true,
  personalScope: false,
};

const READ_ONLY_VIEW: DashboardVisibility = {
  ...FULL_FINANCIAL,
};

/**
 * Returns which dashboard sections to show based on the user's effective role.
 * Used to tailor the dashboard for ADMIN/ACCOUNTANT, LEAD_LAWYER, LAWYER, LEGAL_ASSISTANT, etc.
 */
export function getDashboardVisibility(employeeRole: EmployeeRole): DashboardVisibility {
  switch (employeeRole) {
    case "ADMIN_ACCOUNTANT":
      return FULL_FINANCIAL;
    case "LEAD_LAWYER":
      return LEAD_LAWYER_VIEW;
    case "LAWYER":
      return LAWYER_VIEW;
    case "LEGAL_ASSISTANT":
      return LEGAL_ASSISTANT_VIEW;
    case "ACCOUNTING_TECHNICIAN":
      return ACCOUNTING_TECHNICIAN_VIEW;
    case "INTERN":
      return INTERN_VIEW;
    case "READ_ONLY":
      return READ_ONLY_VIEW;
    default:
      return LAWYER_VIEW;
  }
}
