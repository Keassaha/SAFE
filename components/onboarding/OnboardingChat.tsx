"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Send,
  CheckCircle2,
  Shield,
  ChevronRight,
  ChevronLeft,
  Calendar,
  User,
  Mail,
  Phone,
  Building2,
  ArrowRight,
  Sparkles,
  Save,
  Clock,
  MapPin,
  Globe,
  MessageSquare,
  Gift,
  CheckCircle,
  TrendingUp,
  Zap,
  Lock,
  Users,
  AlertTriangle,
} from "lucide-react";
import type { OnboardingData, CalculationResult, Lang } from "@/lib/onboarding/types";
import { INITIAL_DATA } from "@/lib/onboarding/types";
import { calculateOnboardingValue } from "@/lib/onboarding/calculator";
import { PROVINCES } from "@/lib/onboarding/taxes";

/* ─────────────────────────────────────────────
   Types
   ───────────────────────────────────────────── */

interface QuestionOption {
  label: string;
  value: string;
  hasTextField?: boolean;
}

interface Question {
  key: string;
  phase: number;
  text: { fr: string; en: string };
  type: "single" | "multi" | "open" | "contact" | "email";
  options?: { fr: QuestionOption[]; en: QuestionOption[] };
  placeholder?: { fr: string; en: string };
  condition?: (responses: Partial<OnboardingData>) => boolean;
  maxSelect?: number;
  dataKey: keyof OnboardingData;
  otherKey?: keyof OnboardingData;
}

interface ChatMessage {
  id: string;
  sender: "host" | "user";
  text: string;
  timestamp: number;
  options?: QuestionOption[];
  questionType?: Question["type"];
  questionKey?: string;
  placeholder?: string;
  answered?: boolean;
  maxSelect?: number;
}

/* ─────────────────────────────────────────────
   Helper: unique ID
   ───────────────────────────────────────────── */

function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

/* ─────────────────────────────────────────────
   Constants
   ───────────────────────────────────────────── */

const ESTIMATED_MINUTES = 10;

const PHASES: { fr: string; en: string }[] = [
  { fr: "Cabinet", en: "Firm" },
  { fr: "Pratique", en: "Practice" },
  { fr: "Facturation", en: "Billing" },
  { fr: "Fideicommis", en: "Trust" },
  { fr: "Equipe", en: "Team" },
  { fr: "Outils", en: "Tools" },
  { fr: "Priorites", en: "Priorities" },
  { fr: "Contact", en: "Contact" },
];

const PHASE_TRANSITIONS: Record<number, { fr: string; en: string }> = {
  2: {
    fr: "✅ Parfait ! J’ai une bonne idée de votre cabinet.\n\n⚖️ Parlons maintenant de votre pratique juridique.",
    en: "✅ Great! I have a good picture of your firm.\n\n⚖️ Let’s talk about your legal practice now.",
  },
  3: {
    fr: "⚖️ Excellent !\n\n💰 Abordons la facturation — c’est là que SAFE fait vraiment la différence.",
    en: "⚖️ Excellent!\n\n💰 Let’s talk billing — this is where SAFE really makes a difference.",
  },
  4: {
    fr: "💰 Bien noté !\n\n🏦 Parlons fidéicommis — un sujet crucial pour la conformité.",
    en: "💰 Noted!\n\n🏦 Let’s discuss trust accounts — a crucial compliance topic.",
  },
  5: {
    fr: "🏦 Compris !\n\n👥 Quelques questions sur votre équipe et vos accès.",
    en: "🏦 Got it!\n\n👥 A few questions about your team and access.",
  },
  6: {
    fr: "👥 Parfait !\n\n🔧 Voyons vos outils actuels et vos besoins de migration.",
    en: "👥 Perfect!\n\n🔧 Let’s look at your current tools and migration needs.",
  },
  7: {
    fr: "🔧 Noté !\n\n🎯 Dernière section : vos priorités et votre timeline.",
    en: "🔧 Noted!\n\n🎯 Last section: your priorities and timeline.",
  },
  8: {
    fr: "🎯 On y est presque !\n\n📅 Planifions votre appel de démarrage.",
    en: "🎯 Almost there!\n\n📅 Let’s schedule your onboarding call.",
  },
};

/* ─────────────────────────────────────────────
   Province options builder
   ───────────────────────────────────────────── */

function buildProvinceOptions(): { fr: QuestionOption[]; en: QuestionOption[] } {
  const fr: QuestionOption[] = PROVINCES.map((p) => ({
    label: p.fr,
    value: p.code,
  }));
  const en: QuestionOption[] = PROVINCES.map((p) => ({
    label: p.en,
    value: p.code,
  }));
  return { fr, en };
}

/* ─────────────────────────────────────────────
   Questions
   ───────────────────────────────────────────── */

