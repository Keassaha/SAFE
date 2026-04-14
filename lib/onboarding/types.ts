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

  /* ── Étape 4 : Fidéicommis ── */
  hasTrustAccount: string;
  trustAccountCount: string;
  reconciliationFrequency: string;
  reconciliationFrequencyOther: string;
  auditIssues: string;
  nextInspectionDate: string;

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

  /* ── Étape 7 : Priorités ── */
  urgentChallenges: string[];
  urgentChallengesOther: string;
  goLiveTimeline: string;
  referralSource: string;

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

  billingMethod: "",
  billingMethodOther: "",
  hourlyRate: "",
  billingFrequency: "",
  billingFrequencyOther: "",
  paymentTerms: "",
  paymentTermsOther: "",
  paymentMethods: [],
  paymentMethodsOther: "",

  hasTrustAccount: "",
  trustAccountCount: "",
  reconciliationFrequency: "",
  reconciliationFrequencyOther: "",
  auditIssues: "",
  nextInspectionDate: "",

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

  urgentChallenges: [],
  urgentChallengesOther: "",
  goLiveTimeline: "",
  referralSource: "",

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
