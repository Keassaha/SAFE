/**
 * SAFE — Carrière Solo
 * Les 5 questions du questionnaire de qualification.
 * Voix opérateur, phrases courtes scandées.
 */

import type {
  Fear,
  Horizon,
  Jurisdiction,
  PracticeArea,
  Status,
} from "./types";

export interface QuestionOption {
  value: string;
  label: string;
  /** Sous-titre court. Vocabulaire opérationnel. Pas de jargon corporate. */
  sub?: string;
}

export type QuestionId =
  | "juridiction"
  | "statut"
  | "horizon"
  | "domaines"
  | "peur";

export interface Question {
  id: QuestionId;
  number: string;
  type: "radio" | "checkbox";
  prompt: string;
  /** Phrase d'orientation. Une ligne max. */
  helper?: string;
  options: QuestionOption[];
  /** Pour checkbox uniquement. */
  maxChecked?: number;
  required: true;
}

export const QUESTIONS: Question[] = [
  {
    id: "juridiction",
    number: "1",
    type: "radio",
    required: true,
    prompt: "Tu veux exercer où ?",
    helper:
      "Une seule juridiction par cabinet. Les règles changent du tout au tout d'une province à l'autre.",
    options: [
      {
        value: "qc",
        label: "Québec",
        sub: "Barreau du Québec · FARPBQ · RCNEPA · Loi 25",
      },
      {
        value: "on",
        label: "Ontario",
        sub: "Law Society of Ontario · LawPRO · By-Law 9 · PIPEDA",
      },
    ],
  },
  {
    id: "statut",
    number: "2",
    type: "radio",
    required: true,
    prompt: "Où tu en es, dans ta carrière ?",
    helper: "Ça change ce qui est urgent et ce qui peut attendre.",
    options: [
      {
        value: "etudiant",
        label: "Étudiant Barreau / EFB",
        sub: "Pas encore admis. Tu prépares déjà la suite.",
      },
      {
        value: "stagiaire",
        label: "Stagiaire",
        sub: "En stage. Tu sais déjà que tu veux ton cabinet.",
      },
      {
        value: "admis_recent",
        label: "Admis depuis moins de 2 ans",
        sub: "Frais d'inscription réduits. Rabais d'assurance importants.",
      },
      {
        value: "admis_5ans",
        label: "Admis depuis 2 à 5 ans",
        sub: "Tu as un book de contacts. Tu envisages de partir.",
      },
      {
        value: "transition",
        label: "En cabinet, je veux sortir",
        sub: "Tu pars d'un cabinet existant. Non-compete et préavis à anticiper.",
      },
    ],
  },
  {
    id: "horizon",
    number: "3",
    type: "radio",
    required: true,
    prompt: "Tu vises quand pour ouvrir ?",
    helper:
      "Plus l'horizon est court, plus la checklist se concentre sur le critique.",
    options: [
      {
        value: "imminent",
        label: "Dans les 3 prochains mois",
        sub: "On va aller à l'essentiel. Pas de temps pour le superflu.",
      },
      {
        value: "moyen",
        label: "Dans 3 à 12 mois",
        sub: "Tu peux séquencer proprement. Pas de course.",
      },
      {
        value: "exploratoire",
        label: "Plus loin, j'explore",
        sub: "Tu valides la faisabilité avant de t'engager.",
      },
    ],
  },
  {
    id: "domaines",
    number: "4",
    type: "checkbox",
    required: true,
    maxChecked: 2,
    prompt: "Quel(s) domaine(s) tu veux pratiquer ?",
    helper:
      "Choisis-en 1 ou 2 maximum. Les obligations fiduciaires changent radicalement d'un domaine à l'autre.",
    options: [
      {
        value: "famille",
        label: "Droit de la famille",
        sub: "Fidéicommis obligatoire. Retainers 2 000–10 000 $.",
      },
      {
        value: "immobilier",
        label: "Droit immobilier",
        sub: "Fidéicommis lourd. Risque de fraude élevé. Levée LawPRO 65 $/transaction (ON).",
      },
      {
        value: "corporatif",
        label: "Droit corporatif",
        sub: "Fidéicommis si transactions. Registre bénéficiaires effectifs.",
      },
      {
        value: "criminel",
        label: "Droit criminel et pénal",
        sub: "Plafonds Jordan : 18 mois Cour provinciale / 30 mois Cour supérieure.",
      },
      {
        value: "civil",
        label: "Litige civil",
        sub: "Prescription : 3 ans (QC) / 2 ans (ON). Levée LawPRO par instance (ON).",
      },
      {
        value: "immigration",
        label: "Droit de l'immigration",
        sub: "IRCC. Délais CISR très courts (15–30 jours).",
      },
    ],
  },
  {
    id: "peur",
    number: "5",
    type: "radio",
    required: true,
    prompt: "C'est quoi, ta plus grosse peur, là, maintenant ?",
    helper:
      "Sois honnête. C'est ce qu'on va attaquer en priorité dans ta checklist.",
    options: [
      {
        value: "admin",
        label: "L'admin et la compta",
        sub: "Tu n'as pas étudié 4 ans pour saisir des feuilles de temps.",
      },
      {
        value: "clients",
        label: "Trouver des clients",
        sub: "Tu sais plaider. Vendre, c'est une autre histoire.",
      },
      {
        value: "argent",
        label: "Le cash flow",
        sub: "Lockup 93 jours. C'est la moyenne avant d'être payé.",
      },
      {
        value: "conformite",
        label: "Le Barreau, la déonto",
        sub: "Une erreur de fidéicommis et c'est radiation.",
      },
      {
        value: "mental",
        label: "La charge mentale, l'isolement",
        sub: "Solo, c'est seul. Tout repose sur toi. 24/7.",
      },
    ],
  },
];

export function getQuestion(id: QuestionId): Question | undefined {
  return QUESTIONS.find((q) => q.id === id);
}

/** Type-safe option resolver for the answer schema. */
export const ANSWER_KEYS = {
  juridiction: "juridiction" as const,
  statut: "statut" as const,
  horizon: "horizon" as const,
  domaines: "domaines" as const,
  peur: "peur" as const,
};

export type RawAnswers = {
  juridiction?: Jurisdiction;
  statut?: Status;
  horizon?: Horizon;
  domaines?: PracticeArea[];
  peur?: Fear;
};