const QUESTIONS: Question[] = [
  // ═══ Phase 1 : Informations du cabinet ═══
  {
    key: "firmName",
    phase: 1,
    text: {
      fr: "Quel est le nom de votre cabinet ?",
      en: "What is your firm’s name?",
    },
    type: "open",
    dataKey: "firmName",
    placeholder: {
      fr: "Ex: Cabinet Tremblay & Associés",
      en: "E.g.: Tremblay & Associates",
    },
  },
  {
    key: "leadName",
    phase: 1,
    text: {
      fr: "Quel est votre nom complet (avocat principal) ?",
      en: "What is your full name (lead attorney)?",
    },
    type: "open",
    dataKey: "leadName",
    placeholder: {
      fr: "Prénom et nom",
      en: "First and last name",
    },
  },
  {
    key: "email",
    phase: 1,
    text: {
      fr: "Quel est votre courriel professionnel ?",
      en: "What is your professional email?",
    },
    type: "email",
    dataKey: "email",
    placeholder: {
      fr: "nom@cabinet.ca",
      en: "name@firm.ca",
    },
  },
  {
    key: "barNumber",
    phase: 1,
    text: {
      fr: "Quel est votre numéro de membre du Barreau ?",
      en: "What is your Law Society membership number?",
    },
    type: "open",
    dataKey: "barNumber",
    placeholder: {
      fr: "Ex: 12345-6",
      en: "E.g.: 12345-6",
    },
  },
  {
    key: "province",
    phase: 1,
    text: {
      fr: "Dans quelle province exercez-vous ?",
      en: "In which province do you practice?",
    },
    type: "single",
    dataKey: "province",
    options: buildProvinceOptions(),
  },

  // ═══ Phase 2 : Pratique ═══
  {
    key: "practiceAreas",
    phase: 2,
    text: {
      fr: "Quels sont vos domaines de pratique ? (Plusieurs choix possibles)",
      en: "What are your practice areas? (Multiple choices allowed)",
    },
    type: "multi",
    dataKey: "practiceAreas",
    otherKey: "practiceAreasOther",
    options: {
      fr: [
        { label: "Droit familial", value: "family" },
        { label: "Droit civil / Litige", value: "civil" },
        { label: "Droit criminel", value: "criminal" },
        { label: "Droit immobilier", value: "real_estate" },
        { label: "Droit des affaires", value: "corporate" },
        { label: "Immigration", value: "immigration" },
        { label: "Droit administratif", value: "admin" },
        { label: "Autre", value: "other", hasTextField: true },
      ],
      en: [
        { label: "Family Law", value: "family" },
        { label: "Civil Law / Litigation", value: "civil" },
        { label: "Criminal Law", value: "criminal" },
        { label: "Real Estate Law", value: "real_estate" },
        { label: "Business Law", value: "corporate" },
        { label: "Immigration", value: "immigration" },
        { label: "Administrative Law", value: "admin" },
        { label: "Other", value: "other", hasTextField: true },
      ],
    },
  },
  {
    key: "monthlyNewFiles",
    phase: 2,
    text: {
      fr: "Combien de nouveaux dossiers ouvrez-vous par mois ?",
      en: "How many new files do you open per month?",
    },
    type: "single",
    dataKey: "monthlyNewFiles",
    options: {
      fr: [
        { label: "1 à 5", value: "1-5" },
        { label: "6 à 15", value: "6-15" },
        { label: "16 à 30", value: "16-30" },
        { label: "30+", value: "30+" },
      ],
      en: [
        { label: "1 to 5", value: "1-5" },
        { label: "6 to 15", value: "6-15" },
        { label: "16 to 30", value: "16-30" },
        { label: "30+", value: "30+" },
      ],
    },
  },
  {
    key: "clientType",
    phase: 2,
    text: {
      fr: "Quel est votre type de clientèle principal ?",
      en: "What is your primary client type?",
    },
    type: "single",
    dataKey: "clientType",
    otherKey: "clientTypeOther",
    options: {
      fr: [
        { label: "Particuliers", value: "individuals" },
        { label: "Entreprises", value: "businesses" },
        { label: "Mixte", value: "mixed" },
        { label: "Autre", value: "other", hasTextField: true },
      ],
      en: [
        { label: "Individuals", value: "individuals" },
        { label: "Businesses", value: "businesses" },
        { label: "Mixed", value: "mixed" },
        { label: "Other", value: "other", hasTextField: true },
      ],
    },
  },

  // ═══ Phase 3 : Facturation ═══
  {
    key: "billingMethod",
    phase: 3,
    text: {
      fr: "Quel est votre mode de facturation principal ?",
      en: "What is your primary billing method?",
    },
    type: "single",
    dataKey: "billingMethod",
    otherKey: "billingMethodOther",
    options: {
      fr: [
        { label: "Horaire", value: "hourly" },
        { label: "Forfait", value: "flat_fee" },
        { label: "Par tâche", value: "per_task" },
        { label: "Mixte", value: "mixed" },
        { label: "Autre", value: "other", hasTextField: true },
      ],
      en: [
        { label: "Hourly", value: "hourly" },
        { label: "Flat fee", value: "flat_fee" },
        { label: "Per task", value: "per_task" },
        { label: "Mixed", value: "mixed" },
        { label: "Other", value: "other", hasTextField: true },
      ],
    },
  },
  {
    key: "hourlyRate",
    phase: 3,
    text: {
      fr: "Quel est votre taux horaire moyen ?",
      en: "What is your average hourly rate?",
    },
    type: "open",
    dataKey: "hourlyRate",
    placeholder: {
      fr: "Ex: 250 $/h",
      en: "E.g.: $250/h",
    },
    condition: (r) => r.billingMethod === "hourly" || r.billingMethod === "mixed",
  },
  {
    key: "billingFrequency",
    phase: 3,
    text: {
      fr: "À quelle fréquence facturez-vous ?",
      en: "How often do you bill?",
    },
    type: "single",
    dataKey: "billingFrequency",
    otherKey: "billingFrequencyOther",
    options: {
      fr: [
        { label: "Mensuelle", value: "monthly" },
        { label: "À la fin du mandat", value: "end_of_mandate" },
        { label: "Bimensuelle", value: "bimonthly" },
        { label: "Autre", value: "other", hasTextField: true },
      ],
      en: [
        { label: "Monthly", value: "monthly" },
        { label: "End of mandate", value: "end_of_mandate" },
        { label: "Bimonthly", value: "bimonthly" },
        { label: "Other", value: "other", hasTextField: true },
      ],
    },
  },
  {
    key: "paymentTerms",
    phase: 3,
    text: {
      fr: "Quels sont vos délais de paiement ?",
      en: "What are your payment terms?",
    },
    type: "single",
    dataKey: "paymentTerms",
    otherKey: "paymentTermsOther",
    options: {
      fr: [
        { label: "30 jours", value: "30_days" },
        { label: "60 jours", value: "60_days" },
        { label: "Sur réception", value: "on_receipt" },
        { label: "Autre", value: "other", hasTextField: true },
      ],
      en: [
        { label: "30 days", value: "30_days" },
        { label: "60 days", value: "60_days" },
        { label: "Upon receipt", value: "on_receipt" },
        { label: "Other", value: "other", hasTextField: true },
      ],
    },
  },
  {
    key: "paymentMethods",
    phase: 3,
    text: {
      fr: "Quelles méthodes de paiement acceptez-vous ? (Plusieurs choix possibles)",
      en: "Which payment methods do you accept? (Multiple choices allowed)",
    },
    type: "multi",
    dataKey: "paymentMethods",
    otherKey: "paymentMethodsOther",
    options: {
      fr: [
        { label: "Virement bancaire", value: "wire" },
        { label: "Chèque", value: "cheque" },
        { label: "Traite bancaire", value: "bank_draft" },
        { label: "Carte de crédit", value: "credit_card" },
        { label: "Interac", value: "interac" },
        { label: "Espèces", value: "cash" },
      ],
      en: [
        { label: "Wire transfer", value: "wire" },
        { label: "Cheque", value: "cheque" },
        { label: "Bank draft", value: "bank_draft" },
        { label: "Credit card", value: "credit_card" },
        { label: "Interac", value: "interac" },
        { label: "Cash", value: "cash" },
      ],
    },
  },

  // ═══ Phase 4 : Fidéicommis ═══
  {
    key: "hasTrustAccount",
    phase: 4,
    text: {
      fr: "Avez-vous un compte en fidéicommis ?",
      en: "Do you have a trust account?",
    },
    type: "single",
    dataKey: "hasTrustAccount",
    options: {
      fr: [
        { label: "Oui", value: "yes" },
        { label: "Non", value: "no" },
      ],
      en: [
        { label: "Yes", value: "yes" },
        { label: "No", value: "no" },
      ],
    },
  },
  {
    key: "trustAccountCount",
    phase: 4,
    text: {
      fr: "Combien de comptes en fidéicommis gérez-vous ?",
      en: "How many trust accounts do you manage?",
    },
    type: "single",
    dataKey: "trustAccountCount",
    condition: (r) => r.hasTrustAccount === "yes",
    options: {
      fr: [
        { label: "1", value: "1" },
        { label: "2", value: "2" },
        { label: "3+", value: "3+" },
      ],
      en: [
        { label: "1", value: "1" },
        { label: "2", value: "2" },
        { label: "3+", value: "3+" },
      ],
    },
  },
  {
    key: "reconciliationFrequency",
    phase: 4,
    text: {
      fr: "À quelle fréquence faites-vous la réconciliation ?",
      en: "How often do you reconcile?",
    },
    type: "single",
    dataKey: "reconciliationFrequency",
    otherKey: "reconciliationFrequencyOther",
    condition: (r) => r.hasTrustAccount === "yes",
    options: {
      fr: [
        { label: "Mensuelle", value: "monthly" },
        { label: "Trimestrielle", value: "quarterly" },
        { label: "Annuelle", value: "yearly" },
        { label: "Jamais", value: "never" },
      ],
      en: [
        { label: "Monthly", value: "monthly" },
        { label: "Quarterly", value: "quarterly" },
        { label: "Yearly", value: "yearly" },
        { label: "Never", value: "never" },
      ],
    },
  },
  {
    key: "auditIssues",
    phase: 4,
    text: {
      fr: "Avez-vous eu des problèmes lors d’une inspection du Barreau ?",
      en: "Have you had issues during a Law Society audit?",
    },
    type: "single",
    dataKey: "auditIssues",
    options: {
      fr: [
        { label: "Non", value: "no" },
        { label: "Oui", value: "yes" },
        { label: "Première inspection", value: "first" },
      ],
      en: [
        { label: "No", value: "no" },
        { label: "Yes", value: "yes" },
        { label: "First audit", value: "first" },
      ],
    },
  },

  // ═══ Phase 5 : Équipe ═══
  {
    key: "teamStructure",
    phase: 5,
    text: {
      fr: "Comment décririez-vous la structure de votre équipe ?",
      en: "How would you describe your team structure?",
    },
    type: "single",
    dataKey: "teamStructure",
    otherKey: "teamStructureOther",
    options: {
      fr: [
        { label: "Solo", value: "solo" },
        { label: "Avec adjoint(e)", value: "with_assistant" },
        { label: "Petite équipe", value: "small_team" },
        { label: "Cabinet structuré", value: "structured" },
      ],
      en: [
        { label: "Solo", value: "solo" },
        { label: "With assistant", value: "with_assistant" },
        { label: "Small team", value: "small_team" },
        { label: "Structured firm", value: "structured" },
      ],
    },
  },
  {
    key: "totalUsers",
    phase: 5,
    text: {
      fr: "Combien d’utilisateurs auront besoin d’accès à SAFE ?",
      en: "How many users will need access to SAFE?",
    },
    type: "single",
    dataKey: "totalUsers",
    options: {
      fr: [
        { label: "1", value: "1" },
        { label: "2", value: "2" },
        { label: "3 à 5", value: "3-5" },
        { label: "6 à 15", value: "6-15" },
      ],
      en: [
        { label: "1", value: "1" },
        { label: "2", value: "2" },
        { label: "3 to 5", value: "3-5" },
        { label: "6 to 15", value: "6-15" },
      ],
    },
  },
  {
    key: "whoPreparesInvoices",
    phase: 5,
    text: {
      fr: "Qui prépare les factures dans votre cabinet ?",
      en: "Who prepares invoices in your firm?",
    },
    type: "single",
    dataKey: "whoPreparesInvoices",
    otherKey: "whoPreparesInvoicesOther",
    options: {
      fr: [
        { label: "Moi-même", value: "self" },
        { label: "Adjoint(e)", value: "assistant" },
        { label: "Comptable", value: "accountant" },
        { label: "Autre", value: "other", hasTextField: true },
      ],
      en: [
        { label: "Myself", value: "self" },
        { label: "Assistant", value: "assistant" },
        { label: "Accountant", value: "accountant" },
        { label: "Other", value: "other", hasTextField: true },
      ],
    },
  },
  {
    key: "techComfort",
    phase: 5,
    text: {
      fr: "Quel est votre niveau de confort technologique ?",
      en: "What is your tech comfort level?",
    },
    type: "single",
    dataKey: "techComfort",
    options: {
      fr: [
        { label: "Débutant", value: "beginner" },
        { label: "Intermédiaire", value: "intermediate" },
        { label: "Avancé", value: "advanced" },
      ],
      en: [
        { label: "Beginner", value: "beginner" },
        { label: "Intermediate", value: "intermediate" },
        { label: "Advanced", value: "advanced" },
      ],
    },
  },

  // ═══ Phase 6 : Outils & Migration ═══
  {
    key: "currentSoftware",
    phase: 6,
    text: {
      fr: "Quel logiciel utilisez-vous actuellement pour gérer votre cabinet ?",
      en: "What software do you currently use to manage your firm?",
    },
    type: "single",
    dataKey: "currentSoftware",
    otherKey: "currentSoftwareOther",
    options: {
      fr: [
        { label: "Aucun / Excel", value: "none_excel" },
        { label: "Juris Concept", value: "juris_concept" },
        { label: "CLIO", value: "clio" },
        { label: "Practice Panther", value: "practice_panther" },
        { label: "Autre", value: "other", hasTextField: true },
      ],
      en: [
        { label: "None / Excel", value: "none_excel" },
        { label: "Juris Concept", value: "juris_concept" },
        { label: "CLIO", value: "clio" },
        { label: "Practice Panther", value: "practice_panther" },
        { label: "Other", value: "other", hasTextField: true },
      ],
    },
  },
  {
    key: "hasDataToMigrate",
    phase: 6,
    text: {
      fr: "Avez-vous des données à migrer vers SAFE ?",
      en: "Do you have data to migrate to SAFE?",
    },
    type: "single",
    dataKey: "hasDataToMigrate",
    options: {
      fr: [
        { label: "Oui", value: "yes" },
        { label: "Non", value: "no" },
        { label: "Je ne sais pas", value: "not_sure" },
      ],
      en: [
        { label: "Yes", value: "yes" },
        { label: "No", value: "no" },
        { label: "Not sure", value: "not_sure" },
      ],
    },
  },
  {
    key: "dataFormat",
    phase: 6,
    text: {
      fr: "Dans quels formats sont vos données ? (Plusieurs choix possibles)",
      en: "What formats is your data in? (Multiple choices allowed)",
    },
    type: "multi",
    dataKey: "dataFormat",
    otherKey: "dataFormatOther",
    condition: (r) => r.hasDataToMigrate === "yes",
    options: {
      fr: [
        { label: "Excel / CSV", value: "excel_csv" },
        { label: "PDF", value: "pdf" },
        { label: "Word / Documents texte", value: "word" },
        { label: "Logiciel comptable (ex: QuickBooks, Sage)", value: "accounting_software" },
        { label: "Logiciel juridique (ex: Juris Concept, CLIO)", value: "legal_software" },
        { label: "Papier / Numérisation", value: "paper" },
        { label: "Autre", value: "autre", hasTextField: true },
      ],
      en: [
        { label: "Excel / CSV", value: "excel_csv" },
        { label: "PDF", value: "pdf" },
        { label: "Word / Text documents", value: "word" },
        { label: "Accounting software (e.g. QuickBooks, Sage)", value: "accounting_software" },
        { label: "Legal software (e.g. Juris Concept, CLIO)", value: "legal_software" },
        { label: "Paper / Scanned", value: "paper" },
        { label: "Other", value: "autre", hasTextField: true },
      ],
    },
  },
  {
    key: "primaryDevice",
    phase: 6,
    text: {
      fr: "Quels appareils utilisez-vous pour travailler ? (Sélectionnez tous ceux qui s'appliquent)",
      en: "Which devices do you use for work? (Select all that apply)",
    },
    type: "multi",
    maxSelect: 4,
    dataKey: "primaryDevice",
    options: {
      fr: [
        { label: "Ordinateur", value: "computer" },
        { label: "Tablette", value: "tablet" },
        { label: "Téléphone", value: "phone" },
        { label: "Mixte", value: "mixed" },
      ],
      en: [
        { label: "Computer", value: "computer" },
        { label: "Tablet", value: "tablet" },
        { label: "Phone", value: "phone" },
        { label: "Mixed", value: "mixed" },
      ],
    },
  },

  // ═══ Phase 7 : Priorités ═══
  {
    key: "urgentChallenges",
    phase: 7,
    text: {
      fr: "Quels sont vos défis les plus urgents ? (Maximum 3 choix)",
      en: "What are your most urgent challenges? (Maximum 3 choices)",
    },
    type: "multi",
    maxSelect: 3,
    dataKey: "urgentChallenges",
    otherKey: "urgentChallengesOther",
    options: {
      fr: [
        { label: "Facturation lente", value: "slow_billing" },
        { label: "Fidéicommis non conforme", value: "trust_noncompliant" },
        { label: "Perte de temps admin", value: "admin_time" },
        { label: "Suivi des dossiers", value: "case_tracking" },
        { label: "Préparation inspection", value: "audit_prep" },
        { label: "Autre", value: "other", hasTextField: true },
      ],
      en: [
        { label: "Slow billing", value: "slow_billing" },
        { label: "Non-compliant trust account", value: "trust_noncompliant" },
        { label: "Lost admin time", value: "admin_time" },
        { label: "Case tracking", value: "case_tracking" },
        { label: "Audit preparation", value: "audit_prep" },
        { label: "Other", value: "other", hasTextField: true },
      ],
    },
  },
  {
    key: "goLiveTimeline",
    phase: 7,
    text: {
      fr: "Quand souhaitez-vous être opérationnel avec SAFE ?",
      en: "When would you like to go live with SAFE?",
    },
    type: "single",
    dataKey: "goLiveTimeline",
    options: {
      fr: [
        { label: "Immédiatement", value: "immediately" },
        { label: "1 à 2 semaines", value: "1_2_weeks" },
        { label: "1 mois", value: "1_month" },
        { label: "Pas pressé", value: "no_rush" },
      ],
      en: [
        { label: "Immediately", value: "immediately" },
        { label: "1 to 2 weeks", value: "1_2_weeks" },
        { label: "1 month", value: "1_month" },
        { label: "No rush", value: "no_rush" },
      ],
    },
  },

  // ═══ Phase 8 : Contact & RDV ═══
  {
    key: "contact",
    phase: 8,
    text: {
      fr: "🎉 Pour finaliser, laissez-moi vos coordonnées et vos préférences pour l’appel de démarrage.",
      en: "🎉 To finalize, leave me your contact details and preferences for the onboarding call.",
    },
    type: "contact",
    dataKey: "phone",
  },
];

