"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Send,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  Clock,
  Shield,
  DollarSign,
  BarChart3,
  ChevronRight,
  Star,
  Calendar,
  User,
  Mail,
  Phone,
  Building2,
  ArrowRight,
  Sparkles,
  Target,
  Zap,
  Download,
  FileText,
  AlertCircle,
  CheckCircle,
} from "lucide-react";

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
  text: string;
  type: "single" | "multi" | "scale" | "contact" | "open";
  options?: QuestionOption[];
  scaleMin?: number;
  scaleMax?: number;
  scaleLabels?: Record<number, string>;
  placeholder?: string;
  condition?: (responses: Partial<AuditResponses>) => boolean;
}

interface ChatMessage {
  id: string;
  sender: "auditor" | "user";
  text: string;
  timestamp: number;
  options?: QuestionOption[];
  questionType?: Question["type"];
  questionKey?: string;
  scaleMin?: number;
  scaleMax?: number;
  scaleLabels?: Record<number, string>;
  placeholder?: string;
  answered?: boolean;
}

interface AuditResponses {
  // Pilier 1 : Identification
  province: string;
  practice_type: string;
  practice_areas: string[];
  years_active: string;
  team_size: string;

  // Pilier 2 : Gestion des dossiers
  active_cases: string;
  case_tracking_method: string;
  opening_checklist: string;
  closing_process: string;
  retention_policy: string;
  case_tracking_details: string;

  // Pilier 3 : Échéanciers & délais
  deadline_tracking: string;
  prescription_management: string;
  missed_deadline_history: string;
  reminder_system: string;

  // Pilier 4 : Gestion de la clientèle
  intake_process: string;
  conflict_check: string;
  mandate_documentation: string;
  loi25_consent: string;
  conflict_check_multi_area: string;

  // Pilier 5 : Facturation & recouvrement
  billing_mode: string[];
  hourly_rate: string;
  flat_fee_range: string;
  per_item_volume: string;
  annual_revenue: string;
  time_tracking_method: string;
  monthly_billing_time: string;
  collection_rate: string;
  discount_practice: string;
  price_list: string;
  discount_documentation: string;
  ircc_portal_usage: string;
  pension_calculation_tool: string;

  // Pilier 6 : Fidéicommis & comptabilité
  trust_account_management: string;
  reconciliation_frequency: string;
  trust_multi_account: string;
  trust_segregation: string;

  // Pilier 7 : Opérations & conformité
  weekly_admin_hours: string;
  bar_inspection_confidence: number;
  loi25_compliance_level: string;
  data_protection_measures: string[];
  current_tools: string[];

  // Contact
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  contact_firm: string;
}

interface SectionDiagnostic {
  title: string;
  score: number; // 0-100 (100 = excellent)
  status: "excellent" | "bon" | "attention" | "critique";
  findings: string[];
  recommendations: string[];
  safeHelp: string;
}

interface AuditComputed {
  pain_score: number;
  maturity_level: string;
  estimated_monthly_loss: number;
  estimated_annual_loss: number;
  potential_recovery: number;
  priority_recommendations: string[];
  sections: SectionDiagnostic[];
  strengths: string[];
  overall_summary: string;
}

interface AuditData {
  audit_id: string;
  started_at: string;
  completed_at: string | null;
  responses: AuditResponses;
  computed: AuditComputed;
}

/* ─────────────────────────────────────────────
   Regulatory context by province
   ───────────────────────────────────────────── */

function getRegContext(province: string) {
  if (province === "ontario") return {
    barName: "Law Society of Ontario (LSO)",
    accountingRule: "By-Law 9",
    privacyLaw: "PIPEDA",
    privacyLawFull: "Personal Information Protection and Electronic Documents Act (PIPEDA)",
    taxLabel: "HST",
    inspectionName: "LSO Spot Audit",
    trustLabel: "trust account",
    reconciliationRule: "By-Law 9 requires monthly three-way reconciliation within 25 days of month-end.",
    conflictRule: "Rule 3.4 of the Rules of Professional Conduct",
    conflictRisk: "complaint to the LSO, licence suspension",
    privacyPenalty: "up to $100,000 per violation",
    reconciliationRef: "By-Law 9, Part IV",
    segregationRef: "By-Law 9, s. 9",
    mandateRef: "Rules of Professional Conduct, Rule 3.2",
  };
  // Default: Québec
  return {
    barName: "Barreau du Québec",
    accountingRule: "Règlement ' + reg.accountingRule + '",
    privacyLaw: "Loi 25",
    privacyLawFull: "Loi 25 (Loi sur la protection des renseignements personnels)",
    taxLabel: "TPS/TVQ",
    inspectionName: "Inspection professionnelle du Barreau",
    trustLabel: "compte en fidéicommis",
    reconciliationRule: "Le Règlement ' + reg.accountingRule + ' exige une conciliation mensuelle du fidéicommis.",
    conflictRule: "' + reg.conflictRule + '",
    conflictRisk: "radiation temporaire, amende",
    privacyPenalty: "amende de 10 000 $ à 25 000 000 $",
    reconciliationRef: "' + reg.accountingRule + ' art. 16",
    segregationRef: "' + reg.accountingRule + ' art. 12-15",
    mandateRef: "' + reg.mandateRef + '",
  };
}

const ESTIMATED_MINUTES = 8;

/* ─────────────────────────────────────────────
   Constants
   ───────────────────────────────────────────── */

const PHASES = [
  "Identification",
  "Gestion des dossiers",
  "Échéanciers & délais",
  "Gestion de la clientèle",
  "Facturation & recouvrement",
  "Fidéicommis & comptabilité",
  "Opérations & conformité",
];

const PHASE_TRANSITIONS: Record<number, string> = {
  2: "Parfait, j'ai un bon portrait de votre cabinet.\n\nPassons à la gestion de vos dossiers au quotidien.",
  3: "Très bien.\n\nAbordons maintenant un sujet crucial : la gestion de vos échéances et délais judiciaires.",
  4: "Noté.\n\nParlons maintenant de la gestion de votre clientèle — accueil, conflits d'intérêts et conformité.",
  5: "Merci pour ces réponses.\n\nPassons à la facturation et au recouvrement — la santé financière de votre cabinet.",
  6: "Bien reçu.\n\nAbordons le fidéicommis et la comptabilité — le cœur de la conformité réglementaire.",
  7: "Presque terminé.\n\nDernière section : vos opérations quotidiennes et votre conformité en matière de protection des données.",
};

