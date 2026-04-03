import type { DashboardVisibility } from "./visibility";

export interface DashboardKpi {
  value: string;
  subtitle?: string;
  trend?: number; // e.g. +10 for +10% vs last month
  trendLabel?: string;
}

export interface DashboardKpis {
  revenueThisMonth: DashboardKpi;
  paymentsReceived: DashboardKpi;
  outstandingInvoices: DashboardKpi;
  unbilledHoursValue: DashboardKpi;
  trustBalance: DashboardKpi;
  expensesThisMonth: DashboardKpi;
  /** Taux de recouvrement = paiements / facturé */
  recoveryRate: DashboardKpi;
  /** Heures travaillées total */
  hoursWorked: DashboardKpi;
  /** Heures facturées total */
  hoursBilled: DashboardKpi;
  /** Taux de facturation = heures facturées / heures travaillées */
  billingRate: DashboardKpi;
  /** Revenu moyen par avocat */
  revenuePerLawyer: DashboardKpi;
  /** Cash non reçu (facturé - encaissé) */
  cashNotReceived: DashboardKpi;
}

export interface RevenueChartPoint {
  monthKey: string;
  label: string;
  value: number;
  /** Optional: invoiced amount for same month */
  invoiced?: number;
}

/** Row for the Facture vs Encaissé par mois table */
export interface MonthlyComparisonRow {
  month: string;
  invoiced: number;
  collected: number;
  gap: number;
  rate: number; // % collected/invoiced
  delta: number; // change vs previous month
}

export interface LawyerProductivityRow {
  userId: string;
  lawyerName: string;
  hoursWorked: number;
  billableHours: number;
  valueBillable: number;
  unbilledHours: number;
  /** % facturation = billableHours / hoursWorked */
  billingRate: number;
}

export interface ActiveCaseRow {
  id: string;
  caseName: string;
  clientName: string;
  lawyerName: string | null;
  hoursLogged: number;
  amountInvoiced: number;
  lastActivity: Date | string;
}

/** Row for Top 10 comptes en souffrance */
export interface OutstandingAccountRow {
  clientId: string;
  clientName: string;
  balanceDue: number;
  firstInvoiceDate: Date | string;
  daysSinceFirstInvoice: number;
  /** Sursis: delay status category */
  agingCategory: string;
}

export interface BillingFollowUpRow {
  id: string;
  clientName: string;
  invoiceNumber: string;
  amount: number;
  dateIssued: Date | string;
  status: string;
}

export interface DashboardAlert {
  type: string;
  message: string;
  href: string;
}

export interface ActivityFeedItem {
  id: string;
  timestamp: Date | string;
  action: string;
  entityType: string;
  entityId: string;
  userDisplayName: string | null;
}

export interface DashboardTaskItem {
  id: string;
  titre: string;
  description: string | null;
  priorite: string;
  statut: string;
  dateEcheance: string | null;
  assigneeName: string | null;
  dossierIntitule: string;
  dossierId: string;
}

export interface DashboardEventItem {
  id: string;
  type: string;
  titre: string;
  date: string;
  lieu: string | null;
  dossierIntitule: string;
  dossierId: string;
}

export interface DossierEvolutionItem {
  id: string;
  intitule: string;
  statut: string;
  clientName: string;
  avocatName: string | null;
  createdAt: string;
  updatedAt: string;
  taskCount: number;
  tasksDone: number;
  eventCount: number;
  nextDeadline: string | null;
}

export interface OnboardingChecklist {
  cabinetConfigured: boolean;
  hasClient: boolean;
  hasDossier: boolean;
  hasTimeEntry: boolean;
  hasInvoice: boolean;
}

/** Indicateurs section data */
export interface DashboardIndicators {
  invoicesSent: number;
  invoicesPending: number;
  timeEntries: number;
  unbilledEntries: number;
  /** Intérêts cumulés at 14%/an on overdue invoices */
  accruedInterest: number;
  activeTrustAccounts: number;
}

export interface DashboardPayload {
  visibility: DashboardVisibility;
  kpis: DashboardKpis;
  revenueChartData: RevenueChartPoint[];
  monthlyComparison: MonthlyComparisonRow[];
  lawyerProductivity: LawyerProductivityRow[];
  activeCases: ActiveCaseRow[];
  outstandingAccounts: OutstandingAccountRow[];
  billingFollowUp: BillingFollowUpRow[];
  alerts: DashboardAlert[];
  activityFeed: ActivityFeedItem[];
  transactionItems: { id: string; label: string; date: string; amount: number; href?: string }[];
  soldeFideicommis?: string;
  deboursARefacturer?: string;
  deboursNonRembourses?: string;
  upcomingTasks: DashboardTaskItem[];
  upcomingEvents: DashboardEventItem[];
  dossierEvolution: DossierEvolutionItem[];
  indicators: DashboardIndicators;
  allKpisZero?: boolean;
  onboardingChecklist?: OnboardingChecklist;
}
