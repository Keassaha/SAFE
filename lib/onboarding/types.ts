/* ─────────────────────────────────────────────
   Onboarding Form — Types
   ───────────────────────────────────────────── */

export type Lang = "fr" | "en";

export interface OnboardingData {
  /* ── Étape 1 : Informations du cabinet ── */
  firmName: string;
  leadName: string;
  email: string;
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
  activeFilesCount: string;
  clientType: string;
  clientTypeOther: string;
  annualRevenue: string;

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
  latePaymentIssues: string;

  /* ── Étape 4 : Fidéicommis ── */
  hasTrustAccount: string;
  trustAccountCount: string;
  reconciliationFrequency: string;
  reconciliationFrequencyOther: string;
  monthlyTrustVolume: string;
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
  usesTimeTracking: string;
  documentManagement: string;
  hasDataToMigrate: string;
  dataFormat: string;
  dataFormatOther: string;
  primaryDevice: string;

  /* ── Étape 7 : Priorités ── */
  mainPainPoint: string;
  decisionMaker: string;
  urgentChallenges: string[];
  urgentChallengesOther: string;
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
  province: "",
  address: "",
  phone: "",
  website: "",
  logo: null,
  firmColors: "",

  practiceAreas: [],
  practiceAreasOther: "",
  monthlyNewFiles: "",
  activeFilesCount: "",
  clientType: "",
  clientTypeOther: "",
  annualRevenue: "",

  billingMethod: "",
  billingMethodOther: "",
  hourlyRate: "",
  billingFrequency: "",
  billingFrequencyOther: "",
  paymentTerms: "",
  paymentTermsOther: "",
  paymentMethods: [],
  paymentMethodsOther: "",
  latePaymentIssues: "",

  hasTrustAccount: "",
  trustAccountCount: "",
  reconciliationFrequency: "",
  reconciliationFrequencyOther: "",
  monthlyTrustVolume: "",
  auditIssues: "",

  teamStructure: "",
  teamStructureOther: "",
  totalUsers: "",
  whoPreparesInvoices: "",
  whoPreparesInvoicesOther: "",
  techComfort: "",

  currentSoftware: "",
  currentSoftwareOther: "",
  usesTimeTracking: "",
  documentManagement: "",
  hasDataToMigrate: "",
  dataFormat: "",
  dataFormatOther: "",
  primaryDevice: "",

  mainPainPoint: "",
  decisionMaker: "",
  urgentChallenges: [],
  urgentChallengesOther: "",
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
    price: number;
  };
}

export interface StepProps {
  data: OnboardingData;
  setData: (updates: Partial<OnboardingData>) => void;
  lang: Lang;
  errors: Record<string, string>;
}