const QUESTIONS: Question[] = [
  // ═══ PILIER 1 : Identification du cabinet ═══
  {
    key: "province",
    phase: 1,
    text: "Dans quelle province exercez-vous principalement ?",
    type: "single",
    options: [
      { label: "Québec", value: "quebec" },
      { label: "Ontario", value: "ontario" },
      { label: "🌊 Colombie-Britannique", value: "bc" },
      { label: "🏔️ Alberta", value: "alberta" },
      { label: "Autre province / territoire", value: "autre", hasTextField: true },
    ],
  },
  {
    key: "practice_type",
    phase: 1,
    text: "Comment décririez-vous votre pratique ?",
    type: "single",
    options: [
      { label: "Avocat(e) solo", value: "solo" },
      { label: "Petit cabinet (2-5 avocats)", value: "petit" },
      { label: "Cabinet moyen (6-15 avocats)", value: "moyen" },
      { label: "Autre", value: "autre", hasTextField: true },
    ],
  },
  {
    key: "practice_areas",
    phase: 1,
    text: "Quels sont vos principaux domaines de pratique ? (Plusieurs choix possibles)",
    type: "multi",
    options: [
      { label: "Droit familial", value: "familial" },
      { label: "Droit civil / Litige", value: "civil" },
      { label: "Droit criminel et pénal", value: "criminel" },
      { label: "Droit immobilier", value: "immobilier" },
      { label: "Droit des affaires / Commercial", value: "affaires" },
      { label: "Droit de l'immigration", value: "immigration" },
      { label: "Droit administratif", value: "administratif" },
      { label: "Autre", value: "autre", hasTextField: true },
    ],
  },
  {
    key: "years_active",
    phase: 1,
    text: "Depuis combien de temps votre cabinet est-il en activité ?",
    type: "single",
    options: [
      { label: "Moins d'un an", value: "moins_1" },
      { label: "1 à 3 ans", value: "1_3" },
      { label: "3 à 10 ans", value: "3_10" },
      { label: "Plus de 10 ans", value: "plus_10" },
    ],
  },
  {
    key: "team_size",
    phase: 1,
    text: "Combien de personnes travaillent dans votre cabinet (avocats + personnel de soutien) ?",
    type: "single",
    options: [
      { label: "Moi seul(e)", value: "solo_team" },
      { label: "2-3 personnes", value: "2_3" },
      { label: "4-10 personnes", value: "4_10" },
      { label: "Plus de 10 personnes", value: "plus_10" },
    ],
  },

  // ═══ PILIER 2 : Gestion des dossiers ═══
  {
    key: "active_cases",
    phase: 2,
    text: "En moyenne, combien de dossiers actifs gérez-vous simultanément ?",
    type: "single",
    options: [
      { label: "Moins de 20", value: "moins_20" },
      { label: "20 à 50", value: "20_50" },
      { label: "50 à 100", value: "50_100" },
      { label: "Plus de 100", value: "plus_100" },
    ],
  },
  {
    key: "case_tracking_method",
    phase: 2,
    text: "Comment suivez-vous actuellement vos dossiers ?",
    type: "single",
    options: [
      { label: "Agenda papier / Post-it", value: "papier" },
      { label: "Excel / Google Sheets", value: "excel" },
      { label: "Logiciel spécialisé (JurisÉvolution, Clio, etc.)", value: "logiciel" },
      { label: "Un mélange de tout ça", value: "melange" },
      { label: "Je n'ai pas vraiment de système structuré", value: "aucun" },
    ],
  },
  {
    key: "opening_checklist",
    phase: 2,
    text: "Utilisez-vous une checklist standardisée lors de l'ouverture d'un nouveau dossier ?",
    type: "single",
    options: [
      { label: "Oui, systématiquement", value: "oui_systematique" },
      { label: "Parfois, ça dépend du dossier", value: "parfois" },
      { label: "Non, je n'en ai pas", value: "non" },
      { label: "C'est quoi une checklist d'ouverture ?", value: "inconnu" },
    ],
  },
  {
    key: "closing_process",
    phase: 2,
    text: "Comment procédez-vous à la fermeture et à l'archivage de vos dossiers ?",
    type: "single",
    options: [
      { label: "Processus formel avec liste de vérification", value: "formel" },
      { label: "Je ferme le dossier quand j'y pense", value: "informel" },
      { label: "Les dossiers restent ouverts indéfiniment", value: "jamais" },
      { label: "Mon logiciel gère la fermeture", value: "logiciel" },
    ],
  },
  {
    key: "retention_policy",
    phase: 2,
    text: "Avez-vous une politique de conservation des documents conforme aux délais légaux ?",
    type: "single",
    options: [
      { label: "Oui, documentée et appliquée", value: "oui_appliquee" },
      { label: "J'ai une idée générale mais rien de formel", value: "informelle" },
      { label: "Non, je garde tout sans politique définie", value: "non" },
      { label: "Je ne connais pas les délais requis", value: "inconnu" },
    ],
  },
  {
    key: "case_tracking_details",
    phase: 2,
    text: "Qu'est-ce qui vous frustre le plus dans votre gestion de dossiers actuelle ?",
    type: "open",
    placeholder: "Ex: Je perds du temps à chercher des documents, les dossiers s'accumulent sans être archivés...",
  },

  // ═══ PILIER 3 : Échéanciers & délais ═══
  {
    key: "deadline_tracking",
    phase: 3,
    text: "Comment suivez-vous vos échéances judiciaires (dates de cour, délais de production, etc.) ?",
    type: "single",
    options: [
      { label: "Agenda papier ou calendrier personnel", value: "papier" },
      { label: "Calendrier numérique (Google, Outlook)", value: "calendrier" },
      { label: "Logiciel juridique avec alertes automatiques", value: "logiciel" },
      { label: "Je me fie à ma mémoire principalement", value: "memoire" },
      { label: "Aucun système fiable en place", value: "aucun" },
    ],
  },
  {
    key: "prescription_management",
    phase: 3,
    text: "Comment gérez-vous les délais de prescription dans vos dossiers ?",
    type: "single",
    options: [
      { label: "Je les note systématiquement à l'ouverture du dossier", value: "systematique" },
      { label: "Je les vérifie au besoin, quand j'y pense", value: "au_besoin" },
      { label: "C'est une source de stress, j'ai peur d'en manquer", value: "stress" },
      { label: "Je n'y pense pas assez, honnêtement", value: "negligence" },
    ],
  },
  {
    key: "missed_deadline_history",
    phase: 3,
    text: "Au cours des 2 dernières années, avez-vous manqué ou failli manquer une échéance importante ?",
    type: "single",
    options: [
      { label: "Jamais", value: "jamais" },
      { label: "Une fois, mais ça s'est bien terminé", value: "une_fois" },
      { label: "Oui, et ça a eu des conséquences", value: "consequences" },
      { label: "Je préfère ne pas répondre", value: "prefere_pas" },
    ],
  },
  {
    key: "reminder_system",
    phase: 3,
    text: "Avez-vous un système de rappels automatiques pour les échéances critiques ?",
    type: "single",
    options: [
      { label: "Oui, intégré dans mon logiciel", value: "oui_logiciel" },
      { label: "Oui, via mon calendrier (rappels manuels)", value: "oui_calendrier" },
      { label: "Non, je compte sur ma mémoire ou mes collègues", value: "non" },
      { label: "J'aimerais en avoir un mais je ne sais pas par où commencer", value: "souhaite" },
    ],
  },

  // ═══ PILIER 4 : Gestion de la clientèle ═══
  {
    key: "intake_process",
    phase: 4,
    text: "Comment accueillez-vous un nouveau client ?",
    type: "single",
    options: [
      { label: "Processus structuré : formulaire, vérification, lettre de mandat", value: "structure" },
      { label: "Entretien informel puis j'ouvre un dossier", value: "informel" },
      { label: "Ça dépend du type de dossier", value: "variable" },
      { label: "Je n'ai pas de processus défini", value: "aucun" },
    ],
  },
  {
    key: "conflict_check",
    phase: 4,
    text: "Comment vérifiez-vous les conflits d'intérêts avant d'accepter un nouveau mandat ?",
    type: "single",
    options: [
      { label: "Recherche systématique dans un registre ou logiciel", value: "registre" },
      { label: "Vérification mentale ou informelle", value: "informel" },
      { label: "Seulement quand je pense qu'il y a un risque", value: "au_besoin" },
      { label: "Je ne fais pas de vérification formelle", value: "aucun" },
    ],
  },
  {
    key: "conflict_check_multi_area",
    phase: 4,
    text: "Avec plusieurs domaines de pratique, comment vous assurez-vous qu'un client dans un dossier n'est pas la partie adverse dans un autre ?",
    type: "single",
    condition: (r) => Array.isArray(r.practice_areas) && r.practice_areas.length >= 2,
    options: [
      { label: "Base de données centralisée de tous les clients et parties", value: "base_centralisee" },
      { label: "Vérification manuelle dossier par dossier", value: "manuelle" },
      { label: "Je fais confiance à ma mémoire", value: "memoire" },
      { label: "Je n'y avais pas pensé", value: "inconnu" },
    ],
  },
  {
    key: "mandate_documentation",
    phase: 4,
    text: "Comment documentez-vous vos mandats avec les clients ?",
    type: "single",
    options: [
      { label: "Lettre ou convention de mandat signée systématiquement", value: "systematique" },
      { label: "Parfois, pour les dossiers importants", value: "parfois" },
      { label: "Échange de courriels seulement", value: "courriel" },
      { label: "Souvent verbal, pas toujours écrit", value: "verbal" },
    ],
  },
  {
    key: "loi25_consent",
    phase: 4,
    text: "Avez-vous un processus pour obtenir le consentement de vos clients concernant la collecte de leurs renseignements personnels ?",
    type: "single",
    options: [
      { label: "Oui, formulaire de consentement signé", value: "oui_formulaire" },
      { label: "C'est mentionné dans ma convention de mandat", value: "dans_mandat" },
      { label: "Non, je ne connais pas bien mes obligations", value: "non_inconnu" },
      { label: "Non, je n'ai rien mis en place", value: "non" },
    ],
  },

  // ═══ PILIER 5 : Facturation & recouvrement ═══
  {
    key: "billing_mode",
    phase: 5,
    text: "Quels modes de facturation utilisez-vous ? (Plusieurs choix possibles)",
    type: "multi",
    options: [
      { label: "Taux horaire", value: "horaire" },
      { label: "Forfait / Montant fixe", value: "forfait" },
      { label: "À l'acte / Par item", value: "per_item" },
      { label: "Provision / Retainer", value: "retainer" },
      { label: "Aide juridique", value: "aide_juridique" },
      { label: "Pourcentage / Contingence", value: "pourcentage" },
      { label: "Mixte selon le dossier", value: "mixte" },
    ],
  },
  {
    key: "hourly_rate",
    phase: 5,
    text: "Quel est votre taux horaire principal ?",
    type: "single",
    condition: (r) => Array.isArray(r.billing_mode) && (r.billing_mode.includes("horaire") || r.billing_mode.includes("mixte")),
    options: [
      { label: "Moins de 200 $/h", value: "moins_200" },
      { label: "200 $ à 300 $/h", value: "200_300" },
      { label: "300 $ à 400 $/h", value: "300_400" },
      { label: "Plus de 400 $/h", value: "plus_400" },
    ],
  },
  {
    key: "flat_fee_range",
    phase: 5,
    text: "En moyenne, quel est le montant de vos forfaits par mandat ?",
    type: "single",
    condition: (r) => Array.isArray(r.billing_mode) && (r.billing_mode.includes("forfait") || r.billing_mode.includes("per_item")),
    options: [
      { label: "Moins de 500 $ par mandat", value: "moins_500" },
      { label: "500 $ à 1 500 $", value: "500_1500" },
      { label: "1 500 $ à 5 000 $", value: "1500_5000" },
      { label: "Plus de 5 000 $", value: "plus_5000" },
      { label: "Ça varie beaucoup selon le dossier", value: "variable" },
    ],
  },
  {
    key: "per_item_volume",
    phase: 5,
    text: "En moyenne, combien de mandats ou transactions traitez-vous par mois ?",
    type: "single",
    condition: (r) => Array.isArray(r.billing_mode) && (r.billing_mode.includes("forfait") || r.billing_mode.includes("per_item")),
    options: [
      { label: "Moins de 5", value: "moins_5" },
      { label: "5 à 15", value: "5_15" },
      { label: "15 à 30", value: "15_30" },
      { label: "Plus de 30", value: "plus_30" },
    ],
  },
  {
    key: "annual_revenue",
    phase: 5,
    text: "Pour nous aider à évaluer l'impact financier de nos recommandations, pourriez-vous estimer le chiffre d'affaires annuel de votre cabinet ?",
    type: "single",
    options: [
      { label: "Moins de 100 000 $", value: "moins_100k" },
      { label: "100 000 $ à 250 000 $", value: "100k_250k" },
      { label: "250 000 $ à 500 000 $", value: "250k_500k" },
      { label: "500 000 $ à 1 000 000 $", value: "500k_1m" },
      { label: "Plus de 1 000 000 $", value: "plus_1m" },
      { label: "Je préfère ne pas répondre", value: "confidentiel" },
    ],
  },
  {
    key: "price_list",
    phase: 5,
    text: "Avez-vous une grille tarifaire documentée pour vos services à l'acte ?",
    type: "single",
    condition: (r) => Array.isArray(r.billing_mode) && r.billing_mode.includes("per_item"),
    options: [
      { label: "Oui, mise à jour régulièrement", value: "oui_jour" },
      { label: "Oui, mais elle date un peu", value: "oui_vieille" },
      { label: "Non, je détermine le prix au cas par cas", value: "non" },
    ],
  },
  {
    key: "time_tracking_method",
    phase: 5,
    text: "Comment enregistrez-vous vos heures facturables ?",
    type: "single",
    options: [
      { label: "En temps réel avec un outil dédié", value: "temps_reel" },
      { label: "À la fin de la journée, de mémoire", value: "fin_journee" },
      { label: "À la fin de la semaine ou du mois (estimations)", value: "fin_semaine" },
      { label: "Je ne les enregistre pas systématiquement", value: "pas_systematique" },
      { label: "Non applicable (je ne facture pas à l'heure)", value: "na" },
    ],
  },
  {
    key: "monthly_billing_time",
    phase: 5,
    text: "En moyenne, combien de temps consacrez-vous à la facturation chaque mois ?",
    type: "single",
    options: [
      { label: "Moins de 2 heures", value: "moins_2h" },
      { label: "2 à 5 heures", value: "2_5h" },
      { label: "5 à 10 heures", value: "5_10h" },
      { label: "Plus de 10 heures", value: "plus_10h" },
    ],
  },
  {
    key: "collection_rate",
    phase: 5,
    text: "Quel pourcentage de vos factures est payé dans les 30 jours ?",
    type: "single",
    options: [
      { label: "Plus de 90 %", value: "plus_90" },
      { label: "70 % à 90 %", value: "70_90" },
      { label: "50 % à 70 %", value: "50_70" },
      { label: "Moins de 50 %", value: "moins_50" },
      { label: "Je ne sais pas exactement", value: "inconnu" },
    ],
  },
  {
    key: "discount_practice",
    phase: 5,
    text: "Vous arrive-t-il d'accorder des rabais ou réductions à vos clients ?",
    type: "single",
    options: [
      { label: "Jamais", value: "jamais" },
      { label: "Rarement, dans des cas exceptionnels", value: "rarement" },
      { label: "Régulièrement, ça fait partie de ma pratique", value: "regulierement" },
      { label: "Souvent, sous pression du client", value: "souvent" },
    ],
  },
  {
    key: "discount_documentation",
    phase: 5,
    text: "Comment documentez-vous les rabais accordés ? (Le Règlement ' + reg.accountingRule + ' exige une documentation des réductions)",
    type: "single",
    condition: (r) => r.discount_practice !== undefined && r.discount_practice !== "jamais",
    options: [
      { label: "Note au dossier et sur la facture", value: "documente" },
      { label: "Seulement sur la facture", value: "facture_seule" },
      { label: "Pas de documentation formelle", value: "non_documente" },
    ],
  },
  {
    key: "ircc_portal_usage",
    phase: 5,
    text: "Utilisez-vous un système pour gérer vos portails IRCC et suivre vos demandes d'immigration ?",
    type: "single",
    condition: (r) => Array.isArray(r.practice_areas) && r.practice_areas.includes("immigration"),
    options: [
      { label: "Oui, intégré à mon logiciel de gestion", value: "integre" },
      { label: "Oui, mais séparé de ma gestion de dossiers", value: "separe" },
      { label: "Non, je gère tout manuellement dans le portail", value: "manuel" },
    ],
  },
  {
    key: "pension_calculation_tool",
    phase: 5,
    text: "Comment effectuez-vous les calculs de partage du patrimoine et de pension alimentaire ?",
    type: "single",
    condition: (r) => Array.isArray(r.practice_areas) && r.practice_areas.includes("familial"),
    options: [
      { label: "Logiciel spécialisé (ChildView, DivorceMate, etc.)", value: "logiciel" },
      { label: "Tableur Excel personnalisé", value: "excel" },
      { label: "Manuellement ou avec l'aide d'un comptable", value: "manuel" },
    ],
  },

  // ═══ PILIER 6 : Fidéicommis & comptabilité ═══
  {
    key: "trust_account_management",
    phase: 6,
    text: "Comment gérez-vous votre compte en fidéicommis ?",
    type: "single",
    options: [
      { label: "Manuellement (registre papier ou Excel)", value: "manuel" },
      { label: "Avec un logiciel dédié", value: "logiciel" },
      { label: "Mon comptable/teneur de livres s'en occupe", value: "comptable" },
      { label: "C'est un de mes plus gros casse-têtes", value: "casse_tete" },
      { label: "Je ne suis pas certain(e) d'être 100 % conforme", value: "incertain" },
    ],
  },
  {
    key: "reconciliation_frequency",
    phase: 6,
    text: "À quelle fréquence faites-vous la conciliation de votre compte en fidéicommis ?",
    type: "single",
    options: [
      { label: "Mensuellement (comme exigé par le Barreau)", value: "mensuel" },
      { label: "Aux 2-3 mois", value: "trimestriel" },
      { label: "Quand j'y pense ou avant une inspection", value: "irregulier" },
      { label: "Rarement ou jamais", value: "rarement" },
    ],
  },
  {
    key: "trust_multi_account",
    phase: 6,
    text: "Gérez-vous plusieurs comptes en fidéicommis distincts ?",
    type: "single",
    options: [
      { label: "Non, un seul compte", value: "un_seul" },
      { label: "Oui, 2-3 comptes", value: "2_3" },
      { label: "Oui, plus de 3 comptes", value: "plus_3" },
      { label: "Non applicable / Pas de fidéicommis", value: "na" },
    ],
  },
  {
    key: "trust_segregation",
    phase: 6,
    text: "Comment vous assurez-vous que les fonds en fidéicommis de chaque client sont correctement séparés et tracés ?",
    type: "single",
    options: [
      { label: "Logiciel avec grand livre par client automatisé", value: "logiciel" },
      { label: "Registre manuel par client (Excel ou papier)", value: "manuel" },
      { label: "Mon comptable s'en occupe", value: "comptable" },
      { label: "Je ne suis pas certain(e) que c'est fait correctement", value: "incertain" },
    ],
  },

  // ═══ PILIER 7 : Opérations & conformité ═══
  {
    key: "weekly_admin_hours",
    phase: 7,
    text: "Combien d'heures par semaine consacrez-vous aux tâches administratives (facturation, classement, recherche de documents) ?",
    type: "single",
    options: [
      { label: "Moins de 2 heures", value: "moins_2h" },
      { label: "2 à 5 heures", value: "2_5h" },
      { label: "5 à 10 heures", value: "5_10h" },
      { label: "Plus de 10 heures", value: "plus_10h" },
    ],
  },
  {
    key: "bar_inspection_confidence",
    phase: 7,
    text: "À quel point vous sentez-vous confiant(e) face à une inspection du Barreau du Québec ?",
    type: "scale",
    scaleMin: 1,
    scaleMax: 5,
    scaleLabels: {
      1: "Ça me donne des sueurs froides",
      5: "Je suis prêt(e) n'importe quand",
    },
  },
  {
    key: "loi25_compliance_level",
    phase: 7,
    text: "Où en êtes-vous avec la conformité en matière de protection des renseignements personnels ?",
    type: "single",
    options: [
      { label: "Conforme : responsable désigné, politique de confidentialité, registre des incidents", value: "conforme" },
      { label: "Partiellement : quelques mesures en place", value: "partiel" },
      { label: "En début de démarche", value: "debut" },
      { label: "Je ne sais pas ce que ça implique concrètement", value: "inconnu" },
    ],
  },
  {
    key: "data_protection_measures",
    phase: 7,
    text: "Quelles mesures de protection des données avez-vous en place ? (Plusieurs choix possibles)",
    type: "multi",
    options: [
      { label: "Chiffrement des courriels sensibles", value: "chiffrement_courriel" },
      { label: "Mots de passe robustes et authentification à 2 facteurs", value: "2fa" },
      { label: "Sauvegardes régulières et testées", value: "sauvegardes" },
      { label: "Politique d'utilisation des appareils personnels", value: "byod" },
      { label: "Formation du personnel", value: "formation" },
      { label: "Aucune mesure formelle", value: "aucune" },
    ],
  },
  {
    key: "current_tools",
    phase: 7,
    text: "Quels outils numériques utilisez-vous pour gérer votre cabinet ? (Plusieurs choix possibles)",
    type: "multi",
    options: [
      { label: "JurisÉvolution", value: "jurisevolution" },
      { label: "Clio / PracticePanther", value: "clio" },
      { label: "QuickBooks / Sage", value: "quickbooks" },
      { label: "Microsoft 365 / Google Workspace", value: "office" },
      { label: "Excel / Google Sheets", value: "excel" },
      { label: "Outils papier principalement", value: "papier" },
      { label: "Autre logiciel juridique", value: "autre_juridique" },
    ],
  },

  // ═══ COORDONNÉES ═══
  {
    key: "contact",
    phase: 7,
    text: "Votre audit est presque terminé. Pour recevoir votre rapport personnalisé par courriel, pourriez-vous me laisser vos coordonnées ?",
    type: "contact",
  },
];