/* ─────────────────────────────────────────────
   Reactions
   ───────────────────────────────────────────── */

function getReaction(key: string, value: string | string[], lang: Lang, allResponses: Partial<OnboardingData>): string | null {
  switch (key) {
    case "province": {
      const prov = PROVINCES.find((p) => p.code === value);
      const provName = prov ? prov[lang] : String(value);
      return lang === "fr"
        ? `Parfait, je connais bien les exigences du Barreau de ${provName} !`
        : `Great, I’m very familiar with the ${provName} Law Society requirements!`;
    }

    case "practiceAreas":
      if (Array.isArray(value) && value.length >= 3) {
        return lang === "fr"
          ? "Wow, une pratique diversifiée ! SAFE excelle dans la gestion multi-domaines."
          : "Wow, a diverse practice! SAFE excels at multi-practice management.";
      }
      return null;

    case "monthlyNewFiles":
      if (value === "30+") {
        return lang === "fr"
          ? "Un volume impressionnant ! L’automatisation va vous faire gagner un temps considérable."
          : "Impressive volume! Automation will save you considerable time.";
      }
      return null;

    case "billingMethod":
      if (value === "mixed") {
        return lang === "fr"
          ? "La facturation mixte est courante chez les cabinets en croissance. SAFE gère tous les modes."
          : "Mixed billing is common in growing firms. SAFE handles all billing modes.";
      }
      return null;

    case "hasTrustAccount":
      if (value === "yes") {
        return lang === "fr"
          ? "Le fidéicommis est le nerf de la guerre pour le Barreau. On va s’assurer que tout est en ordre."
          : "Trust accounting is critical for the Law Society. We’ll make sure everything is in order.";
      }
      return null;

    case "trustAccountCount":
      if (value === "3+") {
        return lang === "fr"
          ? "Plusieurs comptes en fidéicommis demandent une gestion rigoureuse. SAFE automatise la réconciliation pour chacun."
          : "Multiple trust accounts require rigorous management. SAFE automates reconciliation for each one.";
      }
      return null;

    case "reconciliationFrequency":
      if (value === "never" || value === "yearly") {
        return lang === "fr"
          ? "La réconciliation mensuelle est obligatoire. SAFE l’automatise complètement — plus de stress."
          : "Monthly reconciliation is mandatory. SAFE automates it completely — no more stress.";
      }
      return null;

    case "totalUsers":
      if (value === "3-5" || value === "6-15") {
        return lang === "fr"
          ? "Une équipe de cette taille bénéficiera énormément de l’automatisation SAFE."
          : "A team this size will benefit enormously from SAFE’s automation.";
      }
      return null;

    case "techComfort":
      if (value === "beginner") {
        return lang === "fr"
          ? "Aucun souci ! SAFE est conçu pour être intuitif. Nous offrons un accompagnement personnalisé."
          : "No worries! SAFE is designed to be intuitive. We offer personalized onboarding support.";
      }
      return null;

    case "currentSoftware":
      if (value === "none_excel") {
        return lang === "fr"
          ? "Passer d’Excel à SAFE va transformer votre quotidien. Fini les erreurs manuelles."
          : "Moving from Excel to SAFE will transform your daily workflow. No more manual errors.";
      }
      if (value === "clio" || value === "practice_panther") {
        return lang === "fr"
          ? "SAFE est spécifiquement conçu pour les avocats canadiens, avec la conformité Barreau intégrée."
          : "SAFE is specifically built for Canadian lawyers, with built-in Law Society compliance.";
      }
      return null;

    case "hasDataToMigrate":
      if (value === "yes") {
        return lang === "fr"
          ? "Notre équipe s’occupe de la migration — vous n’avez rien à faire."
          : "Our team handles the migration — you don’t have to do anything.";
      }
      return null;

    case "urgentChallenges":
      if (Array.isArray(value) && value.length >= 2) {
        return lang === "fr"
          ? "Ces défis sont exactement ce que SAFE résout au quotidien. Vous êtes au bon endroit."
          : "These challenges are exactly what SAFE solves every day. You’re in the right place.";
      }
      return null;

    case "goLiveTimeline":
      if (value === "immediately") {
        return lang === "fr"
          ? "Parfait, on peut vous configurer en 48h !"
          : "Perfect, we can have you set up in 48 hours!";
      }
      return null;

    default:
      return null;
  }
}

/* ─────────────────────────────────────────────
   Main Component
   ───────────────────────────────────────────── */

