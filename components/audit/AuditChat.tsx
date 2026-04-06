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
  practice_type: string;
  practice_areas: string[];
  years_active: string;
  active_cases: string;
  case_tracking_method: string;
  case_tracking_satisfaction: number;
  case_tracking_details: string;
  accounting_tool: string;
  trust_account_management: string;
  trust_account_details: string;
  monthly_billing_time: string;
  time_tracking_method: string;
  biggest_challenge: string;
  biggest_challenge_details: string;
  weekly_admin_hours: string;
  bar_inspection_confidence: number;
  improvement_priorities: string;
  tech_comfort: string;
  monthly_budget: string;
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
   Constants
   ───────────────────────────────────────────── */

const PHASES = [
  "Identification",
  "Gestion des dossiers",
  "Comptabilité & Finances",
  "Défis & Priorités",
  "Technologie",
];

const PHASE_TRANSITIONS: Record<number, string> = {
  2: "Très bien ! J'ai un bon portrait de votre pratique. Parlons maintenant de la gestion de vos dossiers au quotidien.",
  3: "Merci pour ces informations précieuses. Abordons maintenant l'aspect financier et comptable de votre cabinet.",
  4: "Excellent ! Dernière section avant votre rapport : parlons de vos défis et priorités.",
  5: "Merci pour votre transparence. Quelques dernières questions pour compléter votre portrait.",
};