/* ─────────────────────────────────────────────
   Adaptive reactions
   ───────────────────────────────────────────── */

function getReaction(key: string, value: string | number | string[], allResponses: Partial<AuditResponses>): string | null {
  switch (key) {
    case "province":
      if (value === "quebec") return "L'audit sera calibré selon les exigences du Barreau du Québec (" + reg.accountingRule + ") et de la Loi 25.";
      if (value === "ontario") return "L'audit sera adapté au Law Society of Ontario (By-Law 9) et à PIPEDA.";
      if (value === "bc") return "L'audit tiendra compte des règles du Law Society of British Columbia.";
      if (value === "alberta") return "L'audit sera adapté au Law Society of Alberta.";
      return "L'audit s'adaptera aux exigences de votre juridiction.";

    case "practice_type":
      if (value === "solo") return "La pratique solo demande une polyvalence remarquable. Vous portez plusieurs chapeaux — raison de plus pour avoir des systèmes solides.";
      if (value === "petit") return "Un cabinet de cette taille doit jongler entre la croissance et l'efficacité. Voyons comment vous vous en tirez !";
      if (value === "moyen") return "À cette taille, les enjeux de coordination et de conformité deviennent rapidement importants.";
      return "Intéressant ! Chaque structure a ses propres défis de gestion.";

    case "practice_areas":
      if (Array.isArray(value) && value.length >= 3) return "Vous avez une pratique diversifiée ! Ça ajoute de la complexité à la gestion, mais aussi de la résilience.";
      if (Array.isArray(value) && value.includes("familial")) return "Le droit familial est un domaine où la gestion des délais et la facturation peuvent être particulièrement complexes.";
      return "Merci ! Ça m'aide à mieux comprendre votre réalité quotidienne.";

    case "years_active":
      if (value === "moins_1") return "Vous en êtes aux fondations — c'est le moment idéal pour mettre en place les bonnes pratiques dès le départ !";
      if (value === "plus_10") return "Plus de 10 ans d'expérience, c'est une belle maturité. Voyons si vos outils ont évolué avec votre pratique.";
      return null;

    case "team_size":
      if (value === "solo_team") return "Tout repose sur vos épaules — raison de plus pour avoir des systèmes solides.";
      if (value === "plus_10") return "À cette taille, la coordination et la conformité deviennent des enjeux majeurs.";
      return null;

    case "active_cases":
      if (value === "plus_100") return "Plus de 100 dossiers actifs — la moindre inefficacité se multiplie rapidement à cette échelle.";
      if (value === "50_100") return "Un volume significatif. Un bon système de suivi fait vraiment la différence.";
      return null;

    case "case_tracking_method":
      if (value === "papier") return "Le risque d'échéance manquée est 3 fois plus élevé sans outil numérique. C'est un constat fréquent lors des inspections.";
      if (value === "aucun") return "C'est plus courant qu'on le pense. La bonne nouvelle : il existe des solutions simples qui transforment le quotidien.";
      if (value === "logiciel") return "Excellent ! Vous avez déjà une longueur d'avance.";
      if (value === "melange") return "Le système hybride peut créer des angles morts — l'information est dispersée entre plusieurs supports.";
      return null;

    case "opening_checklist":
      if (value === "inconnu") return "Une checklist d'ouverture est un outil simple mais puissant — elle réduit les erreurs et assure la conformité dès le départ.";
      if (value === "oui_systematique") return "Excellent réflexe ! C'est exactement ce que le Barreau recommande.";
      return null;

    case "closing_process":
      if (value === "jamais") return "Des dossiers qui restent ouverts indéfiniment peuvent poser problème lors d'une inspection et compliquent la gestion du fidéicommis.";
      if (value === "formel" || value === "logiciel") return "Un processus formel de fermeture, c'est une bonne pratique de gestion.";
      return null;

    case "retention_policy":
      if (value === "inconnu") return "Les délais de conservation varient selon le type de document. Le Barreau exige une politique documentée.";
      if (value === "oui_appliquee") return "Bravo — une politique de rétention appliquée, c'est un signe de maturité organisationnelle.";
      return null;

    case "deadline_tracking":
      if (value === "memoire" || value === "aucun") return "Se fier à la mémoire pour les échéances judiciaires est le facteur de risque #1 de faute professionnelle.";
      if (value === "logiciel") return "Des alertes automatiques pour les échéances — c'est le filet de sécurité le plus efficace.";
      return null;

    case "prescription_management":
      if (value === "negligence") return "Merci pour votre honnêteté. Un seul délai de prescription manqué peut entraîner une poursuite en responsabilité professionnelle.";
      if (value === "stress") return "Ce stress est légitime. Des rappels automatiques peuvent transformer cette anxiété en tranquillité d'esprit.";
      if (value === "systematique") return "Excellent réflexe ! La vérification systématique est la meilleure protection.";
      return null;

    case "missed_deadline_history":
      if (value === "consequences") return "Merci pour votre transparence. Un seul délai manqué peut avoir des conséquences majeures. Mettre en place des filets de sécurité est essentiel.";
      if (value === "jamais") return "Aucun délai manqué — c'est rassurant. Voyons comment maintenir cette excellente performance.";
      return null;

    case "reminder_system":
      if (value === "non") return "Sans système de rappels, vous dépendez entièrement de votre vigilance. C'est un risque évitable.";
      if (value === "souhaite") return "C'est un excellent premier pas que de reconnaître ce besoin.";
      return null;

    case "intake_process":
      if (value === "aucun") return "L'absence de processus d'accueil structuré peut mener à des oublis de vérification importants.";
      if (value === "structure") return "Un processus structuré — mandat, vérification, formulaire — c'est la meilleure protection pour vous et vos clients.";
      return null;

    case "conflict_check":
      if (value === "aucun") return "C'est un point critique. Le Code de déontologie (art. 3.06.01) rend la vérification des conflits obligatoire. C'est un des éléments les plus examinés lors d'une inspection.";
      if (value === "informel") return "Une vérification informelle est mieux que rien, mais elle ne laisse pas de trace vérifiable en cas d'inspection.";
      if (value === "registre") return "La vérification systématique dans un registre — c'est exactement ce que le Barreau attend.";
      return null;

    case "conflict_check_multi_area":
      if (value === "memoire" || value === "inconnu") return "Avec plusieurs domaines de pratique, le risque de conflit entre dossiers est multiplié. Une base de données centralisée est fortement recommandée.";
      return null;

    case "mandate_documentation":
      if (value === "verbal") return "Un mandat verbal est difficile à prouver en cas de litige avec un client. Le Code de déontologie recommande une documentation écrite systématique.";
      if (value === "systematique") return "La convention de mandat signée systématiquement — c'est la norme d'excellence.";
      return null;

    case "loi25_consent":
      if (value === "non_inconnu" || value === "non") return "La Loi 25 est entrée en vigueur progressivement depuis septembre 2023. Le consentement préalable à la collecte de renseignements personnels est désormais obligatoire.";
      if (value === "oui_formulaire") return "Excellent ! Un formulaire de consentement dédié, c'est la meilleure approche pour la Loi 25.";
      return null;

    case "billing_mode":
      if (Array.isArray(value) && value.length >= 3) return "Plusieurs modes de facturation — ça demande une rigueur supplémentaire dans la documentation.";
      if (Array.isArray(value) && value.includes("per_item")) return "La facturation à l'acte nécessite une grille tarifaire bien documentée.";
      if (Array.isArray(value) && value.includes("aide_juridique")) return "L'aide juridique a des tarifs gouvernementaux fixes — important de bien les suivre.";
      return null;

    case "hourly_rate":
      if (value === "plus_400") return "Un taux premium — vos clients paient pour votre expertise. Raison de plus pour que chaque heure soit bien captée.";
      if (value === "moins_200") return "À ce taux, chaque heure perdue compte d'autant plus. Voyons comment maximiser votre capture de temps.";
      return null;

    case "flat_fee_range":
      if (value === "variable") return "Des forfaits très variables d'un dossier à l'autre — c'est important de bien documenter la base de chaque prix pour éviter les litiges.";
      return null;

    case "per_item_volume":
      if (value === "plus_30") return "Plus de 30 mandats par mois — c'est un volume important ! L'automatisation de la facturation devient essentielle à cette échelle.";
      return null;

    case "annual_revenue":
      if (value === "confidentiel") return "Pas de souci, c'est tout à fait compréhensible. On continuera avec les autres données pour estimer l'impact.";
      if (value === "plus_1m") return "Un cabinet d'un million+ — félicitations. À cette échelle, chaque inefficacité administrative a un coût amplifié.";
      return "Merci pour cette information. Elle nous permettra de calculer l'impact financier concret de nos recommandations.";

    case "collection_rate":
      if (value === "moins_50") return "Un taux de recouvrement sous 50 % met en péril la viabilité financière du cabinet. C'est un signal d'alarme important.";
      if (value === "plus_90") return "Plus de 90 % — excellent taux de recouvrement ! Vos clients vous font confiance et paient à temps.";
      return null;

    case "discount_practice":
      if (value === "souvent") return "Des rabais fréquents sous pression du client peuvent affecter significativement votre rentabilité. Le Barreau exige aussi que chaque réduction soit documentée.";
      return null;

    case "discount_documentation":
      if (value === "non_documente") return "Attention : le Règlement ' + reg.accountingRule + ' exige que tout rabais soit documenté au dossier et sur la facture.";
      return null;

    case "trust_account_management":
      if (value === "casse_tete") return "Le fidéicommis est l'un des aspects les plus stressants de la gestion d'un cabinet. Des solutions existent pour simplifier tout ça.";
      if (value === "incertain") return "L'incertitude sur la conformité du fidéicommis est un signal qu'il faut agir. Mieux vaut corriger maintenant qu'au moment d'une inspection.";
      if (value === "logiciel") return "Un logiciel dédié pour le fidéicommis — c'est un excellent réflexe de conformité !";
      return null;

    case "reconciliation_frequency":
      if (value === "rarement" || value === "irregulier") return "La conciliation mensuelle est une obligation réglementaire (' + reg.accountingRule + '). C'est souvent le premier élément vérifié lors d'une inspection.";
      if (value === "mensuel") return "Conciliation mensuelle — vous respectez l'exigence du Barreau. C'est bien.";
      return null;

    case "trust_segregation":
      if (value === "incertain") return "L'incertitude sur la ségrégation des fonds est le constat le plus grave lors d'une inspection du fidéicommis. C'est à corriger en priorité.";
      return null;

    case "weekly_admin_hours": {
      const hours = value === "moins_2h" ? 1.5 : value === "2_5h" ? 3.5 : value === "5_10h" ? 7.5 : 12;
      const monthlyLoss = Math.round(hours * 250 * 4);
      if (hours >= 5) return `À un taux horaire moyen de 250 $/h, cela représente environ ${monthlyLoss.toLocaleString("fr-CA")} $ par mois en revenus potentiels perdus.`;
      if (hours >= 2) return `Environ ${monthlyLoss.toLocaleString("fr-CA")} $/mois en revenus potentiels. Chaque heure récupérée compte !`;
      return "C'est raisonnable. Vous gérez bien votre temps administratif.";
    }

    case "bar_inspection_confidence":
      if (typeof value === "number" && value <= 2) return "Ce stress est partagé par beaucoup d'avocats. La conformité ne devrait pas être une source d'anxiété — elle devrait être automatique.";
      if (typeof value === "number" && value >= 4) return "Belle confiance ! Voyons si on peut quand même identifier des pistes d'amélioration.";
      return null;

    case "loi25_compliance_level":
      if (value === "inconnu") return "La Loi 25 oblige toute entreprise à désigner un responsable de la protection des renseignements personnels. Il est encore temps de se mettre en conformité.";
      if (value === "conforme") return "Félicitations ! Être pleinement conforme à la Loi 25, c'est un avantage concurrentiel et une protection pour vos clients.";
      return null;

    case "data_protection_measures":
      if (Array.isArray(value) && value.includes("aucune")) return "Aucune mesure formelle de protection des données — c'est un risque important pour la confidentialité de vos clients et pour votre conformité.";
      if (Array.isArray(value) && value.length >= 4) return "Vous avez plusieurs mesures en place — c'est très bien. Voyons le portrait d'ensemble.";
      return null;

    default:
      return null;
  }
}