export default function OnboardingChat() {
  const [lang, setLang] = useState<Lang | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(-1);
  const [data, setData] = useState<Partial<OnboardingData>>({ ...INITIAL_DATA });
  const [isTyping, setIsTyping] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [started, setStarted] = useState(false);
  const [multiSelect, setMultiSelect] = useState<string[]>([]);
  const [customText, setCustomText] = useState("");
  const [showCustomField, setShowCustomField] = useState(false);
  const [openText, setOpenText] = useState("");
  const [contactForm, setContactForm] = useState({
    phone: "",
    address: "",
    website: "",
    preferredDate: "",
    preferredTime: "",
    optionalMessage: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [questionHistory, setQuestionHistory] = useState<number[]>([]);
  const [savedFeedback, setSavedFeedback] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const lastHostRef = useRef<HTMLDivElement>(null);

  const scrollToLatest = useCallback(() => {
    setTimeout(() => {
      lastHostRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  }, []);

  // Simulate typing delay then add host message
  const addHostMessage = useCallback(
    (text: string, question?: Question, effectiveLang?: Lang) => {
      setIsTyping(true);
      const delay = Math.min(1200, 400 + text.length * 8);

      return new Promise<void>((resolve) => {
        setTimeout(() => {
          setIsTyping(false);
          const msg: ChatMessage = {
            id: uid(),
            sender: "host",
            text,
            timestamp: Date.now(),
          };
          if (question && effectiveLang) {
            const opts = question.options?.[effectiveLang];
            msg.options = opts;
            msg.questionType = question.type;
            msg.questionKey = question.key;
            msg.placeholder = question.placeholder?.[effectiveLang];
            msg.maxSelect = question.maxSelect;
          }
          setMessages((prev) => [...prev, msg]);
          scrollToLatest();
          resolve();
        }, delay);
      });
    },
    [scrollToLatest]
  );

  // Add user message
  const addUserMessage = useCallback(
    (text: string) => {
      setMessages((prev) => [
        ...prev,
        {
          id: uid(),
          sender: "user",
          text,
          timestamp: Date.now(),
        },
      ]);
    },
    []
  );

  // Show intro message
  useEffect(() => {
    if (!started) {
      const timer = setTimeout(() => {
        setMessages([
          {
            id: uid(),
            sender: "host",
            text: "👋 Bonjour ! Hello!\n\nJe suis Jérémie Tiahou, fondateur de SAFE. Ce court questionnaire me permettra de configurer votre espace exactement selon votre pratique.\n\nI’m Jérémie Tiahou, founder of SAFE. This short questionnaire will allow me to set up your workspace exactly around your practice.\n\n🌐 Choisissez votre langue / Choose your language:",
            timestamp: Date.now(),
          },
        ]);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [started]);

  // Ref to access latest data without re-creating callbacks
  const dataRef = useRef(data);
  dataRef.current = data;

  const langRef = useRef(lang);
  langRef.current = lang;

  // Advance to next question
  const advanceQuestion = useCallback(
    async (nextIdx: number) => {
      const currentLang = langRef.current;
      if (!currentLang) return;

      let idx = nextIdx;
      while (idx < QUESTIONS.length) {
        const q = QUESTIONS[idx];
        if (!q.condition || q.condition(dataRef.current)) break;
        idx++;
      }

      if (idx >= QUESTIONS.length) {
        setShowResults(true);
        return;
      }

      const nextQ = QUESTIONS[idx];
      const prevQ = idx > 0 ? QUESTIONS[idx - 1] : null;

      // Phase transition message
      if (prevQ && nextQ.phase !== prevQ.phase && PHASE_TRANSITIONS[nextQ.phase]) {
        await addHostMessage(PHASE_TRANSITIONS[nextQ.phase][currentLang]);
      }

      // Track history for back navigation
      setQuestionHistory((prev) => {
        const currentIdx = QUESTIONS.findIndex((_, i) => i === nextIdx - 1);
        if (currentIdx >= 0 && (prev.length === 0 || prev[prev.length - 1] !== currentIdx)) {
          return [...prev, currentIdx];
        }
        return prev;
      });

      // Ask the question
      await addHostMessage(nextQ.text[currentLang], nextQ, currentLang);
      setCurrentQuestion(idx);
    },
    [addHostMessage]
  );

  // Go back to previous question
  const handleGoBack = useCallback(() => {
    if (questionHistory.length === 0) return;
    const currentLang = langRef.current;
    if (!currentLang) return;

    const prevIdx = questionHistory[questionHistory.length - 1];
    setQuestionHistory((prev) => prev.slice(0, -1));

    // Find the message for the previous question's key
    const prevQ = QUESTIONS[prevIdx];
    if (!prevQ) return;

    // Remove messages from the current question onwards
    setMessages((prev) => {
      const prevQMsgIdx = prev.findIndex((m) => m.questionKey === prevQ.key);
      if (prevQMsgIdx >= 0) {
        return prev.slice(0, prevQMsgIdx);
      }
      return prev;
    });

    // Re-ask the previous question
    const reask = async () => {
      const prevPrevQ = prevIdx > 0 ? QUESTIONS[prevIdx - 1] : null;
      if (prevPrevQ && prevQ.phase !== prevPrevQ.phase && PHASE_TRANSITIONS[prevQ.phase]) {
        await addHostMessage(PHASE_TRANSITIONS[prevQ.phase][currentLang]);
      }
      await addHostMessage(prevQ.text[currentLang], prevQ, currentLang);
      setCurrentQuestion(prevIdx);
    };
    reask();
  }, [questionHistory, addHostMessage]);

  // Save audit to localStorage
  const handleSave = useCallback(() => {
    const draft = {
      data,
      messages: messages.map((m) => ({ ...m })),
      currentQuestion,
      lang,
      questionHistory,
      savedAt: Date.now(),
    };
    localStorage.setItem("safe-audit-draft", JSON.stringify(draft));
    setSavedFeedback(true);
    setTimeout(() => setSavedFeedback(false), 2000);
  }, [data, messages, currentQuestion, lang, questionHistory]);

  // Restore audit from localStorage on mount
  useEffect(() => {
    const raw = localStorage.getItem("safe-audit-draft");
    if (!raw) return;
    try {
      const draft = JSON.parse(raw);
      if (draft.data && draft.lang && draft.messages?.length > 0) {
        setData(draft.data);
        setMessages(draft.messages);
        setCurrentQuestion(draft.currentQuestion ?? -1);
        setLang(draft.lang);
        setQuestionHistory(draft.questionHistory ?? []);
        setStarted(true);
      }
    } catch {
      // ignore invalid draft
    }
  }, []);

  // Handle language selection
  const handleLangSelect = useCallback(
    (selectedLang: Lang) => {
      setLang(selectedLang);
      setStarted(true);

      const userText = selectedLang === "fr" ? "🇫🇷 Français" : "🇬🇧 English";
      addUserMessage(userText);

      const introMsg =
        selectedLang === "fr"
          ? "Parfait ! On y va en français.\n\n🔒 Toutes vos réponses sont confidentielles et servent uniquement à configurer votre espace SAFE.\n\nCommençons par les informations de votre cabinet."
          : "Perfect! Let’s go in English.\n\n🔒 All your answers are confidential and only used to set up your SAFE workspace.\n\nLet’s start with your firm information.";

      addHostMessage(introMsg).then(() => {
        advanceQuestion(0);
      });
    },
    [addUserMessage, addHostMessage, advanceQuestion]
  );

  // Handle single option select
  const handleOptionSelect = useCallback(
    async (questionKey: string, option: QuestionOption) => {
      const currentLang = langRef.current;
      if (!currentLang) return;

      if (option.hasTextField && option.value === "other") {
        setShowCustomField(true);
        return;
      }

      setMessages((prev) =>
        prev.map((m) => (m.questionKey === questionKey ? { ...m, answered: true } : m))
      );

      addUserMessage(option.label);

      const question = QUESTIONS.find((q) => q.key === questionKey);
      const newData = { ...data, [question?.dataKey || questionKey]: option.value };
      setData(newData);

      const reaction = getReaction(questionKey, option.value, currentLang, newData);
      if (reaction) {
        await addHostMessage(reaction);
      }

      const currentIdx = QUESTIONS.findIndex((q) => q.key === questionKey);
      advanceQuestion(currentIdx + 1);
    },
    [data, addUserMessage, addHostMessage, advanceQuestion]
  );

  // Handle custom text submit for "Autre"/"Other"
  const handleCustomSubmit = useCallback(
    async (questionKey: string) => {
      const currentLang = langRef.current;
      if (!currentLang) return;
      if (!customText.trim()) return;

      setShowCustomField(false);
      setMessages((prev) =>
        prev.map((m) => (m.questionKey === questionKey ? { ...m, answered: true } : m))
      );

      addUserMessage(customText.trim());

      const question = QUESTIONS.find((q) => q.key === questionKey);
      const newData: Partial<OnboardingData> = { ...data };
      if (question?.otherKey) {
        (newData as Record<string, unknown>)[question.otherKey as string] = customText.trim();
      }
      (newData as Record<string, unknown>)[(question?.dataKey || questionKey) as string] = "other";
      setData(newData);
      setCustomText("");

      const currentIdx = QUESTIONS.findIndex((q) => q.key === questionKey);
      advanceQuestion(currentIdx + 1);
    },
    [customText, data, addUserMessage, advanceQuestion]
  );

  // Handle multi-select confirm
  const handleMultiConfirm = useCallback(
    async (questionKey: string, options: QuestionOption[]) => {
      const currentLang = langRef.current;
      if (!currentLang) return;
      if (multiSelect.length === 0) return;

      setMessages((prev) =>
        prev.map((m) => (m.questionKey === questionKey ? { ...m, answered: true } : m))
      );

      const labels = multiSelect.map(
        (v) => options.find((o) => o.value === v)?.label || v
      );
      addUserMessage(labels.join(", "));

      const question = QUESTIONS.find((q) => q.key === questionKey);
      const newData = { ...data, [question?.dataKey || questionKey]: multiSelect };
      setData(newData);
      setMultiSelect([]);

      const reaction = getReaction(questionKey, multiSelect, currentLang, newData);
      if (reaction) {
        await addHostMessage(reaction);
      }

      const currentIdx = QUESTIONS.findIndex((q) => q.key === questionKey);
      advanceQuestion(currentIdx + 1);
    },
    [multiSelect, data, addUserMessage, addHostMessage, advanceQuestion]
  );

  // Handle open text submit
  const handleOpenSubmit = useCallback(
    async (questionKey: string) => {
      const currentLang = langRef.current;
      if (!currentLang) return;
      const text = openText.trim();
      if (!text) return;

      setMessages((prev) =>
        prev.map((m) => (m.questionKey === questionKey ? { ...m, answered: true } : m))
      );

      addUserMessage(text);

      const question = QUESTIONS.find((q) => q.key === questionKey);
      const newData = { ...data, [question?.dataKey || questionKey]: text };
      setData(newData);
      setOpenText("");

      const thankMsg = currentLang === "fr" ? "Merci, c’est noté !" : "Thanks, noted!";
      await addHostMessage(thankMsg);

      const currentIdx = QUESTIONS.findIndex((q) => q.key === questionKey);
      advanceQuestion(currentIdx + 1);
    },
    [openText, data, addUserMessage, addHostMessage, advanceQuestion]
  );

  // Handle email submit
  const handleEmailSubmit = useCallback(
    async (questionKey: string) => {
      const currentLang = langRef.current;
      if (!currentLang) return;
      const text = openText.trim();
      if (!text) return;

      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(text)) {
        return;
      }

      setMessages((prev) =>
        prev.map((m) => (m.questionKey === questionKey ? { ...m, answered: true } : m))
      );

      addUserMessage(text);

      const question = QUESTIONS.find((q) => q.key === questionKey);
      const newData = { ...data, [question?.dataKey || questionKey]: text };
      setData(newData);
      setOpenText("");

      const thankMsg = currentLang === "fr" ? "Parfait, merci !" : "Great, thank you!";
      await addHostMessage(thankMsg);

      const currentIdx = QUESTIONS.findIndex((q) => q.key === questionKey);
      advanceQuestion(currentIdx + 1);
    },
    [openText, data, addUserMessage, addHostMessage, advanceQuestion]
  );

  // Handle open text skip
  const handleOpenSkip = useCallback(
    async (questionKey: string) => {
      setMessages((prev) =>
        prev.map((m) => (m.questionKey === questionKey ? { ...m, answered: true } : m))
      );

      const currentIdx = QUESTIONS.findIndex((q) => q.key === questionKey);
      advanceQuestion(currentIdx + 1);
    },
    [advanceQuestion]
  );

  // Handle contact form submit
  const handleContactSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const currentLang = langRef.current;
      if (!currentLang) return;

      const questionKey = "contact";
      setMessages((prev) =>
        prev.map((m) => (m.questionKey === questionKey ? { ...m, answered: true } : m))
      );

      const summary = contactForm.phone
        ? `${contactForm.phone} — ${contactForm.preferredDate || "?"}`
        : contactForm.preferredDate || (currentLang === "fr" ? "Coordonnées envoyées" : "Contact info sent");
      addUserMessage(summary);

      const newData: Partial<OnboardingData> = {
        ...data,
        phone: contactForm.phone,
        address: contactForm.address,
        website: contactForm.website,
        preferredDate: contactForm.preferredDate,
        preferredTime: contactForm.preferredTime,
        optionalMessage: contactForm.optionalMessage,
      };
      setData(newData);

      const closingMsg =
        currentLang === "fr"
          ? "Merci beaucoup ! Laissez-moi calculer la valeur de votre configuration SAFE..."
          : "Thank you so much! Let me calculate the value of your SAFE configuration...";
      await addHostMessage(closingMsg);

      setShowResults(true);
    },
    [contactForm, data, addUserMessage, addHostMessage]
  );

  // Handle final submission to API
  const handleFinalSubmit = useCallback(async () => {
    const currentLang = langRef.current;
    if (!currentLang) return;
    setSubmitting(true);

    try {
      await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lang: currentLang,
          data: data as OnboardingData,
        }),
      });
      setSubmitted(true);
    } catch {
      // Silently fail
      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  }, [data]);

  // Current phase for progress bar
  const currentPhase = currentQuestion >= 0 ? QUESTIONS[Math.min(currentQuestion, QUESTIONS.length - 1)]?.phase || 1 : 0;

  const calculationResult: CalculationResult | null = showResults
    ? calculateOnboardingValue(data as OnboardingData)
    : null;

  /* ─────────────────────────────────────────────
     Results Screen (Offer Reveal)
     ───────────────────────────────────────────── */

  if (showResults && calculationResult && lang) {
    return (
      <div className="flex flex-col h-full bg-[var(--safe-white)] text-[var(--safe-text-title)]">
        {/* Header */}
        <header className="shrink-0 z-10 border-b border-[var(--safe-sage)]/30 bg-[var(--safe-white)]/95 backdrop-blur-md px-4 py-3">
          <div className="max-w-2xl mx-auto flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[var(--safe-accent)] to-[var(--safe-text-title)] flex items-center justify-center text-xs font-bold text-[var(--safe-white)] shrink-0">
              JT
            </div>
            <div className="flex-1">
              <h1 className="text-lg font-semibold font-sans tracking-tight text-[var(--safe-text-title)]">
                {lang === "fr" ? "Votre offre personnalisée" : "Your personalized offer"}
              </h1>
              <p className="text-xs text-[var(--safe-text-secondary)] font-sans">
                Jérémie Tiahou — {new Date().toLocaleDateString(lang === "fr" ? "fr-CA" : "en-CA")}
              </p>
            </div>
          </div>
        </header>

        <main className="flex-1 min-h-0 overflow-y-auto px-4 py-8">
          <div className="max-w-2xl mx-auto space-y-6">
            {/* Jérémie’s message */}
            <div className="audit-slide-up">
              <div className="flex items-start gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--safe-accent)] to-[var(--safe-text-title)] flex items-center justify-center text-xs font-bold text-[var(--safe-white)] shrink-0">
                  JT
                </div>
                <div className="max-w-[80%] rounded-safe-md rounded-bl-md bg-[var(--safe-text-title)] text-[var(--safe-white)] border border-[var(--safe-text-title)]/10 px-4 py-3 text-sm font-sans leading-relaxed whitespace-pre-line">
                  {lang === "fr"
                    ? "Merci pour votre temps. J’ai analysé vos réponses et voici exactement ce que SAFE va faire pour votre cabinet — et combien ça vous coûterait de le faire autrement."
                    : "Thank you for your time. I’ve analyzed your answers and here’s exactly what SAFE will do for your firm — and how much it would cost to do it any other way."}
                </div>
              </div>
            </div>

            {/* ═══ Section 1 : Le coût de l’inaction ═══ */}
            <div className="audit-result-card rounded-safe-md border border-red-200 bg-red-50/50 p-6 audit-slide-up" style={{ animationDelay: "0.1s" }}>
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                <h3 className="text-base font-bold font-sans text-[var(--safe-text-title)] tracking-tight">
                  {lang === "fr" ? "Ce que vous perdez chaque mois sans SAFE" : "What you lose every month without SAFE"}
                </h3>
              </div>
              <div className="space-y-3">
                {[
                  {
                    fr: "Heures perdues en tâches admin manuelles",
                    en: "Hours lost on manual admin tasks",
                    amount: lang === "fr" ? "8-15h/mois" : "8-15h/month",
                    cost: "1 200 $ — 2 500 $",
                  },
                  {
                    fr: "Retards de facturation et paiements en souffrance",
                    en: "Billing delays and outstanding payments",
                    amount: "",
                    cost: "800 $ — 3 000 $",
                  },
                  {
                    fr: "Risque de non-conformité (fidéicommis, Loi 25, Barreau)",
                    en: "Non-compliance risk (trust, privacy law, Bar)",
                    amount: "",
                    cost: lang === "fr" ? "Amende jusqu’à 100 000 $ par infraction" : "Fines up to $100,000 per offence",
                  },
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between py-2 border-b border-red-200/50 last:border-0">
                    <span className="text-sm text-[var(--safe-text-secondary)] font-sans">{lang === "fr" ? item.fr : item.en}</span>
                    <span className="text-sm font-semibold text-red-600 font-sans whitespace-nowrap ml-3">{item.cost}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-3 border-t border-red-200/50 flex items-center justify-between">
                <span className="text-sm font-bold text-[var(--safe-text-title)] font-sans">
                  {lang === "fr" ? "Coût estimé de l’inaction" : "Estimated cost of inaction"}
                </span>
                <span className="text-lg font-bold text-red-600 font-sans">
                  {lang === "fr" ? "2 000 $ — 5 500 $/mois" : "$2,000 — $5,500/month"}
                </span>
              </div>
            </div>

            {/* ═══ Section 2 : Tableau de valeur ═══ */}
            <div className="audit-result-card rounded-safe-md border border-[var(--safe-sage)]/30 bg-white/60 p-6 audit-slide-up" style={{ animationDelay: "0.2s" }}>
              <div className="flex items-center gap-2 mb-4">
                <Gift className="w-5 h-5 text-[var(--safe-text-secondary)]" />
                <h3 className="text-base font-bold font-sans text-[var(--safe-text-title)] tracking-tight">
                  {lang === "fr" ? "Ce que SAFE configure pour vous" : "What SAFE sets up for you"}
                </h3>
              </div>

              <div className="space-y-3">
                {calculationResult.lineItems.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between py-2 border-b border-[var(--safe-sage)]/20 last:border-0 audit-slide-up"
                    style={{ animationDelay: `${0.25 + idx * 0.06}s` }}
                  >
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                      <span className="text-sm text-[var(--safe-text-secondary)] font-sans">
                        {item.label[lang]}
                      </span>
                    </div>
                    <span className="text-sm font-semibold text-[var(--safe-text-title)] font-sans whitespace-nowrap ml-3">
                      {item.amount.toLocaleString(lang === "fr" ? "fr-CA" : "en-CA")} $
                    </span>
                  </div>
                ))}
              </div>

              {/* Total crossed out */}
              <div className="mt-4 pt-4 border-t-2 border-[var(--safe-sage)]/30">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-[var(--safe-text-title)] font-sans">
                    {lang === "fr" ? "Valeur totale de la configuration" : "Total configuration value"}
                  </span>
                  <span className="text-xl font-bold text-red-400 font-sans line-through">
                    {calculationResult.totalValue.toLocaleString(lang === "fr" ? "fr-CA" : "en-CA")} $
                  </span>
                </div>
              </div>
            </div>

            {/* ═══ Section 3 : Bonus exclusifs ═══ */}
            <div className="audit-result-card rounded-safe-md border border-[var(--safe-accent)]/30 bg-[var(--safe-accent)]/5 p-6 audit-slide-up" style={{ animationDelay: "0.35s" }}>
              <div className="flex items-center gap-2 mb-4">
                <Zap className="w-5 h-5 text-[var(--safe-accent)]" />
                <h3 className="text-base font-bold font-sans text-[var(--safe-text-title)] tracking-tight">
                  {lang === "fr" ? "Bonus inclus — Offre Fondateur" : "Included bonuses — Founder Offer"}
                </h3>
              </div>
              <div className="space-y-3">
                {[
                  {
                    icon: <TrendingUp className="w-4 h-4" />,
                    fr: "Migration complète de vos données existantes",
                    en: "Complete migration of your existing data",
                    value: "500 $",
                  },
                  {
                    icon: <Users className="w-4 h-4" />,
                    fr: "Formation personnalisée pour toute votre équipe",
                    en: "Personalized training for your entire team",
                    value: "300 $",
                  },
                  {
                    icon: <Shield className="w-4 h-4" />,
                    fr: "Audit de conformité Barreau + Loi 25 inclus",
                    en: "Bar + Privacy Law compliance audit included",
                    value: "400 $",
                  },
                  {
                    icon: <Calendar className="w-4 h-4" />,
                    fr: "Support prioritaire dédié pendant 60 jours",
                    en: "Dedicated priority support for 60 days",
                    value: "600 $",
                  },
                ].map((bonus, idx) => (
                  <div key={idx} className="flex items-center gap-3 py-2">
                    <div className="w-8 h-8 rounded-full bg-[var(--safe-accent)]/15 flex items-center justify-center text-[var(--safe-accent)] shrink-0">
                      {bonus.icon}
                    </div>
                    <span className="flex-1 text-sm text-[var(--safe-text-secondary)] font-sans">
                      {lang === "fr" ? bonus.fr : bonus.en}
                    </span>
                    <span className="text-sm font-semibold text-[var(--safe-accent)] font-sans line-through opacity-60">
                      {bonus.value}
                    </span>
                    <span className="text-xs font-bold text-green-600 font-sans uppercase">
                      {lang === "fr" ? "GRATUIT" : "FREE"}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* ═══ Section 4 : Comparaison concurrence ═══ */}
            <div className="audit-result-card rounded-safe-md border border-[var(--safe-sage)]/30 bg-white/60 overflow-hidden audit-slide-up" style={{ animationDelay: "0.45s" }}>
              <div className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="w-5 h-5 text-[var(--safe-text-secondary)]" />
                  <h3 className="text-base font-bold font-sans text-[var(--safe-text-title)] tracking-tight">
                    {lang === "fr" ? "SAFE vs la concurrence" : "SAFE vs the competition"}
                  </h3>
                </div>
                <div className="space-y-3">
                  {[
                    { name: "CLIO", price: "89 $ — 139 $/utilisateur", note: lang === "fr" ? "Pas adapté au Barreau canadien" : "Not adapted for Canadian Bar" },
                    { name: "Practice Panther", price: "59 $ — 99 $/utilisateur", note: lang === "fr" ? "Aucune gestion fidéicommis QC" : "No QC trust management" },
                    { name: "Juris Concept", price: "200 $ — 500 $/mois", note: lang === "fr" ? "Interface obsolète, pas de cloud" : "Outdated interface, no cloud" },
                    { name: "Comptable externe", price: "800 $ — 2 000 $/mois", note: lang === "fr" ? "Délais, pas temps réel" : "Delays, not real-time" },
                  ].map((comp, idx) => (
                    <div key={idx} className="flex items-center justify-between py-2 border-b border-[var(--safe-sage)]/15 last:border-0">
                      <div>
                        <span className="text-sm font-medium text-[var(--safe-text-title)] font-sans">{comp.name}</span>
                        <p className="text-xs text-[var(--safe-sage)] font-sans">{comp.note}</p>
                      </div>
                      <span className="text-sm text-[var(--safe-text-secondary)] font-sans whitespace-nowrap ml-3">{comp.price}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-[var(--safe-accent)]/10 px-6 py-4 border-t border-[var(--safe-accent)]/20">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-bold text-[var(--safe-text-title)] font-sans">SAFE</span>
                    <p className="text-xs text-[var(--safe-accent)] font-sans font-medium">
                      {lang === "fr"
                        ? "Tout inclus. Conçu pour le Barreau canadien."
                        : "All-inclusive. Built for the Canadian Bar."}
                    </p>
                  </div>
                  <span className="text-lg font-bold text-[var(--safe-accent)] font-sans">
                    {calculationResult.plan.price}$/
                    {lang === "fr" ? "mois" : "month"}
                  </span>
                </div>
              </div>
            </div>

            {/* ═══ Section 5 : Prix + Garantie ═══ */}
            <div className="audit-result-card rounded-safe-md border border-[var(--safe-text-title)]/15 bg-[var(--safe-text-title)] p-6 audit-slide-up" style={{ animationDelay: "0.55s" }}>
              <div className="text-center">
                <p className="text-xs text-[var(--safe-sage)] font-sans uppercase tracking-wider mb-2">
                  {lang === "fr" ? "Votre investissement :" : "Your investment:"}
                </p>
                <div className="flex items-baseline justify-center gap-1 mb-1">
                  <span className="text-5xl font-bold text-[var(--safe-white)] font-sans">
                    {calculationResult.plan.price}$
                  </span>
                  <span className="text-lg text-[var(--safe-sage)] font-sans">
                    {lang === "fr" ? "/mois" : "/month"}
                  </span>
                </div>
                <p className="text-sm text-[var(--safe-white)] font-sans font-medium mb-1">
                  {lang === "fr" ? `Plan ${calculationResult.plan.name.fr}` : `${calculationResult.plan.name.en} Plan`}
                </p>
                <p className="text-xs text-[var(--safe-sage)] font-sans mb-4">
                  {calculationResult.plan.price === 79
                    ? (lang === "fr" ? "Pour avocat solo — 1 utilisateur" : "For solo lawyer — 1 user")
                    : calculationResult.plan.price === 149
                    ? (lang === "fr" ? "Pour cabinet — 2 à 5 utilisateurs" : "For firm — 2 to 5 users")
                    : (lang === "fr" ? "Pour cabinet établi — 6 à 15 utilisateurs" : "For established firm — 6 to 15 users")}
                </p>

                {/* Badges */}
                <div className="flex flex-wrap justify-center gap-2 mb-4">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 border border-white/20">
                    <CheckCircle className="w-3.5 h-3.5 text-green-400" />
                    <span className="text-xs text-[var(--safe-white)] font-sans font-medium">
                      {lang === "fr" ? "0 $ frais de configuration" : "$0 setup fees"}
                    </span>
                  </div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 border border-white/20">
                    <Lock className="w-3.5 h-3.5 text-green-400" />
                    <span className="text-xs text-[var(--safe-white)] font-sans font-medium">
                      {lang === "fr" ? "Sans engagement" : "No commitment"}
                    </span>
                  </div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 border border-white/20">
                    <Calendar className="w-3.5 h-3.5 text-green-400" />
                    <span className="text-xs text-[var(--safe-white)] font-sans font-medium">
                      {lang === "fr" ? "Annulez quand vous voulez" : "Cancel anytime"}
                    </span>
                  </div>
                </div>

                {/* Garantie */}
                <div className="rounded-safe bg-white/10 border border-white/15 p-4 mb-4">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Shield className="w-5 h-5 text-green-400" />
                    <span className="text-sm font-bold text-[var(--safe-white)] font-sans">
                      {calculationResult.plan.price === 449
                        ? (lang === "fr" ? "Garantie Conformité — 90 jours" : "90-Day Compliance Guarantee")
                        : (lang === "fr" ? "Garantie Satisfait ou Remboursé — 30 jours" : "30-Day Money-Back Guarantee")}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--safe-sage)] font-sans leading-relaxed">
                    {calculationResult.plan.price === 449
                      ? (lang === "fr"
                        ? "Si vous n’êtes pas prêt pour l’inspection du Barreau en 90 jours, on vous rembourse intégralement. Aucune question posée."
                        : "If you’re not ready for the Bar inspection within 90 days, we refund you in full. No questions asked.")
                      : (lang === "fr"
                        ? "Si SAFE ne transforme pas votre gestion dans les 30 premiers jours, on vous rembourse intégralement. Aucune question posée."
                        : "If SAFE doesn’t transform your practice management within 30 days, we refund you in full. No questions asked.")}
                  </p>
                </div>

                {/* Urgence */}
                <div className="rounded-safe bg-amber-500/20 border border-amber-400/30 px-4 py-3">
                  <p className="text-xs text-amber-200 font-sans font-medium">
                    {lang === "fr"
                      ? "🔥 Offre fondateur limitée aux 50 premiers cabinets au Canada. Tarif garanti à vie."
                      : "🔥 Founder offer limited to the first 50 firms in Canada. Rate locked for life."}
                  </p>
                </div>
              </div>
            </div>

            {/* ═══ Section 6 : Économie mensuelle ═══ */}
            <div className="audit-result-card rounded-safe-md border border-green-200 bg-green-50/50 p-6 audit-slide-up" style={{ animationDelay: "0.65s" }}>
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-5 h-5 text-green-600" />
                <h3 className="text-base font-bold font-sans text-[var(--safe-text-title)] tracking-tight">
                  {lang === "fr" ? "Votre économie nette" : "Your net savings"}
                </h3>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-safe bg-white/70 border border-green-200 p-4 text-center">
                  <p className="text-2xl font-bold text-green-600 font-sans">
                    {lang === "fr" ? "10-15h" : "10-15h"}
                  </p>
                  <p className="text-xs text-[var(--safe-text-secondary)] font-sans">
                    {lang === "fr" ? "récupérées / mois" : "recovered / month"}
                  </p>
                </div>
                <div className="rounded-safe bg-white/70 border border-green-200 p-4 text-center">
                  <p className="text-2xl font-bold text-green-600 font-sans">
                    +{((calculationResult.plan.price === 79 ? 2500 : calculationResult.plan.price === 149 ? 4000 : 6000) - calculationResult.plan.price).toLocaleString(lang === "fr" ? "fr-CA" : "en-CA")} $
                  </p>
                  <p className="text-xs text-[var(--safe-text-secondary)] font-sans">
                    {lang === "fr" ? "économisés / mois" : "saved / month"}
                  </p>
                </div>
              </div>
              <p className="text-xs text-green-700 font-sans mt-3 text-center font-medium">
                {lang === "fr"
                  ? `Votre abonnement de ${calculationResult.plan.price}$/mois se rentabilise dès la première semaine.`
                  : `Your $${calculationResult.plan.price}/month subscription pays for itself in the first week.`}
              </p>
            </div>

            {/* ═══ CTA ═══ */}
            {!submitted ? (
              <div className="space-y-3 audit-slide-up" style={{ animationDelay: "0.75s" }}>
                <button
                  onClick={handleFinalSubmit}
                  disabled={submitting}
                  className="group flex items-center justify-center gap-2 w-full py-4 rounded-safe-md bg-[var(--safe-accent)] text-[var(--safe-white)] font-semibold text-base font-sans hover:bg-[var(--safe-accent)]/90 hover:shadow-xl hover:shadow-[var(--safe-accent)]/20 transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      {lang === "fr" ? "Envoi en cours..." : "Submitting..."}
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      {lang === "fr" ? "Oui, je veux configurer mon cabinet avec SAFE" : "Yes, I want to set up my firm with SAFE"}
                      <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                    </>
                  )}
                </button>
                <p className="text-center text-xs text-[var(--safe-sage)] font-sans">
                  {lang === "fr"
                    ? "Jérémie vous contactera personnellement dans les 24h pour votre appel de démarrage."
                    : "Jérémie will personally contact you within 24h for your onboarding call."}
                </p>
              </div>
            ) : (
              <div className="rounded-safe-md border border-green-200 bg-green-50 p-6 text-center audit-slide-up" style={{ animationDelay: "0.1s" }}>
                <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-3" />
                <h3 className="text-lg font-bold font-sans text-[var(--safe-text-title)] mb-2">
                  {lang === "fr" ? "Bienvenue dans SAFE !" : "Welcome to SAFE!"}
                </h3>
                <p className="text-sm text-[var(--safe-text-secondary)] font-sans leading-relaxed mb-3">
                  {lang === "fr"
                    ? "Votre demande a été envoyée. Jérémie vous contactera dans les prochaines 24 heures pour planifier votre appel de configuration."
                    : "Your request has been sent. Jérémie will contact you within the next 24 hours to schedule your setup call."}
                </p>
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-100 border border-green-200">
                  <Phone className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-green-700 font-sans font-medium">(819) 271-8656</span>
                </div>
              </div>
            )}

            {/* SAFE branding */}
            <div className="text-center py-4">
              <p className="text-xs text-[var(--safe-sage)] font-sans">
                {lang === "fr"
                  ? "SAFE — La plateforme de gestion conçue pour les avocats canadiens"
                  : "SAFE — The practice management platform built for Canadian lawyers"}
              </p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  /* ─────────────────────────────────────────────
     Chat Screen
     ───────────────────────────────────────────── */

  return (
    <div className="flex flex-col h-full bg-[var(--safe-white)] text-[var(--safe-text-title)]">
      {/* Header */}
      <header className="shrink-0 z-10 border-b border-[var(--safe-sage)]/30 bg-[var(--safe-white)]/95 backdrop-blur-md">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--safe-accent)] to-[var(--safe-text-title)] flex items-center justify-center text-xs font-bold text-[var(--safe-white)] shrink-0 ring-2 ring-[var(--safe-accent)]/20">
            JT
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-semibold font-sans tracking-tight truncate text-[var(--safe-text-title)]">Jérémie Tiahou</h1>
            <p className="text-xs text-[var(--safe-text-secondary)] font-sans">
              {isTyping ? (
                <span className="text-[var(--safe-text-secondary)] font-medium">
                  {lang === "en" ? "typing..." : "écrit..."}
                </span>
              ) : lang === "en" ? (
                "Founder — SAFE"
              ) : (
                "Fondateur — SAFE"
              )}
            </p>
          </div>
          {/* Secure badge */}
          <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-[var(--safe-sage)]/15 border border-[var(--safe-sage)]/30">
            <Shield className="w-3 h-3 text-[var(--safe-text-secondary)]" />
            <span className="text-xs text-[var(--safe-text-secondary)] font-sans">
              {lang === "en" ? "Confidential" : "Confidentiel"}
            </span>
          </div>
        </div>

        {/* Progress bar */}
        {started && lang && (
          <div className="px-4 pb-2">
            <div className="max-w-2xl mx-auto">
              <div className="flex items-center gap-1.5">
                {PHASES.map((phase, i) => (
                  <div key={phase.fr} className="flex-1 flex flex-col items-center gap-1">
                    <div
                      className={`h-1.5 w-full rounded-full transition-all duration-500 ${
                        i + 1 < currentPhase
                          ? "bg-[var(--safe-text-title)]"
                          : i + 1 === currentPhase
                          ? "bg-[var(--safe-text-secondary)] audit-progress-bar"
                          : "bg-[var(--safe-sage)]/20"
                      }`}
                    />
                    <span
                      className={`text-[10px] font-sans hidden sm:block transition-colors duration-300 ${
                        i + 1 <= currentPhase ? "text-[var(--safe-text-secondary)] font-medium" : "text-[var(--safe-sage)]"
                      }`}
                    >
                      {phase[lang]}
                    </span>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between mt-1.5">
                <div className="flex items-center gap-3">
                  {questionHistory.length > 0 && (
                    <button
                      type="button"
                      onClick={handleGoBack}
                      className="flex items-center gap-1 text-[10px] text-[var(--safe-text-secondary)] font-sans font-medium hover:text-[var(--safe-text-title)] transition-colors"
                    >
                      <ChevronLeft className="w-3 h-3" />
                      {lang === "en" ? "Back" : "Retour"}
                    </button>
                  )}
                  <span className="text-[10px] text-[var(--safe-sage)] font-sans">
                    {lang === "fr" ? `Étape ${currentPhase}/${PHASES.length}` : `Step ${currentPhase}/${PHASES.length}`}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleSave}
                    className="flex items-center gap-1 text-[10px] text-[var(--safe-text-secondary)] font-sans font-medium hover:text-[var(--safe-text-title)] transition-colors"
                  >
                    <Save className="w-3 h-3" />
                    {savedFeedback
                      ? (lang === "en" ? "Saved!" : "Sauvegardé!")
                      : (lang === "en" ? "Save" : "Sauvegarder")}
                  </button>
                  <span className="text-[10px] text-[var(--safe-sage)] font-sans flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    ~{Math.max(1, ESTIMATED_MINUTES - Math.round((currentPhase / PHASES.length) * ESTIMATED_MINUTES))} min {lang === "fr" ? "restantes" : "remaining"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Chat area */}
      <main ref={chatContainerRef} className="flex-1 min-h-0 overflow-y-auto px-4 py-6">
        <div className="max-w-2xl mx-auto space-y-4">
          {messages.map((msg, idx) => {
            const isLastHost =
              msg.sender === "host" &&
              !messages.slice(idx + 1).some((m) => m.sender === "host");
            return (
            <div key={msg.id} ref={isLastHost ? lastHostRef : undefined}>
              {/* Message bubble */}
              <div
                className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"} audit-msg-appear`}
              >
                {msg.sender === "host" && (
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[var(--safe-accent)] to-[var(--safe-text-title)] flex items-center justify-center text-xs font-bold text-[var(--safe-white)] shrink-0 mr-2 mt-1">
                    JT
                  </div>
                )}
                <div
                  className={`max-w-[80%] sm:max-w-[70%] rounded-safe-md px-4 py-3 text-sm font-sans leading-relaxed whitespace-pre-line ${
                    msg.sender === "user"
                      ? "bg-[var(--safe-sage)]/20 text-[var(--safe-text-title)] border border-[var(--safe-sage)]/30 rounded-br-md"
                      : "bg-[var(--safe-text-title)] text-[var(--safe-white)] border border-[var(--safe-text-title)]/10 rounded-bl-md"
                  }`}
                >
                  {msg.text}
                </div>
              </div>

              {/* Language selection buttons (only for intro message before lang is chosen) */}
              {msg.sender === "host" && !lang && !started && idx === 0 && !isTyping && (
                <div className="ml-9 mt-3 audit-options-appear">
                  <div className="space-y-2">
                    <button
                      onClick={() => handleLangSelect("fr")}
                      className="group w-full text-left px-4 py-3 rounded-safe border border-[var(--safe-sage)]/30 bg-white/60 hover:bg-[var(--safe-text-secondary)]/10 hover:border-[var(--safe-text-secondary)]/30 text-sm text-[var(--safe-text-secondary)] hover:text-[var(--safe-text-title)] font-sans transition-all duration-200 flex items-center gap-3"
                    >
                      <div className="w-5 h-5 rounded-full border border-[var(--safe-sage)] group-hover:border-[var(--safe-text-secondary)] transition-colors shrink-0 flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-transparent group-hover:bg-[var(--safe-text-secondary)] transition-colors" />
                      </div>
                      {"🇫🇷"} Français
                    </button>
                    <button
                      onClick={() => handleLangSelect("en")}
                      className="group w-full text-left px-4 py-3 rounded-safe border border-[var(--safe-sage)]/30 bg-white/60 hover:bg-[var(--safe-text-secondary)]/10 hover:border-[var(--safe-text-secondary)]/30 text-sm text-[var(--safe-text-secondary)] hover:text-[var(--safe-text-title)] font-sans transition-all duration-200 flex items-center gap-3"
                    >
                      <div className="w-5 h-5 rounded-full border border-[var(--safe-sage)] group-hover:border-[var(--safe-text-secondary)] transition-colors shrink-0 flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-transparent group-hover:bg-[var(--safe-text-secondary)] transition-colors" />
                      </div>
                      {"🇬🇧"} English
                    </button>
                  </div>
                </div>
              )}

              {/* Options (only for unanswered host questions) */}
              {msg.sender === "host" && !msg.answered && msg.questionKey && (
                <div className="ml-9 mt-3 audit-options-appear">
                  {/* Single select options */}
                  {msg.questionType === "single" && msg.options && (
                    <div className="space-y-2">
                      {msg.options.map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => handleOptionSelect(msg.questionKey!, opt)}
                          className="group w-full text-left px-4 py-3 rounded-safe border border-[var(--safe-sage)]/30 bg-white/60 hover:bg-[var(--safe-text-secondary)]/10 hover:border-[var(--safe-text-secondary)]/30 text-sm text-[var(--safe-text-secondary)] hover:text-[var(--safe-text-title)] font-sans transition-all duration-200 flex items-center gap-3"
                        >
                          <div className="w-5 h-5 rounded-full border border-[var(--safe-sage)] group-hover:border-[var(--safe-text-secondary)] transition-colors shrink-0 flex items-center justify-center">
                            <div className="w-2 h-2 rounded-full bg-transparent group-hover:bg-[var(--safe-text-secondary)] transition-colors" />
                          </div>
                          {opt.label}
                        </button>
                      ))}

                      {/* Custom text field */}
                      {showCustomField && (
                        <div className="flex gap-2 mt-2 audit-msg-appear">
                          <input
                            type="text"
                            value={customText}
                            onChange={(e) => setCustomText(e.target.value)}
                            placeholder={lang === "en" ? "Please specify..." : "Précisez..."}
                            className="flex-1 px-4 py-3 rounded-safe bg-white/70 border border-[var(--safe-sage)]/40 text-sm text-[var(--safe-text-title)] placeholder-[var(--safe-sage)] font-sans focus:outline-none focus:border-[var(--safe-text-secondary)]/50 transition-colors"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleCustomSubmit(msg.questionKey!);
                            }}
                          />
                          <button
                            onClick={() => handleCustomSubmit(msg.questionKey!)}
                            className="px-4 py-3 rounded-safe bg-[var(--safe-text-title)] text-[var(--safe-white)] text-sm font-sans hover:bg-[var(--safe-text-secondary)] transition-colors"
                          >
                            <Send className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Multi-select options */}
                  {msg.questionType === "multi" && msg.options && (
                    <div className="space-y-2">
                      {msg.options.map((opt) => {
                        const isSelected = multiSelect.includes(opt.value);
                        const atMax = msg.maxSelect ? multiSelect.length >= msg.maxSelect : false;
                        const isDisabled = !isSelected && atMax;
                        return (
                          <button
                            key={opt.value}
                            disabled={isDisabled}
                            onClick={() => {
                              if (opt.hasTextField && opt.value === "other") {
                                setShowCustomField(true);
                                return;
                              }
                              setMultiSelect((prev) =>
                                isSelected ? prev.filter((v) => v !== opt.value) : [...prev, opt.value]
                              );
                            }}
                            className={`group w-full text-left px-4 py-3 rounded-safe border text-sm font-sans transition-all duration-200 flex items-center gap-3 ${
                              isSelected
                                ? "border-[var(--safe-text-secondary)]/40 bg-[var(--safe-text-secondary)]/15 text-[var(--safe-text-title)]"
                                : isDisabled
                                ? "border-[var(--safe-sage)]/20 bg-white/30 text-[var(--safe-sage)] cursor-not-allowed"
                                : "border-[var(--safe-sage)]/30 bg-white/60 hover:bg-[var(--safe-text-secondary)]/10 hover:border-[var(--safe-text-secondary)]/20 text-[var(--safe-text-secondary)] hover:text-[var(--safe-text-title)]"
                            }`}
                          >
                            <div
                              className={`w-5 h-5 rounded border shrink-0 flex items-center justify-center transition-colors ${
                                isSelected ? "border-[var(--safe-text-secondary)] bg-[var(--safe-text-secondary)]" : "border-[var(--safe-sage)]"
                              }`}
                            >
                              {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-[var(--safe-white)]" />}
                            </div>
                            {opt.label}
                          </button>
                        );
                      })}

                      {/* Custom text field for multi-select "Autre" */}
                      {showCustomField && (
                        <div className="flex gap-2 mt-2 audit-msg-appear">
                          <input
                            type="text"
                            value={customText}
                            onChange={(e) => setCustomText(e.target.value)}
                            placeholder={lang === "en" ? "Please specify..." : "Précisez..."}
                            className="flex-1 px-4 py-3 rounded-safe bg-white/70 border border-[var(--safe-sage)]/40 text-sm text-[var(--safe-text-title)] placeholder-[var(--safe-sage)] font-sans focus:outline-none focus:border-[var(--safe-text-secondary)]/50 transition-colors"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleCustomSubmit(msg.questionKey!);
                            }}
                          />
                          <button
                            onClick={() => handleCustomSubmit(msg.questionKey!)}
                            className="px-4 py-3 rounded-safe bg-[var(--safe-text-title)] text-[var(--safe-white)] text-sm font-sans hover:bg-[var(--safe-text-secondary)] transition-colors"
                          >
                            <Send className="w-4 h-4" />
                          </button>
                        </div>
                      )}

                      {multiSelect.length > 0 && (
                        <button
                          onClick={() => handleMultiConfirm(msg.questionKey!, msg.options!)}
                          className="w-full mt-2 px-4 py-3 rounded-safe bg-[var(--safe-text-title)] text-[var(--safe-white)] text-sm font-semibold font-sans hover:bg-[var(--safe-text-secondary)] transition-colors flex items-center justify-center gap-2"
                        >
                          {lang === "en" ? `Confirm (${multiSelect.length})` : `Confirmer (${multiSelect.length})`}
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  )}

                  {/* Open text */}
                  {msg.questionType === "open" && (
                    <div className="space-y-2 audit-msg-appear">
                      <input
                        type="text"
                        value={openText}
                        onChange={(e) => setOpenText(e.target.value)}
                        placeholder={msg.placeholder || (lang === "en" ? "Type your answer..." : "Écrivez votre réponse...")}
                        className="w-full px-4 py-3 rounded-safe bg-white/70 border border-[var(--safe-sage)]/40 text-sm text-[var(--safe-text-title)] placeholder-[var(--safe-sage)] font-sans focus:outline-none focus:border-[var(--safe-text-secondary)]/50 transition-colors"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleOpenSubmit(msg.questionKey!);
                          }
                        }}
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleOpenSubmit(msg.questionKey!)}
                          disabled={!openText.trim()}
                          className="flex-1 py-3 rounded-safe bg-[var(--safe-text-title)] text-[var(--safe-white)] text-sm font-semibold font-sans hover:bg-[var(--safe-text-secondary)] transition-colors flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          <Send className="w-4 h-4" />
                          {lang === "en" ? "Send" : "Envoyer"}
                        </button>
                        <button
                          onClick={() => handleOpenSkip(msg.questionKey!)}
                          className="px-4 py-3 rounded-safe border border-[var(--safe-sage)]/30 bg-white/60 text-xs text-[var(--safe-sage)] font-sans hover:bg-[var(--safe-sage)]/10 transition-colors"
                        >
                          {lang === "en" ? "Skip" : "Passer"}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Email input */}
                  {msg.questionType === "email" && (
                    <div className="space-y-2 audit-msg-appear">
                      <input
                        type="email"
                        value={openText}
                        onChange={(e) => setOpenText(e.target.value)}
                        placeholder={msg.placeholder || (lang === "en" ? "name@firm.ca" : "nom@cabinet.ca")}
                        className="w-full px-4 py-3 rounded-safe bg-white/70 border border-[var(--safe-sage)]/40 text-sm text-[var(--safe-text-title)] placeholder-[var(--safe-sage)] font-sans focus:outline-none focus:border-[var(--safe-text-secondary)]/50 transition-colors"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleEmailSubmit(msg.questionKey!);
                          }
                        }}
                      />
                      <button
                        onClick={() => handleEmailSubmit(msg.questionKey!)}
                        disabled={!openText.trim()}
                        className="w-full py-3 rounded-safe bg-[var(--safe-text-title)] text-[var(--safe-white)] text-sm font-semibold font-sans hover:bg-[var(--safe-text-secondary)] transition-colors flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <Send className="w-4 h-4" />
                        {lang === "en" ? "Send" : "Envoyer"}
                      </button>
                    </div>
                  )}

                  {/* Contact form */}
                  {msg.questionType === "contact" && (
                    <form onSubmit={handleContactSubmit} className="space-y-3 audit-msg-appear">
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-[var(--safe-sage)]" />
                        <input
                          type="tel"
                          value={contactForm.phone}
                          onChange={(e) => setContactForm((f) => ({ ...f, phone: e.target.value }))}
                          placeholder={lang === "en" ? "Phone (optional)" : "Téléphone (optionnel)"}
                          className="flex-1 px-4 py-3 rounded-safe bg-white/70 border border-[var(--safe-sage)]/40 text-sm text-[var(--safe-text-title)] placeholder-[var(--safe-sage)] font-sans focus:outline-none focus:border-[var(--safe-text-secondary)]/50 transition-colors"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-[var(--safe-sage)]" />
                        <input
                          type="text"
                          value={contactForm.address}
                          onChange={(e) => setContactForm((f) => ({ ...f, address: e.target.value }))}
                          placeholder={lang === "en" ? "Address (optional)" : "Adresse (optionnel)"}
                          className="flex-1 px-4 py-3 rounded-safe bg-white/70 border border-[var(--safe-sage)]/40 text-sm text-[var(--safe-text-title)] placeholder-[var(--safe-sage)] font-sans focus:outline-none focus:border-[var(--safe-text-secondary)]/50 transition-colors"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <Globe className="w-4 h-4 text-[var(--safe-sage)]" />
                        <input
                          type="url"
                          value={contactForm.website}
                          onChange={(e) => setContactForm((f) => ({ ...f, website: e.target.value }))}
                          placeholder={lang === "en" ? "Website (optional)" : "Site web (optionnel)"}
                          className="flex-1 px-4 py-3 rounded-safe bg-white/70 border border-[var(--safe-sage)]/40 text-sm text-[var(--safe-text-title)] placeholder-[var(--safe-sage)] font-sans focus:outline-none focus:border-[var(--safe-text-secondary)]/50 transition-colors"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-[var(--safe-sage)]" />
                        <input
                          type="date"
                          value={contactForm.preferredDate}
                          onChange={(e) => setContactForm((f) => ({ ...f, preferredDate: e.target.value }))}
                          className="flex-1 px-4 py-3 rounded-safe bg-white/70 border border-[var(--safe-sage)]/40 text-sm text-[var(--safe-text-title)] placeholder-[var(--safe-sage)] font-sans focus:outline-none focus:border-[var(--safe-text-secondary)]/50 transition-colors"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-[var(--safe-sage)]" />
                        <div className="flex-1 flex gap-2">
                          {[
                            { label: lang === "en" ? "Morning" : "Matin", value: "morning" },
                            { label: lang === "en" ? "Afternoon" : "Après-midi", value: "afternoon" },
                            { label: lang === "en" ? "Evening" : "Soir", value: "evening" },
                          ].map((time) => (
                            <button
                              key={time.value}
                              type="button"
                              onClick={() => setContactForm((f) => ({ ...f, preferredTime: time.value }))}
                              className={`flex-1 py-2 rounded-safe text-xs font-sans transition-all duration-200 border ${
                                contactForm.preferredTime === time.value
                                  ? "border-[var(--safe-text-secondary)]/40 bg-[var(--safe-text-secondary)]/15 text-[var(--safe-text-title)] font-semibold"
                                  : "border-[var(--safe-sage)]/30 bg-white/60 text-[var(--safe-text-secondary)] hover:bg-[var(--safe-text-secondary)]/10"
                              }`}
                            >
                              {time.label}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <MessageSquare className="w-4 h-4 text-[var(--safe-sage)] mt-3" />
                        <textarea
                          value={contactForm.optionalMessage}
                          onChange={(e) => setContactForm((f) => ({ ...f, optionalMessage: e.target.value }))}
                          placeholder={lang === "en" ? "Optional message..." : "Message optionnel..."}
                          rows={2}
                          className="flex-1 px-4 py-3 rounded-safe bg-white/70 border border-[var(--safe-sage)]/40 text-sm text-[var(--safe-text-title)] placeholder-[var(--safe-sage)] font-sans focus:outline-none focus:border-[var(--safe-text-secondary)]/50 transition-colors resize-none"
                        />
                      </div>
                      <button
                        type="submit"
                        className="w-full py-3 rounded-safe bg-[var(--safe-text-title)] text-[var(--safe-white)] font-semibold text-sm font-sans hover:bg-[var(--safe-text-secondary)] hover:shadow-lg hover:shadow-[var(--safe-text-title)]/15 transition-all duration-300 flex items-center justify-center gap-2"
                      >
                        <Sparkles className="w-4 h-4" />
                        {lang === "en" ? "See my personalized offer" : "Voir mon offre personnalisée"}
                      </button>
                    </form>
                  )}
                </div>
              )}
            </div>
            );
          })}

          {/* Typing indicator */}
          {isTyping && (
            <div className="flex items-start gap-2 audit-msg-appear">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[var(--safe-accent)] to-[var(--safe-text-title)] flex items-center justify-center text-xs font-bold text-[var(--safe-white)] shrink-0">
                JT
              </div>
              <div className="rounded-safe-md rounded-bl-md bg-[var(--safe-text-title)] border border-[var(--safe-text-title)]/10 px-4 py-3">
                <div className="flex gap-1">
                  <span className="audit-typing-dot w-2 h-2 rounded-full bg-[var(--safe-sage)]" />
                  <span className="audit-typing-dot w-2 h-2 rounded-full bg-[var(--safe-sage)]" style={{ animationDelay: "0.15s" }} />
                  <span className="audit-typing-dot w-2 h-2 rounded-full bg-[var(--safe-sage)]" style={{ animationDelay: "0.3s" }} />
                </div>
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>
      </main>
    </div>
  );
}
