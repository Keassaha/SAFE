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
  type: "single" | "multi" | "scale" | "contact";
  options?: QuestionOption[];
  scaleMin?: number;
  scaleMax?: number;
  scaleLabels?: Record<number, string>;
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
  answered?: boolean;
}

interface AuditResponses {
  practice_type: string;
  practice_areas: string[];
  years_active: string;
  active_cases: string;
  case_tracking_method: string;
  case_tracking_satisfaction: number;
  accounting_tool: string;
  trust_account_management: string;
  monthly_billing_time: string;
  time_tracking_method: string;
  biggest_challenge: string;
  weekly_admin_hours: string;
  bar_inspection_confidence: number;
  tech_comfort: string;
  monthly_budget: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  contact_firm: string;
}

interface AuditData {
  audit_id: string;
  started_at: string;
  completed_at: string | null;
  responses: AuditResponses;
  computed: {
    pain_score: number;
    maturity_level: string;
    estimated_monthly_loss: number;
    priority_recommendations: string[];
  };
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

function computeResults(responses: Partial<AuditResponses>): AuditData["computed"] {
  let painScore = 0;

  // Case tracking method
  const trackingPain: Record<string, number> = { papier: 25, excel: 15, melange: 18, aucun: 30, logiciel: 5 };
  painScore += trackingPain[responses.case_tracking_method || ""] || 10;

  // Case tracking satisfaction (inverted: 1=high pain, 5=low pain)
  painScore += Math.max(0, (6 - (responses.case_tracking_satisfaction || 3)) * 5);

  // Accounting tool
  const acctPain: Record<string, number> = { chaos: 20, manuel: 15, comptable: 8, quickbooks: 10, logiciel_juridique: 3 };
  painScore += acctPain[responses.accounting_tool || ""] || 10;

  // Trust account
  const trustPain: Record<string, number> = { casse_tete: 20, incertain: 18, manuel: 12, comptable: 8, logiciel: 3 };
  painScore += trustPain[responses.trust_account_management || ""] || 10;

  // Billing time
  const billingPain: Record<string, number> = { "plus_10h": 15, "5_10h": 10, "2_5h": 5, "moins_2h": 2 };
  painScore += billingPain[responses.monthly_billing_time || ""] || 5;

  // Time tracking
  const timePain: Record<string, number> = { pas_systematique: 15, fin_semaine: 10, fin_journee: 5, temps_reel: 1 };
  painScore += timePain[responses.time_tracking_method || ""] || 5;

  // Bar confidence (inverted)
  painScore += Math.max(0, (6 - (responses.bar_inspection_confidence || 3)) * 3);

  // Clamp to 0-100
  painScore = Math.min(100, Math.max(0, painScore));

  // Maturity level
  let maturity = "Intermédiaire";
  if (painScore >= 65) maturity = "Débutant";
  else if (painScore <= 30) maturity = "Avancé";

  // Monthly loss estimate
  const adminHoursMap: Record<string, number> = { "moins_2h": 1.5, "2_5h": 3.5, "5_10h": 7.5, "plus_10h": 12 };
  const weeklyHours = adminHoursMap[responses.weekly_admin_hours || "2_5h"] || 3.5;
  const estimatedMonthlyLoss = Math.round(weeklyHours * 250 * 4);

  // Priority recommendations
  const recommendations: string[] = [];

  if (["papier", "aucun", "melange"].includes(responses.case_tracking_method || ""))
    recommendations.push("Implanter un système de suivi de dossiers numérique centralisé");
  if (["chaos", "manuel"].includes(responses.accounting_tool || ""))
    recommendations.push("Adopter une solution comptable adaptée à la pratique juridique");
  if (["casse_tete", "incertain", "manuel"].includes(responses.trust_account_management || ""))
    recommendations.push("Sécuriser la gestion du compte en fidéicommis pour assurer la conformité");
  if (["plus_10h", "5_10h"].includes(responses.monthly_billing_time || ""))
    recommendations.push("Automatiser le processus de facturation pour gagner du temps");
  if (["pas_systematique", "fin_semaine"].includes(responses.time_tracking_method || ""))
    recommendations.push("Mettre en place l'enregistrement des heures en temps réel");
  if ((responses.bar_inspection_confidence || 3) <= 2)
    recommendations.push("Préparer un plan de conformité pour les inspections du Barreau");

  if (recommendations.length === 0)
    recommendations.push("Optimiser vos processus existants avec des outils intégrés");

  return {
    pain_score: painScore,
    maturity_level: maturity,
    estimated_monthly_loss: estimatedMonthlyLoss,
    priority_recommendations: recommendations.slice(0, 3),
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
        <span className="text-3xl font-bold text-[#12372A] font-jakarta">{displayScore}</span>
        <span className="text-xs text-[#436850] font-jakarta">/100</span>
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
  const [contactForm, setContactForm] = useState({ name: "", email: "", phone: "", firm: "" });
  const [auditId] = useState(() => uid());
  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
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
          }
          setMessages((prev) => [...prev, msg]);
          scrollToBottom();
          resolve();
        }, delay);
      });
    },
    [scrollToBottom]
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
      scrollToBottom();
    },
    [scrollToBottom]
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
      "Intermédiaire": "text-[#436850]",
      "Avancé": "text-[#12372A]",
    };

    return (
      <div className="flex flex-col min-h-[70vh] bg-[#F8FDF9] text-[#12372A]">
        {/* Header */}
        <header className="sticky top-0 z-10 border-b border-[#ADBC9F]/30 bg-[#F8FDF9]/95 backdrop-blur-md px-4 py-3">
          <div className="max-w-2xl mx-auto flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#436850] to-[#12372A] flex items-center justify-center text-xs font-bold text-[#F8FDF9] shrink-0">
              AF
            </div>
            <div>
              <h1 className="text-sm font-semibold font-jakarta text-[#12372A]">Rapport d&apos;audit</h1>
              <p className="text-xs text-[#436850] font-jakarta">Me Audrey Fortier</p>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-4 py-8">
          <div className="max-w-2xl mx-auto space-y-6">
            {/* Score card */}
            <div className="audit-result-card rounded-2xl border border-[#ADBC9F]/30 bg-white/60 p-6 text-center audit-slide-up">
              <h2 className="text-lg font-bold font-jakarta mb-1 text-[#12372A]">Score de votre cabinet</h2>
              <p className="text-xs text-[#436850] font-jakarta mb-6">Basé sur vos {Object.keys(responses).length} réponses</p>
              <ScoreGauge score={computed.pain_score} />
              <div className="mt-4">
                <span className={`text-sm font-semibold font-jakarta ${maturityColors[computed.maturity_level] || "text-[#12372A]"}`}>
                  Maturité : {computed.maturity_level}
                </span>
              </div>
            </div>

            {/* Pain points */}
            <div className="audit-result-card rounded-2xl border border-[#ADBC9F]/30 bg-white/60 p-6 audit-slide-up" style={{ animationDelay: "0.15s" }}>
              <div className="flex items-center gap-2 mb-4">
                <Target className="w-5 h-5 text-[#436850]" />
                <h3 className="text-base font-bold font-jakarta text-[#12372A]">Pistes d&apos;amélioration prioritaires</h3>
              </div>
              <div className="space-y-3">
                {computed.priority_recommendations.map((rec, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-[#ADBC9F]/10 border border-[#ADBC9F]/20">
                    <div className="w-6 h-6 rounded-full bg-[#12372A] flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-[#F8FDF9]">{i + 1}</span>
                    </div>
                    <p className="text-sm text-[#436850] font-jakarta">{rec}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Financial impact */}
            <div className="audit-result-card rounded-2xl border border-[#12372A]/15 bg-[#12372A] p-6 audit-slide-up" style={{ animationDelay: "0.3s" }}>
              <div className="flex items-center gap-2 mb-3">
                <DollarSign className="w-5 h-5 text-[#F8FDF9]" />
                <h3 className="text-base font-bold font-jakarta text-[#F8FDF9]">Impact financier estimé</h3>
              </div>
              <p className="text-3xl font-bold text-[#F8FDF9] font-jakarta">
                {computed.estimated_monthly_loss.toLocaleString("fr-CA")} $
                <span className="text-sm font-normal text-[#ADBC9F]"> /mois</span>
              </p>
              <p className="text-xs text-[#ADBC9F] font-jakarta mt-1">
                Revenus potentiels perdus en tâches administratives
              </p>
              <div className="mt-3 p-3 rounded-xl bg-white/10 border border-white/10">
                <p className="text-sm text-[#ADBC9F] font-jakarta">
                  Avec SAFE, vous pourriez récupérer jusqu&apos;à <strong className="text-[#F8FDF9]">70%</strong> de ce temps et le consacrer à vos clients.
                </p>
              </div>
            </div>

            {/* Summary metrics */}
            <div className="grid grid-cols-2 gap-3 audit-slide-up" style={{ animationDelay: "0.45s" }}>
              <div className="rounded-xl border border-[#ADBC9F]/30 bg-white/60 p-4 text-center">
                <Clock className="w-5 h-5 text-[#436850] mx-auto mb-2" />
                <p className="text-lg font-bold font-jakarta text-[#12372A]">
                  {responses.weekly_admin_hours === "moins_2h" ? "< 2h" : responses.weekly_admin_hours === "2_5h" ? "2-5h" : responses.weekly_admin_hours === "5_10h" ? "5-10h" : "10h+"}
                </p>
                <p className="text-xs text-[#436850] font-jakarta">heures admin/sem.</p>
              </div>
              <div className="rounded-xl border border-[#ADBC9F]/30 bg-white/60 p-4 text-center">
                <Shield className="w-5 h-5 text-[#436850] mx-auto mb-2" />
                <p className="text-lg font-bold font-jakarta text-[#12372A]">
                  {responses.bar_inspection_confidence || "?"}/5
                </p>
                <p className="text-xs text-[#436850] font-jakarta">confiance Barreau</p>
              </div>
            </div>

            {/* CTA buttons */}
            <div className="space-y-3 audit-slide-up" style={{ animationDelay: "0.6s" }}>
              <a
                href="/demo"
                className="group flex items-center justify-center gap-2 w-full py-4 rounded-2xl bg-[#12372A] text-[#F8FDF9] font-semibold text-sm font-jakarta hover:bg-[#436850] hover:shadow-lg hover:shadow-[#12372A]/15 transition-all duration-300"
              >
                <Calendar className="w-4 h-4" />
                Réserver une démo personnalisée
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
              </a>
              <button
                type="button"
                className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl border border-[#ADBC9F] bg-white/50 text-[#12372A] font-medium text-sm font-jakarta hover:bg-[#ADBC9F]/20 transition-all duration-300"
              >
                <Mail className="w-4 h-4" />
                Recevoir le rapport complet par courriel
              </button>
            </div>

            {/* SAFE branding */}
            <div className="text-center py-4">
              <p className="text-xs text-[#ADBC9F] font-jakarta">
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
    <div className="flex flex-col min-h-[70vh] bg-[#F8FDF9] text-[#12372A]">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-[#ADBC9F]/30 bg-[#F8FDF9]/95 backdrop-blur-md">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#436850] to-[#12372A] flex items-center justify-center text-xs font-bold text-[#F8FDF9] shrink-0 ring-2 ring-[#436850]/20">
            AF
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-sm font-semibold font-jakarta truncate text-[#12372A]">Me Audrey Fortier</h1>
            <p className="text-xs text-[#436850] font-jakarta">
              {isTyping ? (
                <span className="text-[#436850] font-medium">écrit...</span>
              ) : (
                "Auditrice — Efficacité des cabinets juridiques"
              )}
            </p>
          </div>
          {/* Secure badge */}
          <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-[#ADBC9F]/15 border border-[#ADBC9F]/30">
            <Shield className="w-3 h-3 text-[#436850]" />
            <span className="text-[10px] text-[#436850] font-jakarta">Confidentiel</span>
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
                          ? "bg-[#12372A]"
                          : i + 1 === currentPhase
                          ? "bg-[#436850]"
                          : "bg-[#ADBC9F]/30"
                      }`}
                    />
                    <span
                      className={`text-[9px] font-jakarta hidden sm:block transition-colors duration-300 ${
                        i + 1 <= currentPhase ? "text-[#436850]" : "text-[#ADBC9F]"
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
      <main ref={chatContainerRef} className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-2xl mx-auto space-y-4">
          {messages.map((msg) => (
            <div key={msg.id}>
              {/* Message bubble */}
              <div
                className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"} audit-msg-appear`}
              >
                {msg.sender === "auditor" && (
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#436850] to-[#12372A] flex items-center justify-center text-[9px] font-bold text-[#F8FDF9] shrink-0 mr-2 mt-1">
                    AF
                  </div>
                )}
                <div
                  className={`max-w-[80%] sm:max-w-[70%] rounded-2xl px-4 py-3 text-sm font-jakarta leading-relaxed whitespace-pre-line ${
                    msg.sender === "user"
                      ? "bg-[#ADBC9F]/20 text-[#12372A] border border-[#ADBC9F]/30 rounded-br-md"
                      : "bg-[#12372A] text-[#F8FDF9] border border-[#12372A]/10 rounded-bl-md"
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
                          className="group w-full text-left px-4 py-3 rounded-xl border border-[#ADBC9F]/30 bg-white/60 hover:bg-[#436850]/10 hover:border-[#436850]/30 text-sm text-[#436850] hover:text-[#12372A] font-jakarta transition-all duration-200 flex items-center gap-3"
                        >
                          <div className="w-5 h-5 rounded-full border border-[#ADBC9F] group-hover:border-[#436850] transition-colors shrink-0 flex items-center justify-center">
                            <div className="w-2 h-2 rounded-full bg-transparent group-hover:bg-[#436850] transition-colors" />
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
                            className="flex-1 px-4 py-3 rounded-xl bg-white/70 border border-[#ADBC9F]/40 text-sm text-[#12372A] placeholder-[#ADBC9F] font-jakarta focus:outline-none focus:border-[#436850]/50 transition-colors"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleCustomSubmit(msg.questionKey!);
                            }}
                          />
                          <button
                            onClick={() => handleCustomSubmit(msg.questionKey!)}
                            className="px-4 py-3 rounded-xl bg-[#12372A] text-[#F8FDF9] text-sm font-jakarta hover:bg-[#436850] transition-colors"
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
                            className={`group w-full text-left px-4 py-3 rounded-xl border text-sm font-jakarta transition-all duration-200 flex items-center gap-3 ${
                              isSelected
                                ? "border-[#436850]/40 bg-[#436850]/15 text-[#12372A]"
                                : "border-[#ADBC9F]/30 bg-white/60 hover:bg-[#436850]/10 hover:border-[#436850]/20 text-[#436850] hover:text-[#12372A]"
                            }`}
                          >
                            <div
                              className={`w-5 h-5 rounded border shrink-0 flex items-center justify-center transition-colors ${
                                isSelected ? "border-[#436850] bg-[#436850]" : "border-[#ADBC9F]"
                              }`}
                            >
                              {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-[#F8FDF9]" />}
                            </div>
                            {opt.label}
                          </button>
                        );
                      })}

                      {multiSelect.length > 0 && (
                        <button
                          onClick={() => handleMultiConfirm(msg.questionKey!, msg.options!)}
                          className="w-full mt-2 px-4 py-3 rounded-xl bg-[#12372A] text-[#F8FDF9] text-sm font-semibold font-jakarta hover:bg-[#436850] transition-colors flex items-center justify-center gap-2"
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
                        <p className="text-xs text-[#ADBC9F] font-jakarta">
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
                            className="group flex-1 py-3 rounded-xl border border-[#ADBC9F]/30 bg-white/60 hover:bg-[#436850]/10 hover:border-[#436850]/30 text-sm font-jakarta transition-all duration-200 flex flex-col items-center gap-1"
                          >
                            <Star className="w-4 h-4 text-[#ADBC9F] group-hover:text-[#436850] transition-colors" />
                            <span className="text-[#436850] group-hover:text-[#12372A] transition-colors">
                              {val}
                            </span>
                          </button>
                        ))}
                      </div>
                      {msg.scaleLabels?.[5] && (
                        <p className="text-xs text-[#ADBC9F] font-jakarta text-right">
                          5 — {msg.scaleLabels[5]}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Contact form */}
                  {msg.questionType === "contact" && (
                    <form onSubmit={handleContactSubmit} className="space-y-3 audit-msg-appear">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-[#ADBC9F]" />
                        <input
                          type="text"
                          required
                          value={contactForm.name}
                          onChange={(e) => setContactForm((f) => ({ ...f, name: e.target.value }))}
                          placeholder="Nom complet *"
                          className="flex-1 px-4 py-3 rounded-xl bg-white/70 border border-[#ADBC9F]/40 text-sm text-[#12372A] placeholder-[#ADBC9F] font-jakarta focus:outline-none focus:border-[#436850]/50 transition-colors"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-[#ADBC9F]" />
                        <input
                          type="email"
                          required
                          value={contactForm.email}
                          onChange={(e) => setContactForm((f) => ({ ...f, email: e.target.value }))}
                          placeholder="Courriel *"
                          className="flex-1 px-4 py-3 rounded-xl bg-white/70 border border-[#ADBC9F]/40 text-sm text-[#12372A] placeholder-[#ADBC9F] font-jakarta focus:outline-none focus:border-[#436850]/50 transition-colors"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-[#ADBC9F]" />
                        <input
                          type="tel"
                          value={contactForm.phone}
                          onChange={(e) => setContactForm((f) => ({ ...f, phone: e.target.value }))}
                          placeholder="Téléphone (optionnel)"
                          className="flex-1 px-4 py-3 rounded-xl bg-white/70 border border-[#ADBC9F]/40 text-sm text-[#12372A] placeholder-[#ADBC9F] font-jakarta focus:outline-none focus:border-[#436850]/50 transition-colors"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-[#ADBC9F]" />
                        <input
                          type="text"
                          value={contactForm.firm}
                          onChange={(e) => setContactForm((f) => ({ ...f, firm: e.target.value }))}
                          placeholder="Nom du cabinet (optionnel)"
                          className="flex-1 px-4 py-3 rounded-xl bg-white/70 border border-[#ADBC9F]/40 text-sm text-[#12372A] placeholder-[#ADBC9F] font-jakarta focus:outline-none focus:border-[#436850]/50 transition-colors"
                        />
                      </div>
                      <button
                        type="submit"
                        className="w-full py-3 rounded-xl bg-[#12372A] text-[#F8FDF9] font-semibold text-sm font-jakarta hover:bg-[#436850] hover:shadow-lg hover:shadow-[#12372A]/15 transition-all duration-300 flex items-center justify-center gap-2"
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
                        className="w-full py-2 text-xs text-[#ADBC9F] font-jakarta hover:text-[#436850] transition-colors"
                      >
                        Passer et voir les résultats directement
                      </button>
                    </form>
                  )}
                </div>
              )}
            </div>
          ))}

          {/* Typing indicator */}
          {isTyping && (
            <div className="flex items-start gap-2 audit-msg-appear">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#436850] to-[#12372A] flex items-center justify-center text-[9px] font-bold text-[#F8FDF9] shrink-0">
                AF
              </div>
              <div className="rounded-2xl rounded-bl-md bg-[#12372A] border border-[#12372A]/10 px-4 py-3">
                <div className="flex gap-1">
                  <span className="audit-typing-dot w-2 h-2 rounded-full bg-[#ADBC9F]" />
                  <span className="audit-typing-dot w-2 h-2 rounded-full bg-[#ADBC9F]" style={{ animationDelay: "0.15s" }} />
                  <span className="audit-typing-dot w-2 h-2 rounded-full bg-[#ADBC9F]" style={{ animationDelay: "0.3s" }} />
                </div>
              </div>
            </div>
          )}

          {/* Start button */}
          {!started && messages.length > 0 && !isTyping && (
            <div className="flex justify-center mt-4 audit-options-appear">
              <button
                onClick={handleStart}
                className="group px-8 py-3.5 rounded-2xl bg-[#12372A] text-[#F8FDF9] font-semibold text-sm font-jakarta hover:bg-[#436850] hover:shadow-lg hover:shadow-[#12372A]/15 transition-all duration-300 flex items-center gap-2"
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