/* ─────────────────────────────────────────────
   Calculations
   ───────────────────────────────────────────── */

function getStatus(score: number): SectionDiagnostic["status"] {
  if (score >= 80) return "excellent";
  if (score >= 60) return "bon";
  if (score >= 40) return "attention";
  return "critique";
}

const PRACTICE_LABELS: Record<string, string> = {
  solo: "Avocat(e) solo",
  petit: "Petit cabinet (2-5 avocats)",
  moyen: "Cabinet moyen (6-15 avocats)",
};

const CASE_TRACKING_LABELS: Record<string, string> = {
  papier: "Agenda papier / Post-it",
  excel: "Excel / Google Sheets",
  logiciel: "Logiciel spécialisé",
  melange: "Système hybride",
  aucun: "Pas de système structuré",
};

const TRUST_LABELS: Record<string, string> = {
  manuel: "Registre manuel (papier ou Excel)",
  logiciel: "Logiciel dédié",
  comptable: "Comptable / teneur de livres",
  casse_tete: "Source de difficulté majeure",
  incertain: "Conformité incertaine",
};

const TIME_TRACKING_LABELS: Record<string, string> = {
  temps_reel: "En temps réel avec un outil dédié",
  fin_journee: "En fin de journée, de mémoire",
  fin_semaine: "En fin de semaine/mois (estimations)",
  pas_systematique: "Pas enregistré systématiquement",
  na: "Non applicable",
};

function scoreMap(value: string | undefined, map: Record<string, number>, fallback = 50): number {
  return map[value || ""] ?? fallback;
}