const QUESTIONS: Question[] = [
  {
    key: "practice_type",
    phase: 1,
    text: "Pour commencer, comment décririez-vous votre pratique ?",
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
    text: "Comment suivez-vous actuellement vos dossiers et vos échéances ?",
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
    key: "case_tracking_satisfaction",
    phase: 2,
    text: "Sur une échelle de 1 à 5, à quel point êtes-vous satisfait(e) de votre méthode actuelle de suivi des dossiers ?",
    type: "scale",
    scaleMin: 1,
    scaleMax: 5,
  },
  {
    key: "case_tracking_details",
    phase: 2,
    text: "Pouvez-vous me décrire brièvement ce qui fonctionne bien et ce qui vous frustre le plus dans votre gestion de dossiers actuelle ?",
    type: "open",
    placeholder: "Ex: Je perds souvent du temps à chercher des documents, les échéances me stressent...",
  },
  {
    key: "accounting_tool",
    phase: 3,
    text: "Quel outil utilisez-vous pour votre comptabilité ?",
    type: "single",
    options: [
      { label: "Je fais tout moi-même (Excel, papier)", value: "manuel" },
      { label: "QuickBooks / Sage", value: "quickbooks" },
      { label: "Mon comptable s'occupe de tout", value: "comptable" },
      { label: "Un logiciel juridique avec module comptable", value: "logiciel_juridique" },
      { label: "Honnêtement, c'est un peu le chaos", value: "chaos" },
    ],
  },
  {
    key: "trust_account_management",
    phase: 3,
    text: "Comment gérez-vous votre compte en fidéicommis ?",
    type: "single",
    options: [
      { label: "Manuellement (registre papier ou Excel)", value: "manuel" },
      { label: "Avec un logiciel dédié", value: "logiciel" },
      { label: "Mon comptable/teneur de livres s'en occupe", value: "comptable" },
      { label: "C'est un de mes plus gros casse-têtes", value: "casse_tete" },
      { label: "Je ne suis pas certain(e) d'être 100% conforme", value: "incertain" },
    ],
  },
  {
    key: "trust_account_details",
    phase: 3,
    text: "Quels sont vos principaux défis ou inquiétudes par rapport à la gestion de votre fidéicommis et à la conformité comptable en général ?",
    type: "open",
    placeholder: "Ex: La conciliation est laborieuse, j'ai peur de faire une erreur lors d'une inspection...",
  },
  {
    key: "monthly_billing_time",
    phase: 3,
    text: "En moyenne, combien de temps consacrez-vous à la facturation chaque mois ?",
    type: "single",
    options: [
      { label: "Moins de 2 heures", value: "moins_2h" },
      { label: "2 à 5 heures", value: "2_5h" },
      { label: "5 à 10 heures", value: "5_10h" },
      { label: "Plus de 10 heures — c'est un cauchemar", value: "plus_10h" },
    ],
  },
  {
    key: "time_tracking_method",
    phase: 3,
    text: "Comment enregistrez-vous vos heures facturables ?",
    type: "single",
    options: [
      { label: "En temps réel avec un outil dédié", value: "temps_reel" },
      { label: "À la fin de la journée, de mémoire", value: "fin_journee" },
      { label: "À la fin de la semaine ou du mois (estimations)", value: "fin_semaine" },
      { label: "Je ne les enregistre pas systématiquement", value: "pas_systematique" },
    ],
  },
  {
    key: "biggest_challenge",
    phase: 4,
    text: "Si vous pouviez régler UN SEUL problème dans la gestion de votre cabinet demain, lequel choisiriez-vous ?",
    type: "single",
    options: [
      { label: "Perdre moins de temps en administratif", value: "temps_admin" },
      { label: "Mieux suivre mes revenus et dépenses", value: "revenus" },
      { label: "Être conforme au Barreau sans stress", value: "conformite" },
      { label: "Facturer plus rapidement et être payé(e) plus vite", value: "facturation" },
      { label: "Avoir une vue claire sur la santé financière de mon cabinet", value: "sante_financiere" },
      { label: "Autre", value: "autre", hasTextField: true },
    ],
  },
  {
    key: "biggest_challenge_details",
    phase: 4,
    text: "Pouvez-vous m'en dire plus ? Comment ce problème affecte-t-il concrètement votre quotidien et celui de votre équipe ?",
    type: "open",
    placeholder: "Décrivez l'impact sur votre pratique au quotidien...",
  },
  {
    key: "weekly_admin_hours",
    phase: 4,
    text: "Estimez le nombre d'heures par semaine que vous perdez en tâches administratives (facturation, classement, recherche de documents, etc.)",
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
    phase: 4,
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
    key: "improvement_priorities",
    phase: 4,
    text: "Si un outil pouvait transformer UN aspect de la gestion de votre cabinet dès demain, que souhaiteriez-vous qu'il fasse exactement ?",
    type: "open",
    placeholder: "Ex: Générer mes factures automatiquement, produire mes rapports de fidéicommis en un clic...",
  },
  {
    key: "tech_comfort",
    phase: 5,
    text: "Comment décririez-vous votre relation avec la technologie ?",
    type: "single",
    options: [
      { label: "Je suis très à l'aise, j'adore les nouveaux outils", value: "tres_alaise" },
      { label: "Je suis fonctionnel(le), j'utilise ce qu'il faut", value: "fonctionnel" },
      { label: "Je préfère les méthodes traditionnelles", value: "traditionnel" },
      { label: "La technologie me stresse un peu", value: "stresse" },
    ],
  },
  {
    key: "monthly_budget",
    phase: 5,
    text: "Quel budget mensuel seriez-vous prêt(e) à investir pour un outil qui vous ferait gagner plusieurs heures par semaine ?",
    type: "single",
    options: [
      { label: "Moins de 100$/mois", value: "moins_100" },
      { label: "100$ à 250$/mois", value: "100_250" },
      { label: "250$ à 500$/mois", value: "250_500" },
      { label: "Plus de 500$/mois si la valeur est démontrée", value: "plus_500" },
    ],
  },
  {
    key: "contact",
    phase: 5,
    text: "Excellent ! J'ai maintenant un portrait assez complet de votre cabinet. Pour vous envoyer votre rapport d'audit personnalisé, pourriez-vous me laisser vos coordonnées ?",
    type: "contact",
  },
];

/* ─────────────────────────────────────────────
   Adaptive reactions
   ───────────────────────────────────────────── */

