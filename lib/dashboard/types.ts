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

export interface DashboardReadyForReviewSignal {
  id: string;
  dossierId: string;
  dossierIntitule: string;
  numeroDossier: string | null;
  clientName: string | null;
  reason: string | null;
  createdAt: string;
  createdByName: string | null;
}

/** Étape normalisée du pipeline — classification métier du dossier. */
export type DossierEtape = "Ouverture" | "Exécution" | "Finalisation" | "Clôture";

export interface DossierEvolutionItem {
  id: string;
  intitule: string;
  statut: string;
  /** Étape normalisée (pipeline cockpit). Calculée côté serveur. */
  etape: DossierEtape;
  clientName: string;
  avocatName: string | null;
  createdAt: string;
  updatedAt: string;
  taskCount: number;
  tasksDone: number;
  eventCount: number;
  nextDeadline: string | null;
}

/** Dernière réconciliation fidéicommis (null = jamais faite). */
export interface TrustReconciliationSummary {
  periode: string; // YYYY-MM
  certifiedAt: string | null;
  status: string; // "draft" | "complete" | "certified"
  ecart: number;
  daysSince: number;
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
  /** Factures émises avec un solde à recevoir (« Factures impayées »). */
  invoicesPending: number;
  timeEntries: number;
  unbilledEntries: number;
  /** Intérêts cumulés at 14%/an on overdue invoices */
  accruedInterest: number;
  /** Clients détenant des sommes en fidéicommis (solde > 0, depuis TrustTransaction). */
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
  readyForReviewSignals: DashboardReadyForReviewSignal[];
  dossierEvolution: DossierEvolutionItem[];
  indicators: DashboardIndicators;
  allKpisZero?: boolean;
  onboardingChecklist?: OnboardingChecklist;
  /** Dernière réconciliation fidéicommis (null = jamais). */
  lastReconciliation?: TrustReconciliationSummary | null;
  /** Cible heures facturables / mois / avocat (réglage cabinet). Défaut 140. */
  lawyerHoursTarget?: number;
  /** Compteurs opérationnels rapides */
  activeClientsCount: number;
  inactiveClientsCount: number;
  activeDossiersCount: number;
  dossiersParStatut: { ouvert: number; actif: number; en_attente: number; cloture: number };
}