function computeResults(responses: Partial<AuditResponses>): AuditComputed {
  const sm = (v: string | undefined, m: Record<string, number>, fb = 50) => scoreMap(v, m, fb);
  const reg = getRegContext(responses.province || "quebec");

  // ═══ PILIER 1 : Gestion des dossiers ═══
  const trackingScore = sm(responses.case_tracking_method, { logiciel: 90, excel: 55, melange: 40, papier: 20, aucun: 10 });
  const checklistScore = sm(responses.opening_checklist, { oui_systematique: 100, parfois: 50, non: 20, inconnu: 10 });
  const closingScore = sm(responses.closing_process, { logiciel: 95, formel: 90, informel: 35, jamais: 10 });
  const retentionScore = sm(responses.retention_policy, { oui_appliquee: 100, informelle: 50, non: 20, inconnu: 10 });
  const dossierScore = Math.round(trackingScore * 0.30 + checklistScore * 0.25 + closingScore * 0.25 + retentionScore * 0.20);

  const dossierFindings: string[] = [];
  const dossierRecs: string[] = [];
  const method = responses.case_tracking_method || "";
  if (["papier", "aucun"].includes(method)) {
    dossierFindings.push(`Méthode de suivi (${CASE_TRACKING_LABELS[method] || method}) : risque élevé d'échéances manquées.`);
    dossierRecs.push("Migrer vers un système de suivi numérique centralisé.");
  } else if (method === "melange") {
    dossierFindings.push("Système hybride : l'information est dispersée entre plusieurs supports.");
    dossierRecs.push("Centraliser vos dossiers dans une plateforme unique.");
  } else if (method === "excel") {
    dossierFindings.push("Excel ne gère pas les alertes automatiques ni la collaboration.");
    dossierRecs.push("Évoluer vers un outil avec alertes d'échéances et historique.");
  }
  if (responses.opening_checklist === "non" || responses.opening_checklist === "inconnu") {
    dossierFindings.push("Absence de checklist d'ouverture de dossier. Référence : Guide d'inspection du Barreau, section Gestion des dossiers.");
    dossierRecs.push(`Implémenter une checklist standardisée (mandat, conflits, identité, ${reg.privacyLaw}).`);
  }
  if (responses.closing_process === "jamais") {
    dossierFindings.push("Dossiers jamais formellement fermés — complication pour le fidéicommis et l'archivage.");
    dossierRecs.push("Mettre en place un processus de fermeture avec vérification du solde fidéicommis.");
  }
  if (responses.retention_policy === "non" || responses.retention_policy === "inconnu") {
    dossierFindings.push("Non-conformité potentielle : le Barreau exige une politique de conservation (' + reg.accountingRule + '). Risque : sanction lors d'une inspection.");
    dossierRecs.push("Définir une politique de rétention par type de document.");
  }
  if (responses.case_tracking_details) dossierFindings.push(`Vos commentaires : « ${responses.case_tracking_details} »`);

  // ═══ PILIER 2 : Échéanciers & délais ═══
  const deadlineScore = sm(responses.deadline_tracking, { logiciel: 95, calendrier: 60, papier: 30, memoire: 10, aucun: 5 });
  const prescriptionScore = sm(responses.prescription_management, { systematique: 95, au_besoin: 50, stress: 30, negligence: 10 });
  const missedScore = sm(responses.missed_deadline_history, { jamais: 100, une_fois: 50, consequences: 10, prefere_pas: 30 });
  const reminderScore = sm(responses.reminder_system, { oui_logiciel: 95, oui_calendrier: 55, non: 15, souhaite: 25 });
  const echeancierScore = Math.round((deadlineScore + prescriptionScore + missedScore + reminderScore) / 4);

  const echFindings: string[] = [];
  const echRecs: string[] = [];
  if (responses.deadline_tracking === "memoire" || responses.deadline_tracking === "aucun") {
    echFindings.push("Suivi des échéances basé sur la mémoire — facteur de risque #1 de faute professionnelle.");
    echRecs.push("Implémenter un système d'alertes automatiques pour toutes les échéances judiciaires.");
  }
  if (responses.prescription_management === "negligence") {
    echFindings.push("Gestion inadéquate des prescriptions. Réf : ' + reg.conflictRule + ' (diligence). Risque : poursuite en responsabilité professionnelle.");
    echRecs.push("Noter systématiquement les délais de prescription à l'ouverture de chaque dossier.");
  }
  if (responses.missed_deadline_history === "consequences") {
    echFindings.push("Échéance manquée avec conséquences — manquement grave (' + reg.conflictRule + '). Risque : plainte déontologique.");
    echRecs.push("Mettre en place un double système de rappels (automatique + vérification humaine).");
  }
  if (responses.reminder_system === "non") {
    echFindings.push("Aucun système de rappels automatiques en place.");
    echRecs.push("Adopter un outil avec rappels automatiques configurables par type d'échéance.");
  }

  // ═══ PILIER 3 : Gestion de la clientèle ═══
  const intakeScore = sm(responses.intake_process, { structure: 95, variable: 55, informel: 35, aucun: 10 });
  const conflictScore = sm(responses.conflict_check, { registre: 100, informel: 40, au_besoin: 25, aucun: 5 });
  const mandateScore = sm(responses.mandate_documentation, { systematique: 95, parfois: 50, courriel: 35, verbal: 10 });
  const consentScore = sm(responses.loi25_consent, { oui_formulaire: 100, dans_mandat: 70, non_inconnu: 15, non: 10 });
  let clienteleScore = Math.round(conflictScore * 0.30 + mandateScore * 0.25 + intakeScore * 0.20 + consentScore * 0.25);
  // Pénalité multi-pratiques sans vérification centralisée
  if (responses.conflict_check_multi_area === "memoire" || responses.conflict_check_multi_area === "inconnu") {
    clienteleScore = Math.max(0, clienteleScore - 10);
  }

  const clientFindings: string[] = [];
  const clientRecs: string[] = [];
  if (responses.conflict_check === "aucun") {
    clientFindings.push("Non-conformité grave : vérification des conflits d'intérêts obligatoire (' + reg.conflictRule + '). Risque : radiation temporaire, amende.");
    clientRecs.push("Mettre en place un registre centralisé de vérification des conflits d'intérêts.");
  } else if (responses.conflict_check === "informel") {
    clientFindings.push("Vérification informelle des conflits — ne laisse pas de trace vérifiable en cas d'inspection.");
    clientRecs.push("Formaliser la vérification des conflits avec un registre documenté.");
  }
  if (responses.mandate_documentation === "verbal") {
    clientFindings.push("Mandats souvent verbaux — difficile à prouver en cas de litige. Réf : ' + reg.mandateRef + '.");
    clientRecs.push("Faire signer systématiquement une convention de mandat écrite.");
  }
  if (responses.loi25_consent === "non" || responses.loi25_consent === "non_inconnu") {
    clientFindings.push(`Non-conformité (${reg.privacyLaw}) : consentement préalable à la collecte de renseignements personnels obligatoire. Risque : ${reg.privacyPenalty}.`);
    clientRecs.push(`Implémenter un formulaire de consentement (${reg.privacyLaw}) dans le processus d'accueil.`);
  }
  if (responses.conflict_check_multi_area === "memoire" || responses.conflict_check_multi_area === "inconnu") {
    clientFindings.push("Pratique multi-domaines sans vérification centralisée des conflits — risque multiplié.");
    clientRecs.push("Base de données centralisée de tous les clients et parties adverses.");
  }

  // ═══ PILIER 4 : Facturation & recouvrement ═══
  const timeScore = sm(responses.time_tracking_method, { temps_reel: 95, fin_journee: 60, fin_semaine: 35, pas_systematique: 10, na: 70 });
  const billingTimeScore = sm(responses.monthly_billing_time, { "moins_2h": 90, "2_5h": 70, "5_10h": 40, "plus_10h": 15 });
  const collectionScore = sm(responses.collection_rate, { plus_90: 95, "70_90": 65, "50_70": 35, moins_50: 10, inconnu: 30 });
  let discountScore = sm(responses.discount_practice, { jamais: 80, rarement: 70, regulierement: 50, souvent: 30 });
  if (responses.discount_documentation === "non_documente") discountScore = Math.max(0, discountScore - 20);
  const facturationScore = Math.round(timeScore * 0.25 + billingTimeScore * 0.20 + collectionScore * 0.30 + discountScore * 0.25);

  const factFindings: string[] = [];
  const factRecs: string[] = [];
  if (responses.time_tracking_method === "pas_systematique") {
    factFindings.push("Heures non enregistrées systématiquement — perte estimée de 20-30 % des revenus facturables.");
    factRecs.push("Enregistrer les heures en temps réel avec chronomètre intégré.");
  }
  if (responses.collection_rate === "moins_50") {
    factFindings.push("Taux de recouvrement sous 50 % — menace pour la viabilité financière du cabinet.");
    factRecs.push("Politique de paiement anticipé et suivi automatisé des factures impayées.");
  }
  if (responses.discount_documentation === "non_documente") {
    factFindings.push("Rabais non documentés. Non-conformité : ' + reg.accountingRule + ' exige documentation au dossier et sur la facture. Risque : constat lors d'une inspection comptable.");
    factRecs.push("Documenter chaque rabais avec le motif au dossier et sur la facture.");
  }
  if (["plus_10h", "5_10h"].includes(responses.monthly_billing_time || "")) {
    factFindings.push("Temps excessif consacré à la facturation — potentiel d'automatisation important.");
    factRecs.push("Automatiser la génération de factures à partir des entrées de temps et débours.");
  }

  // ═══ PILIER 5 : Fidéicommis & comptabilité ═══
  const trustMgmtScore = sm(responses.trust_account_management, { logiciel: 90, comptable: 60, manuel: 35, incertain: 20, casse_tete: 10 });
  const reconScore = sm(responses.reconciliation_frequency, { mensuel: 100, trimestriel: 40, irregulier: 15, rarement: 5 });
  const segregScore = sm(responses.trust_segregation, { logiciel: 95, comptable: 60, manuel: 50, incertain: 10 });
  const fideicommisScore = Math.round(trustMgmtScore * 0.30 + reconScore * 0.35 + segregScore * 0.35);

  const fidFindings: string[] = [];
  const fidRecs: string[] = [];
  const trustMethod = responses.trust_account_management || "";
  if (["casse_tete", "incertain"].includes(trustMethod)) {
    fidFindings.push(`Gestion du fidéicommis (${TRUST_LABELS[trustMethod] || trustMethod}) : risque de non-conformité majeur.`);
    fidRecs.push("Outil de gestion du fidéicommis avec conciliation automatique et rapports de conformité.");
  } else if (trustMethod === "manuel") {
    fidFindings.push("Gestion manuelle du fidéicommis — chronophage et exposée aux erreurs.");
    fidRecs.push("Automatiser la conciliation avec alertes sur les anomalies.");
  }
  if (responses.reconciliation_frequency !== "mensuel" && responses.reconciliation_frequency) {
    fidFindings.push("Non-conformité : ' + reg.accountingRule + ' art. 16 exige une conciliation mensuelle. Risque : sanction automatique lors d'une inspection.");
    fidRecs.push("Mettre en place une conciliation mensuelle systématique.");
  }
  if (responses.trust_segregation === "incertain") {
    fidFindings.push("ALERTE : incertitude sur la ségrégation des fonds — constat le plus grave lors d'une inspection (' + reg.accountingRule + ' art. 12-15). Risque : radiation temporaire, enquête du syndic.");
    fidRecs.push("Vérifier immédiatement la ségrégation par client avec un grand livre automatisé.");
  }

  // ═══ PILIER 6 : Opérations ═══
  const adminScore = sm(responses.weekly_admin_hours, { "moins_2h": 90, "2_5h": 65, "5_10h": 35, "plus_10h": 10 });
  const barScore = ((responses.bar_inspection_confidence || 3) / 5) * 100;
  const toolsBonus = Array.isArray(responses.current_tools) && responses.current_tools.some(t => ["jurisevolution", "clio", "autre_juridique"].includes(t)) ? 10 : 0;
  const operationsScore = Math.round(adminScore * 0.40 + barScore * 0.40 + Math.min(100, toolsBonus * 2) * 0.20);

  const opsFindings: string[] = [];
  const opsRecs: string[] = [];
  const adminHoursMap: Record<string, number> = { "moins_2h": 1.5, "2_5h": 3.5, "5_10h": 7.5, "plus_10h": 12 };
  const weeklyHours = adminHoursMap[responses.weekly_admin_hours || ""] || 3.5;
  if (weeklyHours >= 7.5) {
    opsFindings.push(`${weeklyHours} h/semaine en administratif — soit ~${Math.round(weeklyHours * 4)} h/mois non facturables.`);
    opsRecs.push("Automatiser les tâches répétitives : relances, classement, rapports.");
  } else if (weeklyHours >= 3.5) {
    opsFindings.push(`${weeklyHours} h/semaine en administratif — volume réductible de 50-70 %.`);
    opsRecs.push("Optimiser les flux administratifs avec des automatisations ciblées.");
  }
  if ((responses.bar_inspection_confidence || 3) <= 2) {
    opsFindings.push(`Confiance face à l'inspection : ${responses.bar_inspection_confidence}/5 — source de stress.`);
    opsRecs.push("Mettre en place des contrôles automatisés pour être prêt en tout temps.");
  }

  // ═══ PILIER 7 : Conformité Loi 25 ═══
  const loi25LevelScore = sm(responses.loi25_compliance_level, { conforme: 100, partiel: 55, debut: 25, inconnu: 5 });
  const measuresCount = Array.isArray(responses.data_protection_measures) ? responses.data_protection_measures.filter(m => m !== "aucune").length : 0;
  const measuresScore = Math.min(100, measuresCount * 20);
  const loi25ConsentScore = sm(responses.loi25_consent, { oui_formulaire: 100, dans_mandat: 70, non_inconnu: 15, non: 10 });
  const loi25Score = Math.round(loi25LevelScore * 0.40 + measuresScore * 0.35 + loi25ConsentScore * 0.25);

  const loi25Findings: string[] = [];
  const loi25Recs: string[] = [];
  if (responses.loi25_compliance_level === "inconnu") {
    loi25Findings.push(`Non-conformité (${reg.privacyLaw}) : obligation de désigner un responsable de la protection des renseignements personnels. Risque : ${reg.privacyPenalty}.`);
    loi25Recs.push("Désigner un responsable de la protection des renseignements et adopter une politique de confidentialité.");
  } else if (responses.loi25_compliance_level === "debut") {
    loi25Findings.push(`Démarche ${reg.privacyLaw} en cours — plusieurs obligations restent à compléter.`);
    loi25Recs.push("Compléter l'évaluation des facteurs relatifs à la vie privée et le registre des incidents.");
  }
  if (measuresCount === 0) {
    loi25Findings.push(`Aucune mesure formelle de protection des données — risque d'atteinte à la confidentialité (${reg.privacyLaw}).`);
    loi25Recs.push("Mettre en place : chiffrement, mots de passe robustes, sauvegardes, formation du personnel.");
  }

  // ═══ SCORE GLOBAL ═══
  const globalScore = Math.round(
    dossierScore * 0.15 +
    echeancierScore * 0.15 +
    clienteleScore * 0.15 +
    facturationScore * 0.15 +
    fideicommisScore * 0.20 +
    operationsScore * 0.10 +
    loi25Score * 0.10
  );
  const painScore = Math.min(100, Math.max(0, 100 - globalScore));

  let maturity = "Intermédiaire";
  if (globalScore >= 75) maturity = "Avancé";
  else if (globalScore < 45) maturity = "Débutant";

  // ── Financial impact (adapted to billing mode and revenue) ──
  const hourlyRateMap: Record<string, number> = { moins_200: 175, "200_300": 250, "300_400": 350, plus_400: 450 };
  const effectiveRate = hourlyRateMap[responses.hourly_rate || ""] || 250;

  const revenueMap: Record<string, number> = {
    moins_100k: 75000, "100k_250k": 175000, "250k_500k": 375000,
    "500k_1m": 750000, plus_1m: 1250000, confidentiel: 0,
  };
  const estimatedRevenue = revenueMap[responses.annual_revenue || ""] || 0;

  // Collection rate loss
  const collectionLossRate: Record<string, number> = {
    plus_90: 0.03, "70_90": 0.12, "50_70": 0.25, moins_50: 0.40, inconnu: 0.10,
  };
  const collectionLoss = estimatedRevenue > 0
    ? Math.round(estimatedRevenue * (collectionLossRate[responses.collection_rate || ""] || 0.10) / 12)
    : 0;

  // Admin time loss
  const adminTimeLoss = Math.round(weeklyHours * effectiveRate * 4);

  const estimatedMonthlyLoss = adminTimeLoss + collectionLoss;
  const estimatedAnnualLoss = estimatedMonthlyLoss * 12;
  const potentialRecovery = Math.round(estimatedAnnualLoss * 0.7);

  // ── Strengths ──
  const strengths: string[] = [];
  if (method === "logiciel") strengths.push("Logiciel spécialisé pour le suivi des dossiers");
  if (responses.opening_checklist === "oui_systematique") strengths.push("Checklist d'ouverture systématique");
  if (responses.conflict_check === "registre") strengths.push("Vérification des conflits d'intérêts rigoureuse");
  if (responses.reconciliation_frequency === "mensuel") strengths.push("Conciliation mensuelle du fidéicommis");
  if (responses.deadline_tracking === "logiciel") strengths.push("Alertes automatiques pour les échéances");
  if (responses.mandate_documentation === "systematique") strengths.push("Convention de mandat systématique");
  if (responses.loi25_compliance_level === "conforme") strengths.push("Conformité Loi 25 complète");
  if ((responses.bar_inspection_confidence || 0) >= 4) strengths.push("Bonne confiance face aux inspections");
  if (weeklyHours <= 2) strengths.push("Temps administratif bien maîtrisé");
  if (strengths.length === 0) strengths.push("Vous avez pris l'initiative de faire cet audit — c'est un premier pas important.");

  // ── Recommendations (top 3) ──
  const allRecs = [...fidRecs, ...echRecs, ...clientRecs, ...factRecs, ...dossierRecs, ...loi25Recs, ...opsRecs];
  if (allRecs.length === 0) allRecs.push("Optimiser vos processus existants avec des outils intégrés.");

  // ── 7 Section objects ──
  const sections: SectionDiagnostic[] = [
    {
      title: "Gestion des dossiers",
      score: dossierScore,
      status: getStatus(dossierScore),
      findings: dossierFindings,
      recommendations: dossierRecs,
      safeHelp: "SAFE centralise dossiers, documents et échéances dans une interface unique avec checklists d'ouverture/fermeture, archivage automatique et politique de rétention intégrée.",
    },
    {
      title: "Échéanciers & délais",
      score: echeancierScore,
      status: getStatus(echeancierScore),
      findings: echFindings,
      recommendations: echRecs,
      safeHelp: "SAFE surveille vos échéances de cour, prescriptions et délais de production avec des alertes automatiques configurables et un calendrier centralisé.",
    },
    {
      title: "Gestion de la clientèle",
      score: clienteleScore,
      status: getStatus(clienteleScore),
      findings: clientFindings,
      recommendations: clientRecs,
      safeHelp: "SAFE intègre un processus d'accueil structuré, la vérification des conflits d'intérêts, la convention de mandat et le consentement Loi 25 dans un workflow fluide.",
    },
    {
      title: "Facturation & recouvrement",
      score: facturationScore,
      status: getStatus(facturationScore),
      findings: factFindings,
      recommendations: factRecs,
      safeHelp: "SAFE gère tous les modes de facturation (horaire, forfait, à l'acte), avec suivi du recouvrement, relances automatiques et documentation des rabais conforme au ' + reg.accountingRule + '.",
    },
    {
      title: "Fidéicommis & comptabilité",
      score: fideicommisScore,
      status: getStatus(fideicommisScore),
      findings: fidFindings,
      recommendations: fidRecs,
      safeHelp: "SAFE gère votre fidéicommis en conformité totale : conciliation mensuelle automatique, ségrégation par client, rapports d'inspection pré-générés et traçabilité complète.",
    },
    {
      title: "Opérations",
      score: operationsScore,
      status: getStatus(operationsScore),
      findings: opsFindings,
      recommendations: opsRecs,
      safeHelp: "SAFE automatise les tâches répétitives : classement intelligent, relances, modèles de documents et tableaux de bord en temps réel.",
    },
    {
      title: `Conformité ${reg.privacyLaw}`,
      score: loi25Score,
      status: getStatus(loi25Score),
      findings: loi25Findings,
      recommendations: loi25Recs,
      safeHelp: `SAFE intègre la gestion du consentement, la politique de conservation, le registre des incidents et le chiffrement des données sensibles — conformité ${reg.privacyLaw} automatisée.`,
    },
  ];

  // ── Overall summary ──
  const weakSections = sections.filter((s) => s.status === "critique" || s.status === "attention");
  const strongSections = sections.filter((s) => s.status === "excellent" || s.status === "bon");
  let summary = "";
  if (weakSections.length === 0) {
    summary = "Votre cabinet présente un bon niveau de maturité. Quelques optimisations ciblées pourraient maximiser votre efficacité.";
  } else if (weakSections.length <= 3) {
    summary = `Votre cabinet possède des bases solides${strongSections.length > 0 ? ` (${strongSections.map((s) => s.title.toLowerCase()).join(", ")})` : ""}, mais ${weakSections.length === 1 ? "un pilier nécessite" : "certains piliers nécessitent"} une attention particulière : ${weakSections.map((s) => s.title.toLowerCase()).join(", ")}.`;
  } else {
    summary = "Votre cabinet fait face à des défis sur plusieurs fronts. La bonne nouvelle : les solutions existent et un accompagnement structuré peut transformer votre pratique rapidement.";
  }

  return {
    pain_score: painScore,
    maturity_level: maturity,
    estimated_monthly_loss: estimatedMonthlyLoss,
    estimated_annual_loss: estimatedAnnualLoss,
    potential_recovery: potentialRecovery,
    priority_recommendations: allRecs.slice(0, 3),
    sections,
    strengths,
    overall_summary: summary,
  };
}