function getReaction(key: string, value: string | number | string[], allResponses: Partial<AuditResponses>): string | null {
  switch (key) {
    case "practice_type":
      if (value === "solo") return "La pratique solo demande une polyvalence remarquable. Vous portez plusieurs chapeaux, et c'est justement ce qui rend une bonne organisation si cruciale.";
      if (value === "petit") return "Un cabinet de cette taille doit jongler entre la croissance et l'efficacité. Voyons comment vous vous en tirez !";
      if (value === "moyen") return "À cette taille, les enjeux de coordination et de conformité deviennent rapidement importants. Très pertinent pour notre audit.";
      return "Intéressant ! Chaque structure a ses propres défis de gestion.";

    case "practice_areas":
      if (Array.isArray(value) && value.length >= 3) return "Vous avez une pratique diversifiée ! Ça ajoute de la complexité à la gestion, mais aussi de la résilience.";
      if (Array.isArray(value) && value.includes("familial")) return "Le droit familial est un domaine où la gestion des délais et la facturation peuvent être particulièrement complexes.";
      return "Merci ! Ça m'aide à mieux comprendre votre réalité quotidienne.";

    case "years_active":
      if (value === "moins_1") return "Vous en êtes aux fondations — c'est le moment idéal pour mettre en place les bonnes pratiques dès le départ !";
      if (value === "plus_10") return "Plus de 10 ans d'expérience, c'est une belle maturité. Voyons si vos outils ont évolué avec votre pratique.";
      return "Parfait. Passons maintenant à la gestion concrète de vos dossiers.";

    case "active_cases":
      if (value === "plus_100") return "Plus de 100 dossiers actifs, c'est un volume important ! La moindre inefficacité se multiplie rapidement à cette échelle.";
      if (value === "50_100") return "C'est un volume significatif. Un bon système de suivi fait vraiment la différence à ce stade.";
      return null;

    case "case_tracking_method":
      if (value === "papier") return "Vous n'êtes pas seul(e) — beaucoup de cabinets fonctionnent encore ainsi. Mais saviez-vous que le risque d'échéance manquée est 3 fois plus élevé sans outil numérique ?";
      if (value === "aucun") return "Je comprends, et c'est plus courant qu'on ne le pense. La bonne nouvelle : il existe des solutions simples qui peuvent transformer votre quotidien.";
      if (value === "logiciel") return "Excellent ! Vous avez déjà une longueur d'avance sur beaucoup de vos collègues.";
      if (value === "melange") return "Le fameux \"système hybride\" ! C'est créatif, mais ça peut créer des angles morts.";
      return null;

    case "case_tracking_satisfaction":
      if (typeof value === "number" && value <= 2) return "Un score de " + value + "/5... Vous méritez mieux. Voyons ce qu'on peut améliorer.";
      if (typeof value === "number" && value >= 4) return "Bonne nouvelle ! Vous semblez avoir trouvé quelque chose qui fonctionne pour vous.";
      return null;

    case "accounting_tool":
      if (value === "chaos") return "Merci pour votre honnêteté ! Vous seriez surpris(e) de savoir combien d'avocats partagent exactement ce sentiment. C'est souvent le point de départ d'un vrai changement positif.";
      if (value === "manuel") return "Faire sa comptabilité soi-même, c'est courageux ! Mais ça peut vite devenir chronophage, surtout avec les exigences du Barreau.";
      if (value === "quickbooks") return "QuickBooks est un bon outil généraliste, mais il n'est pas conçu pour les particularités de la comptabilité juridique (fidéicommis, B-1 r.5...).";
      return null;

    case "trust_account_management":
      if (value === "casse_tete") return "Je comprends tout à fait. Le fidéicommis est l'un des aspects les plus stressants de la gestion d'un cabinet. Rassurez-vous, des solutions existent pour simplifier tout ça.";
      if (value === "incertain") return "C'est une préoccupation très légitime et vous avez raison de l'identifier. La conformité en fidéicommis est essentielle, et il vaut mieux s'en assurer maintenant plutôt qu'au moment d'une inspection.";
      if (value === "logiciel") return "Avoir un logiciel dédié pour le fidéicommis, c'est déjà un excellent réflexe de conformité !";
      return null;

    case "monthly_billing_time":
      if (value === "plus_10h") return "Plus de 10 heures par mois en facturation... C'est presque deux jours de travail ! Du temps précieux qui pourrait être consacré à vos clients.";
      if (value === "5_10h") return "Entre 5 et 10 heures, c'est une journée entière par mois dédiée à la facturation. Il y a certainement moyen d'optimiser ça.";
      return null;

    case "time_tracking_method":
      if (value === "pas_systematique") return "Saviez-vous que les avocats qui n'enregistrent pas systématiquement leurs heures perdent en moyenne 20 à 30% de revenus facturables ? C'est un impact énorme.";
      if (value === "fin_semaine") return "Les estimations en fin de semaine entraînent typiquement une perte de 10 à 15% des heures facturables. La mémoire est notre pire ennemi pour la facturation !";
      if (value === "temps_reel") return "Bravo ! L'enregistrement en temps réel est la méthode la plus fiable pour maximiser vos revenus.";
      return null;

    case "biggest_challenge":
      return "C'est noté. C'est un enjeu que nous voyons très fréquemment, et il y a des pistes concrètes pour y répondre.";

    case "weekly_admin_hours": {
      const hours = value === "moins_2h" ? 1.5 : value === "2_5h" ? 3.5 : value === "5_10h" ? 7.5 : 12;
      const monthlyLoss = Math.round(hours * 250 * 4);
      if (hours >= 5) return `À un taux horaire moyen de 250$/h, cela représente environ ${monthlyLoss.toLocaleString("fr-CA")} $ par mois en revenus potentiels perdus. C'est considérable.`;
      if (hours >= 2) return `À un taux horaire moyen de 250$/h, cela représente environ ${monthlyLoss.toLocaleString("fr-CA")} $ par mois. Chaque heure récupérée compte !`;
      return "C'est raisonnable ! Vous gérez bien votre temps administratif.";
    }

    case "bar_inspection_confidence":
      if (typeof value === "number" && value <= 2) return "Ce stress est partagé par beaucoup d'avocats. La conformité ne devrait pas être une source d'anxiété — elle devrait être automatique.";
      if (typeof value === "number" && value >= 4) return "Belle confiance ! C'est rassurant de se sentir prêt(e). Voyons si on peut quand même identifier des pistes d'amélioration.";
      return null;

    case "tech_comfort":
      if (value === "stresse") return "Rassurez-vous ! Les meilleurs outils sont ceux qu'on oublie qu'on utilise. SAFE a été conçu pour être aussi simple qu'intuitif — pas besoin d'être un expert en technologie.";
      if (value === "tres_alaise") return "Super ! Vous apprécierez la modernité et la flexibilité de ce qui se fait aujourd'hui.";
      return null;

    case "monthly_budget":
      return "Merci pour cette indication. C'est important pour vous proposer une solution adaptée à votre réalité.";

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

const ACCOUNTING_LABELS: Record<string, string> = {
  manuel: "Manuel (Excel, papier)",
  quickbooks: "QuickBooks / Sage",
  comptable: "Comptable externe",
  logiciel_juridique: "Logiciel juridique avec module comptable",
  chaos: "Pas de système clair",
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
};

function computeResults(responses: Partial<AuditResponses>): AuditComputed {
  // ── Section 1: Gestion des dossiers ──
  const trackingScores: Record<string, number> = { logiciel: 90, excel: 55, melange: 40, papier: 20, aucun: 10 };
  const trackingScore = trackingScores[responses.case_tracking_method || ""] || 50;
  const satisfactionScore = ((responses.case_tracking_satisfaction || 3) / 5) * 100;
  const dossierScore = Math.round((trackingScore * 0.6 + satisfactionScore * 0.4));

  const dossierFindings: string[] = [];
  const dossierRecs: string[] = [];
  const method = responses.case_tracking_method || "";
  if (["papier", "aucun"].includes(method)) {
    dossierFindings.push(`Votre méthode actuelle (${CASE_TRACKING_LABELS[method] || method}) présente un risque élevé d'échéances manquées et de perte d'information.`);
    dossierRecs.push("Migrer vers un système de suivi numérique centralisé pour éliminer les risques de perte de dossiers et d'échéances manquées.");
  } else if (method === "melange") {
    dossierFindings.push("Votre système hybride crée des angles morts : l'information est dispersée entre plusieurs supports.");
    dossierRecs.push("Centraliser l'ensemble de vos dossiers dans une plateforme unique pour éliminer la duplication et les oublis.");
  } else if (method === "excel") {
    dossierFindings.push("Excel permet un suivi basique mais ne gère pas les alertes automatiques ni la collaboration en temps réel.");
    dossierRecs.push("Évoluer vers un outil spécialisé qui offre alertes d'échéances, historique complet et collaboration.");
  } else {
    dossierFindings.push("Vous utilisez déjà un logiciel spécialisé pour vos dossiers — c'est une excellente pratique.");
  }
  if ((responses.case_tracking_satisfaction || 3) <= 3) {
    dossierFindings.push(`Votre satisfaction actuelle (${responses.case_tracking_satisfaction}/5) indique des frustrations concrètes dans votre processus.`);
  }
  if (responses.case_tracking_details) {
    dossierFindings.push(`Vos commentaires : « ${responses.case_tracking_details} »`);
  }

  // ── Section 2: Comptabilité & Facturation ──
  const acctScores: Record<string, number> = { logiciel_juridique: 90, quickbooks: 60, comptable: 55, manuel: 25, chaos: 10 };
  const acctScore = acctScores[responses.accounting_tool || ""] || 50;
  const billingScores: Record<string, number> = { "moins_2h": 90, "2_5h": 70, "5_10h": 40, "plus_10h": 15 };
  const billingScore = billingScores[responses.monthly_billing_time || ""] || 50;
  const timeScores: Record<string, number> = { temps_reel: 95, fin_journee: 60, fin_semaine: 35, pas_systematique: 10 };
  const timeScore = timeScores[responses.time_tracking_method || ""] || 50;
  const comptaScore = Math.round((acctScore * 0.4 + billingScore * 0.3 + timeScore * 0.3));

  const comptaFindings: string[] = [];
  const comptaRecs: string[] = [];
  const acctTool = responses.accounting_tool || "";
  if (["chaos", "manuel"].includes(acctTool)) {
    comptaFindings.push(`Votre approche comptable (${ACCOUNTING_LABELS[acctTool]}) est vulnérable aux erreurs et non-conforme aux exigences du Barreau.`);
    comptaRecs.push("Adopter une solution comptable conçue pour la pratique juridique, intégrant les exigences réglementaires du Barreau.");
  } else if (acctTool === "quickbooks") {
    comptaFindings.push("QuickBooks est un bon outil généraliste, mais il n'est pas conçu pour les particularités juridiques (fidéicommis, B-1 r.5, séparation des fonds).");
    comptaRecs.push("Envisager une solution comptable spécialisée en droit pour assurer une conformité native et simplifier vos processus.");
  }
  const billingTime = responses.monthly_billing_time || "";
  if (["plus_10h", "5_10h"].includes(billingTime)) {
    const hours = billingTime === "plus_10h" ? "10+" : "5-10";
    comptaFindings.push(`Vous consacrez ${hours} heures par mois à la facturation — c'est un investissement de temps considérable qui pourrait être réduit significativement.`);
    comptaRecs.push("Automatiser la facturation : génération automatique à partir des feuilles de temps, envoi électronique et suivi des paiements.");
  }
  const timeMethod = responses.time_tracking_method || "";
  if (timeMethod === "pas_systematique") {
    comptaFindings.push("L'absence d'enregistrement systématique des heures entraîne en moyenne une perte de 20 à 30% des revenus facturables.");
    comptaRecs.push("Implanter l'enregistrement des heures en temps réel avec chronomètre intégré pour maximiser vos revenus.");
  } else if (timeMethod === "fin_semaine") {
    comptaFindings.push("Les estimations en fin de semaine causent typiquement une perte de 10 à 15% des heures facturables.");
    comptaRecs.push("Passer à un enregistrement quotidien ou en temps réel pour capturer plus précisément vos heures facturables.");
  }

  // ── Section 3: Fidéicommis & Conformité ──
  const trustScores: Record<string, number> = { logiciel: 90, comptable: 60, manuel: 35, incertain: 20, casse_tete: 10 };
  const trustScore = trustScores[responses.trust_account_management || ""] || 50;
  const barScore = ((responses.bar_inspection_confidence || 3) / 5) * 100;
  const conformiteScore = Math.round((trustScore * 0.6 + barScore * 0.4));

  const conformiteFindings: string[] = [];
  const conformiteRecs: string[] = [];
  const trustMethod = responses.trust_account_management || "";
  if (["casse_tete", "incertain"].includes(trustMethod)) {
    conformiteFindings.push(`Votre gestion du fidéicommis (${TRUST_LABELS[trustMethod]}) représente un risque de non-conformité majeur en cas d'inspection.`);
    conformiteRecs.push("Mettre en place un outil de gestion du fidéicommis avec conciliation automatique, traçabilité complète et rapports de conformité.");
  } else if (trustMethod === "manuel") {
    conformiteFindings.push("La gestion manuelle du fidéicommis est chronophage et expose à des erreurs de conciliation.");
    conformiteRecs.push("Automatiser la gestion du fidéicommis : conciliation en temps réel, alertes sur les anomalies et rapports prêts pour inspection.");
  }
  if ((responses.bar_inspection_confidence || 3) <= 2) {
    conformiteFindings.push(`Votre niveau de confiance face à une inspection (${responses.bar_inspection_confidence}/5) est préoccupant et source de stress inutile.`);
    conformiteRecs.push("Préparer un plan de conformité complet et mettre en place des contrôles automatisés pour être prêt en tout temps.");
  } else if ((responses.bar_inspection_confidence || 3) >= 4) {
    conformiteFindings.push("Votre confiance face aux inspections du Barreau est rassurante.");
  }
  if (responses.trust_account_details) {
    conformiteFindings.push(`Vos commentaires : « ${responses.trust_account_details} »`);
  }

  // ── Section 4: Efficacité opérationnelle ──
  const adminScores: Record<string, number> = { "moins_2h": 90, "2_5h": 65, "5_10h": 35, "plus_10h": 10 };
  const adminScore = adminScores[responses.weekly_admin_hours || ""] || 50;
  const effScore = Math.round(adminScore);

  const effFindings: string[] = [];
  const effRecs: string[] = [];
  const adminHours = responses.weekly_admin_hours || "";
  const adminHoursMap: Record<string, number> = { "moins_2h": 1.5, "2_5h": 3.5, "5_10h": 7.5, "plus_10h": 12 };
  const weeklyHours = adminHoursMap[adminHours] || 3.5;

  if (weeklyHours >= 7.5) {
    effFindings.push(`Vous perdez environ ${weeklyHours} heures par semaine en tâches administratives — soit ${Math.round(weeklyHours * 4)} heures par mois qui pourraient être facturées.`);
    effRecs.push("Automatiser les tâches administratives récurrentes : classement de documents, relances de paiement, production de rapports.");
  } else if (weeklyHours >= 3.5) {
    effFindings.push(`Environ ${weeklyHours} heures par semaine sont consacrées à l'administratif — un volume qui peut être réduit de 50 à 70%.`);
    effRecs.push("Optimiser les flux de travail administratifs avec des automatisations ciblées.");
  } else {
    effFindings.push("Votre temps administratif est bien maîtrisé — vous êtes plus efficace que la moyenne.");
  }
  if (responses.biggest_challenge_details) {
    effFindings.push(`Votre principal défi : « ${responses.biggest_challenge_details} »`);
  }
  if (responses.improvement_priorities) {
    effFindings.push(`Ce que vous souhaitez en priorité : « ${responses.improvement_priorities} »`);
  }

  // ── Overall pain score ──
  const painScore = Math.min(100, Math.max(0, Math.round(100 - (dossierScore * 0.25 + comptaScore * 0.30 + conformiteScore * 0.25 + effScore * 0.20))));

  let maturity = "Intermédiaire";
  if (painScore >= 65) maturity = "Débutant";
  else if (painScore <= 30) maturity = "Avancé";

  // ── Financial impact ──
  const estimatedMonthlyLoss = Math.round(weeklyHours * 250 * 4);
  const estimatedAnnualLoss = estimatedMonthlyLoss * 12;
  const potentialRecovery = Math.round(estimatedAnnualLoss * 0.7);

  // ── Strengths ──
  const strengths: string[] = [];
  if (method === "logiciel") strengths.push("Utilisation d'un logiciel spécialisé pour le suivi des dossiers");
  if (acctTool === "logiciel_juridique") strengths.push("Solution comptable adaptée à la pratique juridique");
  if (trustMethod === "logiciel") strengths.push("Gestion automatisée du compte en fidéicommis");
  if (timeMethod === "temps_reel") strengths.push("Enregistrement des heures en temps réel");
  if ((responses.bar_inspection_confidence || 0) >= 4) strengths.push("Bonne confiance face aux inspections du Barreau");
  if (weeklyHours <= 2) strengths.push("Temps administratif bien maîtrisé");
  if (strengths.length === 0) strengths.push("Vous avez pris l'initiative de faire cet audit — c'est déjà un premier pas important vers l'amélioration.");

  // ── Priority recommendations (top 3 across all sections) ──
  const allRecs = [...dossierRecs, ...comptaRecs, ...conformiteRecs, ...effRecs];
  if (allRecs.length === 0) allRecs.push("Optimiser vos processus existants avec des outils intégrés");

  // ── Section objects ──
  const sections: SectionDiagnostic[] = [
    {
      title: "Gestion des dossiers",
      score: dossierScore,
      status: getStatus(dossierScore),
      findings: dossierFindings,
      recommendations: dossierRecs,
      safeHelp: "SAFE centralise tous vos dossiers, échéances et documents dans une interface unique avec alertes automatiques, recherche instantanée et historique complet.",
    },
    {
      title: "Comptabilité & Facturation",
      score: comptaScore,
      status: getStatus(comptaScore),
      findings: comptaFindings,
      recommendations: comptaRecs,
      safeHelp: "SAFE intègre la comptabilité juridique native : feuilles de temps avec chronomètre, facturation automatisée, suivi des paiements et rapports financiers en un clic.",
    },
    {
      title: "Fidéicommis & Conformité",
      score: conformiteScore,
      status: getStatus(conformiteScore),
      findings: conformiteFindings,
      recommendations: conformiteRecs,
      safeHelp: "SAFE gère votre fidéicommis en conformité totale avec le Barreau : conciliation automatique, rapports d'inspection pré-générés et traçabilité complète de chaque transaction.",
    },
    {
      title: "Efficacité opérationnelle",
      score: effScore,
      status: getStatus(effScore),
      findings: effFindings,
      recommendations: effRecs,
      safeHelp: "SAFE automatise les tâches répétitives : classement intelligent, relances automatiques, modèles de documents et tableaux de bord en temps réel pour piloter votre cabinet.",
    },
  ];

  // ── Overall summary ──
  const weakSections = sections.filter((s) => s.status === "critique" || s.status === "attention");
  const strongSections = sections.filter((s) => s.status === "excellent" || s.status === "bon");
  let summary = "";
  if (weakSections.length === 0) {
    summary = "Votre cabinet présente un bon niveau de maturité organisationnelle. Quelques optimisations ciblées pourraient maximiser votre efficacité et votre rentabilité.";
  } else if (weakSections.length <= 2) {
    summary = `Votre cabinet possède des bases solides${strongSections.length > 0 ? ` (notamment en ${strongSections.map((s) => s.title.toLowerCase()).join(" et ")})` : ""}, mais ${weakSections.length === 1 ? "un secteur nécessite" : "certains secteurs nécessitent"} une attention particulière : ${weakSections.map((s) => s.title.toLowerCase()).join(" et ")}. Des améliorations ciblées dans ${weakSections.length === 1 ? "ce domaine" : "ces domaines"} pourraient avoir un impact significatif.`;
  } else {
    summary = "Votre cabinet fait face à des défis importants sur plusieurs fronts. La bonne nouvelle : les solutions existent et l'impact d'une transformation structurée sera d'autant plus significatif. Un accompagnement adapté peut vous aider à reprendre le contrôle rapidement.";
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
            text: "Bonjour ! Je suis Me Audrey Fortier, auditrice spécialisée en efficacité des cabinets juridiques.\n\nMerci de prendre quelques minutes pour cet audit gratuit. Mes questions vont me permettre de dresser un portrait de votre cabinet et d'identifier des pistes d'amélioration concrètes.\n\nTout est confidentiel. On commence ?",
            timestamp: Date.now(),
          },
        ]);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [started]);

  // Advance to next question
  const advanceQuestion = useCallback(
    async (nextIdx: number) => {
      if (nextIdx >= QUESTIONS.length) {
        // Audit complete
        setShowResults(true);
        return;
      }

      const nextQ = QUESTIONS[nextIdx];
      const prevQ = nextIdx > 0 ? QUESTIONS[nextIdx - 1] : null;

      // Phase transition message
      if (prevQ && nextQ.phase !== prevQ.phase && PHASE_TRANSITIONS[nextQ.phase]) {
        await addAuditorMessage(PHASE_TRANSITIONS[nextQ.phase]);
      }

      // Ask the question
      await addAuditorMessage(nextQ.text, nextQ);
      setCurrentQuestion(nextIdx);
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

      await addAuditorMessage(
        "Merci beaucoup pour votre temps et votre confiance ! Votre rapport d'audit personnalisé est prêt. Voyons ensemble les résultats..."
      );

      setShowResults(true);
    },
    [contactForm, addUserMessage, addAuditorMessage]
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
                      className={`h-1 w-full rounded-full transition-all duration-500 ${
                        i + 1 < currentPhase
                          ? "bg-[var(--safe-text-title)]"
                          : i + 1 === currentPhase
                          ? "bg-[var(--safe-text-secondary)]"
                          : "bg-[var(--safe-sage)]/30"
                      }`}
                    />
                    <span
                      className={`text-xs font-sans hidden sm:block transition-colors duration-300 ${
                        i + 1 <= currentPhase ? "text-[var(--safe-text-secondary)]" : "text-[var(--safe-sage)]"
                      }`}
                    >
                      {phase}
                    </span>
                  </div>
                ))}
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
