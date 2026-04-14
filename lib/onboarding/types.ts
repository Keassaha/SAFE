/* ─────────────────────────────────────────────
   Onboarding Form — Types
   ───────────────────────────────────────────── */

export type Lang = "fr" | "en";

export interface OnboardingData {
  /* ── Étape 1 : Informations du cabinet ── */
  firmName: string;
  leadName: string;
  email: string;
  barNumber: string;
  province: string;
  address: string;
  phone: string;
  website: string;
  logo: File | null;
  firmColors: string;

  /* ── Étape 2 : Type de pratique ── */
  practiceAreas: string[];
  practiceAreasOther: string;
  monthlyNewFiles: string;
  clientType: string;
  clientTypeOther: string;
  dossierNumbering: string;
  dossierClassification: string;

  /* ── Étape 3 : Facturation ── */
  billingMethod: string;
  billingMethodOther: string;
  hourlyRate: string;
  billingFrequency: string;
  billingFrequencyOther: string;
  paymentTerms: string;
  paymentTermsOther: string;
  paymentMethods: string[];
  paymentMethodsOther: string;
  invoiceDetail: string;
  invoiceLanguage: string;
  hasRetainer: string;
  timeTracking: string;

  /* ── Étape 4 : Fidéicommis ── */
  hasTrustAccount: string;
  trustAccountCount: string;
  reconciliationFrequency: string;
  reconciliationFrequencyOther: string;
  auditIssues: string;

  /* ── Étape 5 : Équipe et accès ── */
  teamStructure: string;
  teamStructureOther: string;
  totalUsers: string;
  whoPreparesInvoices: string;
  whoPreparesInvoicesOther: string;
  techComfort: string;

  /* ── Étape 6 : Outils et migration ── */
  currentSoftware: string;
  currentSoftwareOther: string;
  hasDataToMigrate: string;
  dataFormat: string;
  dataFormatOther: string;
  primaryDevice: string;
  accountingIntegration: string;

  /* ── Étape 7 : Priorités ── */
  urgentChallenges: string[];
  urgentChallengesOther: string;
  reportsNeeded: string[];
  clientPortal: string;
  goLiveTimeline: string;

  /* ── Étape 8 : RDV ── */
  preferredDate: string;
  preferredTime: string;
  optionalMessage: string;
}

export const INITIAL_DATA: OnboardingData = {
  firmName: "",
  leadName: "",
  email: "",
  barNumber: "",
  province: "",
  address: "",
  phone: "",
  website: "",
  logo: null,
  firmColors: "",

  practiceAreas: [],
  practiceAreasOther: "",
  monthlyNewFiles: "",
  clientType: "",
  clientTypeOther: "",
  dossierNumbering: "",
  dossierClassification: "",

  billingMethod: "",
  billingMethodOther: "",
  hourlyRate: "",
  billingFrequency: "",
  billingFrequencyOther: "",
  paymentTerms: "",
  paymentTermsOther: "",
  paymentMethods: [],
  paymentMethodsOther: "",
  invoiceDetail: "",
  invoiceLanguage: "",
  hasRetainer: "",
  timeTracking: "",

  hasTrustAccount: "",
  trustAccountCount: "",
  reconciliationFrequency: "",
  reconciliationFrequencyOther: "",
  auditIssues: "",

  teamStructure: "",
  teamStructureOther: "",
  totalUsers: "",
  whoPreparesInvoices: "",
  whoPreparesInvoicesOther: "",
  techComfort: "",

  currentSoftware: "",
  currentSoftwareOther: "",
  hasDataToMigrate: "",
  dataFormat: "",
  dataFormatOther: "",
  primaryDevice: "",
  accountingIntegration: "",

  urgentChallenges: [],
  urgentChallengesOther: "",
  reportsNeeded: [],
  clientPortal: "",
  goLiveTimeline: "",

  preferredDate: "",
  preferredTime: "",
  optionalMessage: "",
};

export interface CalculationResult {
  lineItems: { label: { fr: string; en: string }; amount: number }[];
  totalValue: number;
  plan: {
    name: { fr: string; en: string };
    price: number;        // prix mensuel (sans engagement)
    annualPrice: number;  // prix mensuel si paiement annuel
    annualSaving: number; // économie annuelle totale
  };
}

export interface StepProps {
  data: OnboardingData;
  setData: (updates: Partial<OnboardingData>) => void;
  lang: Lang;
  errors: Record<string, string>;
}