/* ─────────────────────────────────────────────
   Helper: unique ID
   ───────────────────────────────────────────── */

function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

/* ─────────────────────────────────────────────
   Circular Score Gauge
   ───────────────────────────────────────────── */

function ScoreGauge({ score, size = 160 }: { score: number; size?: number }) {
  const radius = (size - 16) / 2;
  const circumference = 2 * Math.PI * radius;
  // Invert: high pain = low score displayed
  const displayScore = Math.max(0, 100 - score);
  const strokeDashoffset = circumference - (displayScore / 100) * circumference;
  const color = displayScore >= 70 ? "#436850" : displayScore >= 40 ? "#ADBC9F" : "#ef4444";

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(18,55,42,0.1)"
          strokeWidth="8"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="audit-gauge-fill"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold text-[var(--safe-text-title)] font-sans">{displayScore}</span>
        <span className="text-xs text-[var(--safe-text-secondary)] font-sans">/100</span>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Main Component
   ───────────────────────────────────────────── */

export default function AuditChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(-1); // -1 = intro
  const [responses, setResponses] = useState<Partial<AuditResponses>>({});
  const [isTyping, setIsTyping] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [started, setStarted] = useState(false);
  const [multiSelect, setMultiSelect] = useState<string[]>([]);
  const [customText, setCustomText] = useState("");
  const [showCustomField, setShowCustomField] = useState(false);
  const [openText, setOpenText] = useState("");
  const [contactForm, setContactForm] = useState({ name: "", email: "", phone: "", firm: "" });
  const [auditId] = useState(() => uid());
  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const lastAuditorRef = useRef<HTMLDivElement>(null);

  const scrollToLatest = useCallback(() => {
    setTimeout(() => {
      lastAuditorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  }, []);

  // Simulate typing delay then add auditor message
  const addAuditorMessage = useCallback(
    (text: string, question?: Question) => {
      setIsTyping(true);
      const delay = Math.min(1200, 400 + text.length * 8);

      return new Promise<void>((resolve) => {
        setTimeout(() => {
          setIsTyping(false);
          const msg: ChatMessage = {
            id: uid(),
            sender: "auditor",
            text,
            timestamp: Date.now(),
          };
          if (question) {
            msg.options = question.options;
            msg.questionType = question.type;
            msg.questionKey = question.key;
            msg.scaleMin = question.scaleMin;
            msg.scaleMax = question.scaleMax;
            msg.scaleLabels = question.scaleLabels;
            msg.placeholder = question.placeholder;
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
            sender: "auditor",
            text: "Bonjour. Je suis Me Audrey Fortier, auditrice spécialisée en efficacité des cabinets juridiques.\n\nCet audit gratuit prend environ 8 minutes. Mes questions couvrent 7 piliers de votre pratique — gestion des dossiers, échéanciers, clientèle, facturation, fidéicommis, opérations et conformité.\n\nTout est confidentiel. À la fin, vous recevrez un rapport personnalisé avec votre score de conformité.\n\nOn commence ?",
            timestamp: Date.now(),
          },
        ]);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [started]);

  // Ref to access latest responses without re-creating the callback
  const responsesRef = useRef(responses);
  responsesRef.current = responses;

  // Advance to next question (skip conditional questions whose condition is not met)
  const advanceQuestion = useCallback(
    async (nextIdx: number) => {
      let idx = nextIdx;
      // Skip questions whose condition returns false
      while (idx < QUESTIONS.length) {
        const q = QUESTIONS[idx];
        if (!q.condition || q.condition(responsesRef.current)) break;
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
        await addAuditorMessage(PHASE_TRANSITIONS[nextQ.phase]);
      }

      // Ask the question
      await addAuditorMessage(nextQ.text, nextQ);
      setCurrentQuestion(idx);
    },
    [addAuditorMessage]
  );

  // Handle starting the audit
  const handleStart = useCallback(() => {
    setStarted(true);
    addUserMessage("Oui, commençons !");
    advanceQuestion(0);
  }, [addUserMessage, advanceQuestion]);

  // Handle single option select
  const handleOptionSelect = useCallback(
    async (questionKey: string, option: QuestionOption) => {
      if (option.hasTextField && option.value === "autre") {
        setShowCustomField(true);
        return;
      }

      // Mark question as answered
      setMessages((prev) =>
        prev.map((m) => (m.questionKey === questionKey ? { ...m, answered: true } : m))
      );

      addUserMessage(option.label);

      // Save response
      const newResponses = { ...responses, [questionKey]: option.value };
      setResponses(newResponses);

      // Reaction
      const reaction = getReaction(questionKey, option.value, newResponses);
      if (reaction) {
        await addAuditorMessage(reaction);
      }

      // Next question
      const currentIdx = QUESTIONS.findIndex((q) => q.key === questionKey);
      advanceQuestion(currentIdx + 1);
    },
    [responses, addUserMessage, addAuditorMessage, advanceQuestion]
  );

  // Handle custom text submit for "Autre"
  const handleCustomSubmit = useCallback(
    async (questionKey: string) => {
      if (!customText.trim()) return;

      setShowCustomField(false);
      setMessages((prev) =>
        prev.map((m) => (m.questionKey === questionKey ? { ...m, answered: true } : m))
      );

      addUserMessage(customText.trim());

      const newResponses = { ...responses, [questionKey]: customText.trim() };
      setResponses(newResponses);
      setCustomText("");

      const reaction = getReaction(questionKey, "autre", newResponses);
      if (reaction) {
        await addAuditorMessage(reaction);
      }

      const currentIdx = QUESTIONS.findIndex((q) => q.key === questionKey);
      advanceQuestion(currentIdx + 1);
    },
    [customText, responses, addUserMessage, addAuditorMessage, advanceQuestion]
  );

  // Handle multi-select confirm
  const handleMultiConfirm = useCallback(
    async (questionKey: string, options: QuestionOption[]) => {
      if (multiSelect.length === 0) return;

      setMessages((prev) =>
        prev.map((m) => (m.questionKey === questionKey ? { ...m, answered: true } : m))
      );

      const labels = multiSelect.map(
        (v) => options.find((o) => o.value === v)?.label || v
      );
      addUserMessage(labels.join(", "));

      const newResponses = { ...responses, [questionKey]: multiSelect };
      setResponses(newResponses as Partial<AuditResponses>);
      setMultiSelect([]);

      const reaction = getReaction(questionKey, multiSelect, newResponses);
      if (reaction) {
        await addAuditorMessage(reaction);
      }

      const currentIdx = QUESTIONS.findIndex((q) => q.key === questionKey);
      advanceQuestion(currentIdx + 1);
    },
    [multiSelect, responses, addUserMessage, addAuditorMessage, advanceQuestion]
  );

  // Handle scale select
  const handleScaleSelect = useCallback(
    async (questionKey: string, value: number) => {
      setMessages((prev) =>
        prev.map((m) => (m.questionKey === questionKey ? { ...m, answered: true } : m))
      );

      const scaleQ = QUESTIONS.find((q) => q.key === questionKey);
      const label = scaleQ?.scaleLabels?.[value];
      addUserMessage(label ? `${value}/5 — ${label}` : `${value}/5`);

      const newResponses = { ...responses, [questionKey]: value };
      setResponses(newResponses as Partial<AuditResponses>);

      const reaction = getReaction(questionKey, value, newResponses);
      if (reaction) {
        await addAuditorMessage(reaction);
      }

      const currentIdx = QUESTIONS.findIndex((q) => q.key === questionKey);
      advanceQuestion(currentIdx + 1);
    },
    [responses, addUserMessage, addAuditorMessage, advanceQuestion]
  );

  // Handle open text submit
  const handleOpenSubmit = useCallback(
    async (questionKey: string) => {
      const text = openText.trim();
      if (!text) return;

      setMessages((prev) =>
        prev.map((m) => (m.questionKey === questionKey ? { ...m, answered: true } : m))
      );

      addUserMessage(text);

      const newResponses = { ...responses, [questionKey]: text };
      setResponses(newResponses as Partial<AuditResponses>);
      setOpenText("");

      await addAuditorMessage("Merci pour ces précisions, c'est très utile pour votre rapport.");

      const currentIdx = QUESTIONS.findIndex((q) => q.key === questionKey);
      advanceQuestion(currentIdx + 1);
    },
    [openText, responses, addUserMessage, addAuditorMessage, advanceQuestion]
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
      if (!contactForm.name.trim() || !contactForm.email.trim()) return;

      const questionKey = "contact";
      setMessages((prev) =>
        prev.map((m) => (m.questionKey === questionKey ? { ...m, answered: true } : m))
      );

      addUserMessage(`${contactForm.name} — ${contactForm.email}`);

      setResponses((prev) => ({
        ...prev,
        contact_name: contactForm.name,
        contact_email: contactForm.email,
        contact_phone: contactForm.phone,
        contact_firm: contactForm.firm,
      }));

      // Calculer les résultats pour les envoyer avec l'audit
      const auditResults = computeResults({
        ...responses,
        contact_name: contactForm.name,
        contact_email: contactForm.email,
        contact_phone: contactForm.phone,
        contact_firm: contactForm.firm,
      });
      const displayScore = auditResults ? Math.max(0, 100 - auditResults.pain_score) : 0;

      // Envoyer les données + résultats à l'API pour sauvegarde en base + email
      try {
        await fetch("/api/audit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "cabinet",
            source: "audit_gratuit",
            prospectNom: contactForm.name,
            prospectEmail: contactForm.email,
            prospectTelephone: contactForm.phone || null,
            prospectCabinet: contactForm.firm || null,
            scoreGlobal: displayScore,
            scores: auditResults ? JSON.stringify(
              Object.fromEntries(auditResults.sections.map(s => [s.title, s.score]))
            ) : null,
            rapport: auditResults ? JSON.stringify({
              sections: auditResults.sections,
              strengths: auditResults.strengths,
              overall_summary: auditResults.overall_summary,
              priority_recommendations: auditResults.priority_recommendations,
              estimated_monthly_loss: auditResults.estimated_monthly_loss,
              maturity_level: auditResults.maturity_level,
            }) : null,
            reponses: JSON.stringify({
              ...responses,
              contact_name: contactForm.name,
              contact_email: contactForm.email,
              contact_phone: contactForm.phone,
              contact_firm: contactForm.firm,
            }),
          }),
        });
      } catch {
        // Silently fail — ne pas bloquer l'expérience utilisateur
      }

      await addAuditorMessage(
        "Merci beaucoup pour votre temps et votre confiance ! Votre rapport d'audit personnalisé est prêt. Voyons ensemble les résultats..."
      );

      setShowResults(true);
    },
    [contactForm, addUserMessage, addAuditorMessage, responses]
  );

  // Persist to storage
  useEffect(() => {
    if (Object.keys(responses).length > 0) {
      try {
        const data: Partial<AuditData> = {
          audit_id: auditId,
          started_at: new Date().toISOString(),
          responses: responses as AuditResponses,
        };
        if (typeof window !== "undefined" && window.localStorage) {
          window.localStorage.setItem(`audit:${auditId}`, JSON.stringify(data));
        }
      } catch {
        // silently fail
      }
    }
  }, [responses, auditId]);

  // Current phase for progress bar
  const currentPhase = currentQuestion >= 0 ? QUESTIONS[Math.min(currentQuestion, QUESTIONS.length - 1)]?.phase || 1 : 0;

  const computed = showResults ? computeResults(responses) : null;

  /* ─────────────────────────────────────────────
     Results Screen
     ───────────────────────────────────────────── */

  if (showResults && computed) {
    const displayScore = Math.max(0, 100 - computed.pain_score);
    const maturityColors: Record<string, string> = {
      "Débutant": "text-red-500",
      "Intermédiaire": "text-[var(--safe-text-secondary)]",
      "Avancé": "text-[var(--safe-text-title)]",
    };
    const statusColors: Record<string, string> = {
      excellent: "text-green-600 bg-green-50 border-green-200",
      bon: "text-[var(--safe-text-secondary)] bg-[var(--safe-neutral-100)] border-[var(--safe-sage)]/30",
      attention: "text-orange-600 bg-orange-50 border-orange-200",
      critique: "text-red-600 bg-red-50 border-red-200",
    };
    const statusLabels: Record<string, string> = {
      excellent: "Excellent",
      bon: "Bon",
      attention: "À améliorer",
      critique: "Critique",
    };
    const statusIcons: Record<string, React.ReactNode> = {
      excellent: <CheckCircle className="w-4 h-4" />,
      bon: <CheckCircle2 className="w-4 h-4" />,
      attention: <AlertTriangle className="w-4 h-4" />,
      critique: <AlertCircle className="w-4 h-4" />,
    };

    const handleDownloadPDF = async () => {
      const { pdf } = await import("@react-pdf/renderer");
      const { AuditReportPDF } = await import("./AuditReportPDF");
      const blob = await pdf(
        <AuditReportPDF
          contactName={responses.contact_name || ""}
          contactFirm={responses.contact_firm || ""}
          contactEmail={responses.contact_email || ""}
          practiceType={PRACTICE_LABELS[responses.practice_type || ""] || responses.practice_type || ""}
          date={new Date().toLocaleDateString("fr-CA", { year: "numeric", month: "long", day: "numeric" })}
          computed={computed}
        />
      ).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Rapport-Audit-SAFE-${(responses.contact_name || "Cabinet").replace(/\s+/g, "-")}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    };

    return (
      <div className="flex flex-col h-full bg-[var(--safe-white)] text-[var(--safe-text-title)]">
        {/* Header */}
        <header className="shrink-0 z-10 border-b border-[var(--safe-sage)]/30 bg-[var(--safe-white)]/95 backdrop-blur-md px-4 py-3">
          <div className="max-w-2xl mx-auto flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[var(--safe-text-secondary)] to-[var(--safe-text-title)] flex items-center justify-center text-xs font-bold text-[var(--safe-white)] shrink-0">
              AF
            </div>
            <div className="flex-1">
              <h1 className="text-lg font-semibold font-sans tracking-tight text-[var(--safe-text-title)]">Rapport d&apos;audit d&apos;efficacité</h1>
              <p className="text-xs text-[var(--safe-text-secondary)] font-sans">Me Audrey Fortier — {new Date().toLocaleDateString("fr-CA")}</p>
            </div>
            <button
              onClick={handleDownloadPDF}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-safe-sm bg-[var(--safe-text-title)] text-[var(--safe-white)] text-xs font-sans font-medium hover:bg-[var(--safe-text-secondary)] transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Télécharger PDF
            </button>
          </div>
        </header>

        <main className="flex-1 min-h-0 overflow-y-auto px-4 py-8">
          <div className="max-w-2xl mx-auto space-y-6">
            {/* Score + Summary card */}
            <div className="audit-result-card rounded-safe-md border border-[var(--safe-sage)]/30 bg-white/60 p-6 audit-slide-up">
              <div className="flex items-start gap-6">
                <div className="text-center">
                  <ScoreGauge score={computed.pain_score} />
                  <span className={`text-sm font-semibold font-sans mt-2 block ${maturityColors[computed.maturity_level] || "text-[var(--safe-text-title)]"}`}>
                    {computed.maturity_level}
                  </span>
                </div>
                <div className="flex-1">
                  <h2 className="text-lg font-bold font-sans mb-2 text-[var(--safe-text-title)] tracking-tight">Sommaire de votre cabinet</h2>
                  <p className="text-sm text-[var(--safe-text-secondary)] font-sans leading-relaxed">{computed.overall_summary}</p>
                  {computed.strengths.length > 0 && (
                    <div className="mt-3 p-3 rounded-safe bg-green-50 border border-green-200">
                      <p className="text-xs font-semibold text-green-700 font-sans mb-1">Vos points forts</p>
                      {computed.strengths.map((str, i) => (
                        <p key={i} className="text-xs text-green-700 font-sans">✓ {str}</p>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Section scores overview */}
            <div className="audit-result-card rounded-safe-md border border-[var(--safe-sage)]/30 bg-white/60 p-6 audit-slide-up" style={{ animationDelay: "0.1s" }}>
              <h3 className="text-base font-bold font-sans text-[var(--safe-text-title)] mb-4 tracking-tight">Diagnostic par section</h3>
              <div className="space-y-3">
                {computed.sections.map((sec) => (
                  <div key={sec.title} className="flex items-center gap-3">
                    <span className="w-36 text-sm text-[var(--safe-text-secondary)] font-sans">{sec.title}</span>
                    <div className="flex-1 h-3 bg-[var(--safe-sage)]/20 rounded-full overflow-hidden">
                      <div
                        className="h-3 rounded-full transition-all duration-700"
                        style={{
                          width: `${sec.score}%`,
                          backgroundColor: sec.status === "excellent" ? "#16A34A" : sec.status === "bon" ? "#436850" : sec.status === "attention" ? "#EA580C" : "#DC2626",
                        }}
                      />
                    </div>
                    <span className="w-14 text-right text-sm font-bold font-sans" style={{ color: sec.status === "excellent" ? "#16A34A" : sec.status === "bon" ? "#436850" : sec.status === "attention" ? "#EA580C" : "#DC2626" }}>
                      {sec.score}/100
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Detail sections */}
            {computed.sections.map((sec, idx) => (
              <div key={sec.title} className="audit-result-card rounded-safe-md border border-[var(--safe-sage)]/30 bg-white/60 overflow-hidden audit-slide-up" style={{ animationDelay: `${0.15 + idx * 0.1}s` }}>
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <FileText className="w-5 h-5 text-[var(--safe-text-secondary)]" />
                      <h3 className="text-base font-bold font-sans text-[var(--safe-text-title)] tracking-tight">{sec.title}</h3>
                    </div>
                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold font-sans border ${statusColors[sec.status]}`}>
                      {statusIcons[sec.status]}
                      {statusLabels[sec.status]} — {sec.score}/100
                    </span>
                  </div>

                  {/* Findings */}
                  <div className="mb-4">
                    <p className="text-xs font-semibold text-[var(--safe-text-title)] font-sans mb-2 uppercase tracking-wide">Constats</p>
                    <div className="space-y-2">
                      {sec.findings.map((f, i) => (
                        <p key={i} className="text-sm text-[var(--safe-text-secondary)] font-sans leading-relaxed pl-4 border-l-2 border-[var(--safe-sage)]/40">
                          {f}
                        </p>
                      ))}
                    </div>
                  </div>

                  {/* Recommendations */}
                  {sec.recommendations.length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs font-semibold text-[var(--safe-text-title)] font-sans mb-2 uppercase tracking-wide">Recommandations</p>
                      <div className="space-y-2">
                        {sec.recommendations.map((r, i) => (
                          <div key={i} className="flex items-start gap-2 p-3 rounded-safe bg-[var(--safe-sage)]/10 border border-[var(--safe-sage)]/20">
                            <div className="w-5 h-5 rounded-full bg-[var(--safe-text-title)] flex items-center justify-center shrink-0 mt-0.5">
                              <span className="text-xs font-bold text-[var(--safe-white)]">{i + 1}</span>
                            </div>
                            <p className="text-sm text-[var(--safe-text-secondary)] font-sans">{r}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* How SAFE helps */}
                <div className="bg-[var(--safe-text-title)] px-6 py-4">
                  <p className="text-xs font-semibold text-[var(--safe-sage)] font-sans mb-1 uppercase tracking-wider">Comment SAFE peut vous aider</p>
                  <p className="text-sm text-[var(--safe-white)] font-sans leading-relaxed">{sec.safeHelp}</p>
                </div>
              </div>
            ))}

            {/* Financial impact */}
            <div className="audit-result-card rounded-safe-md border border-[var(--safe-text-title)]/15 bg-[var(--safe-text-title)] p-6 audit-slide-up" style={{ animationDelay: "0.6s" }}>
              <div className="flex items-center gap-2 mb-4">
                <DollarSign className="w-5 h-5 text-[var(--safe-white)]" />
                <h3 className="text-base font-bold font-sans text-[var(--safe-white)] tracking-tight">Impact financier estimé</h3>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="rounded-safe bg-white/10 p-4 text-center">
                  <p className="text-2xl font-bold text-[var(--safe-white)] font-sans">
                    {computed.estimated_monthly_loss.toLocaleString("fr-CA")} $
                  </p>
                  <p className="text-xs text-[var(--safe-sage)] font-sans">Perte mensuelle</p>
                </div>
                <div className="rounded-safe bg-white/10 p-4 text-center">
                  <p className="text-2xl font-bold text-red-400 font-sans">
                    {computed.estimated_annual_loss.toLocaleString("fr-CA")} $
                  </p>
                  <p className="text-xs text-[var(--safe-sage)] font-sans">Perte annuelle</p>
                </div>
              </div>
              <div className="rounded-safe bg-white/10 border border-white/10 p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-[var(--safe-sage)] font-sans">Récupération potentielle avec SAFE</p>
                  <span className="text-sm font-bold text-green-400 font-sans">~70%</span>
                </div>
                <p className="text-2xl font-bold text-green-400 font-sans">
                  +{computed.potential_recovery.toLocaleString("fr-CA")} $ <span className="text-sm font-normal text-[var(--safe-sage)]">/an</span>
                </p>
              </div>
            </div>

            {/* Summary metrics */}
            <div className="grid grid-cols-2 gap-3 audit-slide-up" style={{ animationDelay: "0.7s" }}>
              <div className="rounded-safe border border-[var(--safe-sage)]/30 bg-white/60 p-4 text-center">
                <Clock className="w-5 h-5 text-[var(--safe-text-secondary)] mx-auto mb-2" />
                <p className="text-lg font-bold font-sans text-[var(--safe-text-title)]">
                  {responses.weekly_admin_hours === "moins_2h" ? "< 2h" : responses.weekly_admin_hours === "2_5h" ? "2-5h" : responses.weekly_admin_hours === "5_10h" ? "5-10h" : "10h+"}
                </p>
                <p className="text-xs text-[var(--safe-text-secondary)] font-sans">heures admin/sem.</p>
              </div>
              <div className="rounded-safe border border-[var(--safe-sage)]/30 bg-white/60 p-4 text-center">
                <Shield className="w-5 h-5 text-[var(--safe-text-secondary)] mx-auto mb-2" />
                <p className="text-lg font-bold font-sans text-[var(--safe-text-title)]">
                  {responses.bar_inspection_confidence || "?"}/5
                </p>
                <p className="text-xs text-[var(--safe-text-secondary)] font-sans">confiance Barreau</p>
              </div>
            </div>

            {/* Plan d'action prioritaire */}
            <div className="audit-result-card rounded-safe-md border border-[var(--safe-sage)]/30 bg-white/60 p-6 audit-slide-up" style={{ animationDelay: "0.8s" }}>
              <div className="flex items-center gap-2 mb-4">
                <Target className="w-5 h-5 text-[var(--safe-text-secondary)]" />
                <h3 className="text-base font-bold font-sans text-[var(--safe-text-title)] tracking-tight">Plan d&apos;action recommandé</h3>
              </div>
              <div className="space-y-3">
                {computed.priority_recommendations.map((rec, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-safe bg-[var(--safe-sage)]/10 border border-[var(--safe-sage)]/20">
                    <div className="w-7 h-7 rounded-full bg-[var(--safe-text-title)] flex items-center justify-center shrink-0">
                      <span className="text-xs font-bold text-[var(--safe-white)]">{i + 1}</span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[var(--safe-text-title)] font-sans">{rec}</p>
                      <p className="text-xs text-[var(--safe-text-secondary)] font-sans mt-0.5">
                        {i === 0 ? "Priorité immédiate — impact rapide sur votre quotidien" : i === 1 ? "Deuxième priorité — consolide vos gains" : "Troisième priorité — optimise l'ensemble"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* CTA buttons */}
            <div className="space-y-3 audit-slide-up" style={{ animationDelay: "0.9s" }}>
              <button
                onClick={handleDownloadPDF}
                className="group flex items-center justify-center gap-2 w-full py-4 rounded-safe-md bg-[var(--safe-text-title)] text-[var(--safe-white)] font-semibold text-sm font-sans hover:bg-[var(--safe-text-secondary)] hover:shadow-lg hover:shadow-[var(--safe-text-title)]/15 transition-all duration-300"
              >
                <Download className="w-4 h-4" />
                Télécharger le rapport complet (PDF)
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
              </button>
              <a
                href="/demo"
                className="group flex items-center justify-center gap-2 w-full py-3 rounded-safe-md border border-[var(--safe-sage)] bg-white/50 text-[var(--safe-text-title)] font-medium text-sm font-sans hover:bg-[var(--safe-sage)]/20 transition-all duration-300"
              >
                <Calendar className="w-4 h-4" />
                Réserver une démo personnalisée
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
              </a>
            </div>

            {/* SAFE branding */}
            <div className="text-center py-4">
              <p className="text-xs text-[var(--safe-sage)] font-sans">
                Audit réalisé par SAFE — La plateforme de gestion pour avocats
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
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--safe-text-secondary)] to-[var(--safe-text-title)] flex items-center justify-center text-xs font-bold text-[var(--safe-white)] shrink-0 ring-2 ring-[var(--safe-text-secondary)]/20">
            AF
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-semibold font-sans tracking-tight truncate text-[var(--safe-text-title)]">Me Audrey Fortier</h1>
            <p className="text-xs text-[var(--safe-text-secondary)] font-sans">
              {isTyping ? (
                <span className="text-[var(--safe-text-secondary)] font-medium">écrit...</span>
              ) : (
                "Auditrice — Efficacité des cabinets juridiques"
              )}
            </p>
          </div>
          {/* Secure badge */}
          <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-[var(--safe-sage)]/15 border border-[var(--safe-sage)]/30">
            <Shield className="w-3 h-3 text-[var(--safe-text-secondary)]" />
            <span className="text-xs text-[var(--safe-text-secondary)] font-sans">Confidentiel</span>
          </div>
        </div>

        {/* Progress bar */}
        {started && (
          <div className="px-4 pb-2">
            <div className="max-w-2xl mx-auto">
              <div className="flex items-center gap-1.5">
                {PHASES.map((phase, i) => (
                  <div key={phase} className="flex-1 flex flex-col items-center gap-1">
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
                      {phase}
                    </span>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between mt-1.5">
                <span className="text-[10px] text-[var(--safe-sage)] font-sans">
                  Pilier {currentPhase}/{PHASES.length}
                </span>
                <span className="text-[10px] text-[var(--safe-sage)] font-sans flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  ~{Math.max(1, ESTIMATED_MINUTES - Math.round((currentPhase / PHASES.length) * ESTIMATED_MINUTES))} min restantes
                </span>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Chat area */}
      <main ref={chatContainerRef} className="flex-1 min-h-0 overflow-y-auto px-4 py-6">
        <div className="max-w-2xl mx-auto space-y-4">
          {messages.map((msg, idx) => {
            const isLastAuditor =
              msg.sender === "auditor" &&
              !messages.slice(idx + 1).some((m) => m.sender === "auditor");
            return (
            <div key={msg.id} ref={isLastAuditor ? lastAuditorRef : undefined}>
              {/* Message bubble */}
              <div
                className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"} audit-msg-appear`}
              >
                {msg.sender === "auditor" && (
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[var(--safe-text-secondary)] to-[var(--safe-text-title)] flex items-center justify-center text-xs font-bold text-[var(--safe-white)] shrink-0 mr-2 mt-1">
                    AF
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

              {/* Options (only for unanswered auditor questions) */}
              {msg.sender === "auditor" && !msg.answered && msg.questionKey && (
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
                            placeholder="Précisez..."
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
                        return (
                          <button
                            key={opt.value}
                            onClick={() => {
                              if (opt.hasTextField && opt.value === "autre") {
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

                      {multiSelect.length > 0 && (
                        <button
                          onClick={() => handleMultiConfirm(msg.questionKey!, msg.options!)}
                          className="w-full mt-2 px-4 py-3 rounded-safe bg-[var(--safe-text-title)] text-[var(--safe-white)] text-sm font-semibold font-sans hover:bg-[var(--safe-text-secondary)] transition-colors flex items-center justify-center gap-2"
                        >
                          Confirmer ({multiSelect.length})
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  )}

                  {/* Scale */}
                  {msg.questionType === "scale" && (
                    <div className="space-y-2">
                      {msg.scaleLabels?.[1] && (
                        <p className="text-xs text-[var(--safe-sage)] font-sans">
                          1 — {msg.scaleLabels[1]}
                        </p>
                      )}
                      <div className="flex gap-2">
                        {Array.from(
                          { length: (msg.scaleMax || 5) - (msg.scaleMin || 1) + 1 },
                          (_, i) => (msg.scaleMin || 1) + i
                        ).map((val) => (
                          <button
                            key={val}
                            onClick={() => handleScaleSelect(msg.questionKey!, val)}
                            className="group flex-1 py-3 rounded-safe border border-[var(--safe-sage)]/30 bg-white/60 hover:bg-[var(--safe-text-secondary)]/10 hover:border-[var(--safe-text-secondary)]/30 text-sm font-sans transition-all duration-200 flex flex-col items-center gap-1"
                          >
                            <Star className="w-4 h-4 text-[var(--safe-sage)] group-hover:text-[var(--safe-text-secondary)] transition-colors" />
                            <span className="text-[var(--safe-text-secondary)] group-hover:text-[var(--safe-text-title)] transition-colors">
                              {val}
                            </span>
                          </button>
                        ))}
                      </div>
                      {msg.scaleLabels?.[5] && (
                        <p className="text-xs text-[var(--safe-sage)] font-sans text-right">
                          5 — {msg.scaleLabels[5]}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Open text */}
                  {msg.questionType === "open" && (
                    <div className="space-y-2 audit-msg-appear">
                      <textarea
                        value={openText}
                        onChange={(e) => setOpenText(e.target.value)}
                        placeholder={msg.placeholder || "Écrivez votre réponse ici..."}
                        rows={3}
                        className="w-full px-4 py-3 rounded-safe bg-white/70 border border-[var(--safe-sage)]/40 text-sm text-[var(--safe-text-title)] placeholder-[var(--safe-sage)] font-sans focus:outline-none focus:border-[var(--safe-text-secondary)]/50 transition-colors resize-none"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
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
                          Envoyer
                        </button>
                        <button
                          onClick={() => handleOpenSkip(msg.questionKey!)}
                          className="px-4 py-3 rounded-safe border border-[var(--safe-sage)]/30 bg-white/60 text-xs text-[var(--safe-sage)] font-sans hover:bg-[var(--safe-sage)]/10 transition-colors"
                        >
                          Passer
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Contact form */}
                  {msg.questionType === "contact" && (
                    <form onSubmit={handleContactSubmit} className="space-y-3 audit-msg-appear">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-[var(--safe-sage)]" />
                        <input
                          type="text"
                          required
                          value={contactForm.name}
                          onChange={(e) => setContactForm((f) => ({ ...f, name: e.target.value }))}
                          placeholder="Nom complet *"
                          className="flex-1 px-4 py-3 rounded-safe bg-white/70 border border-[var(--safe-sage)]/40 text-sm text-[var(--safe-text-title)] placeholder-[var(--safe-sage)] font-sans focus:outline-none focus:border-[var(--safe-text-secondary)]/50 transition-colors"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-[var(--safe-sage)]" />
                        <input
                          type="email"
                          required
                          value={contactForm.email}
                          onChange={(e) => setContactForm((f) => ({ ...f, email: e.target.value }))}
                          placeholder="Courriel *"
                          className="flex-1 px-4 py-3 rounded-safe bg-white/70 border border-[var(--safe-sage)]/40 text-sm text-[var(--safe-text-title)] placeholder-[var(--safe-sage)] font-sans focus:outline-none focus:border-[var(--safe-text-secondary)]/50 transition-colors"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-[var(--safe-sage)]" />
                        <input
                          type="tel"
                          value={contactForm.phone}
                          onChange={(e) => setContactForm((f) => ({ ...f, phone: e.target.value }))}
                          placeholder="Téléphone (optionnel)"
                          className="flex-1 px-4 py-3 rounded-safe bg-white/70 border border-[var(--safe-sage)]/40 text-sm text-[var(--safe-text-title)] placeholder-[var(--safe-sage)] font-sans focus:outline-none focus:border-[var(--safe-text-secondary)]/50 transition-colors"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-[var(--safe-sage)]" />
                        <input
                          type="text"
                          value={contactForm.firm}
                          onChange={(e) => setContactForm((f) => ({ ...f, firm: e.target.value }))}
                          placeholder="Nom du cabinet (optionnel)"
                          className="flex-1 px-4 py-3 rounded-safe bg-white/70 border border-[var(--safe-sage)]/40 text-sm text-[var(--safe-text-title)] placeholder-[var(--safe-sage)] font-sans focus:outline-none focus:border-[var(--safe-text-secondary)]/50 transition-colors"
                        />
                      </div>
                      <button
                        type="submit"
                        className="w-full py-3 rounded-safe bg-[var(--safe-text-title)] text-[var(--safe-white)] font-semibold text-sm font-sans hover:bg-[var(--safe-text-secondary)] hover:shadow-lg hover:shadow-[var(--safe-text-title)]/15 transition-all duration-300 flex items-center justify-center gap-2"
                      >
                        <Sparkles className="w-4 h-4" />
                        Voir mon rapport d&apos;audit
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setMessages((prev) =>
                            prev.map((m) => (m.questionKey === "contact" ? { ...m, answered: true } : m))
                          );
                          addUserMessage("Je préfère passer cette étape");
                          setShowResults(true);
                        }}
                        className="w-full py-2 text-xs text-[var(--safe-sage)] font-sans hover:text-[var(--safe-text-secondary)] transition-colors"
                      >
                        Passer et voir les résultats directement
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
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[var(--safe-text-secondary)] to-[var(--safe-text-title)] flex items-center justify-center text-xs font-bold text-[var(--safe-white)] shrink-0">
                AF
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

          {/* Start button */}
          {!started && messages.length > 0 && !isTyping && (
            <div className="flex justify-center mt-4 audit-options-appear">
              <button
                onClick={handleStart}
                className="group px-8 py-3 rounded-safe-md bg-[var(--safe-text-title)] text-[var(--safe-white)] font-semibold text-sm font-sans hover:bg-[var(--safe-text-secondary)] hover:shadow-lg hover:shadow-[var(--safe-text-title)]/15 transition-all duration-300 flex items-center gap-2"
              >
                <Zap className="w-4 h-4" />
                Oui, commençons !
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
              </button>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>
      </main>
    </div>
  );
}
