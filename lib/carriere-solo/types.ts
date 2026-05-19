/**
 * SAFE — Carrière Solo
 * Checklist dynamique pour jeunes avocats qui veulent lancer leur cabinet.
 * Bi-juridiction : Québec + Ontario.
 */

export type Jurisdiction = "qc" | "on" | "both";

export type PracticeArea =
  | "famille"
  | "immobilier"
  | "corporatif"
  | "criminel"
  | "civil"
  | "immigration";

export type Status =
  | "etudiant"      // Étudiant Barreau / EFB, pas encore admis
  | "stagiaire"     // En stage de formation professionnelle
  | "admis_recent"  // Admis ≤ 2 ans
  | "admis_5ans"    // Admis 2 à 5 ans
  | "transition";   // En cabinet, veut sortir

export type Horizon =
  | "imminent"      // < 3 mois
  | "moyen"         // 3 à 12 mois
  | "exploratoire"; // > 12 mois

export type Fear =
  | "admin"         // Charge admin / compta
  | "clients"       // Acquisition clients
  | "argent"        // Cash flow, viabilité
  | "conformite"    // Barreau, déontologie
  | "mental";       // Charge mentale, isolement

export type SectionId =
  | "barreau"
  | "fiducie"
  | "structure"
  | "compta"
  | "infra"
  | "acquisition"
  | "domaine"
  | "timeline";

export type ItemPriority = "critique" | "important" | "recommande";

export interface SansAvec {
  /** Réalité brute pour qui assemble seul son setup. */
  sansSafe: string;
  /** Ce que SAFE fait à la place. Phrase courte, scandée. */
  avecSafe: string;
  /** Chiffre clé pour matérialiser le coût caché. */
  chiffre?: {
    valeur: string;
    source: string;
  };
}

export interface Autorite {
  label: string;
  url: string;
}

export interface Cout {
  qc?: string;
  on?: string;
  /** Coût applicable aux deux juridictions. */
  commun?: string;
}

export interface Piege {
  texte: string;
  /** Sanction chiffrée si pertinente. */
  chiffre?: string;
}

export interface ChecklistItem {
  id: string;
  section: SectionId;
  priority: ItemPriority;
  jurisdiction: Jurisdiction;
  /** Si vide ou absent : tous les domaines. */
  practiceAreas?: PracticeArea[];
  /** Si présent : item visible seulement pour ces statuts. */
  appliesToStatus?: Status[];
  /** Si présent : item mis en avant pour ces horizons. */
  appliesToHorizon?: Horizon[];
  /** Marquage visuel renforcé pour la peur principale du persona. */
  highlightForFear?: Fear[];

  /** Verbe à l'infinitif, court, scandé. */
  action: string;
  /** Délai ou moment d'exécution. */
  delai: string;
  cout?: Cout;
  autorite?: Autorite;
  piege?: Piege;

  /** Encadré "Sans SAFE / Avec SAFE" — cœur du pitch. */
  sansAvec?: SansAvec;
}

export interface Answers {
  juridiction: Exclude<Jurisdiction, "both">;
  statut: Status;
  horizon: Horizon;
  domaines: PracticeArea[];
  peur: Fear;
}

export interface SectionMeta {
  id: SectionId;
  title: string;
  subtitle: string;
}

export const SECTION_META: SectionMeta[] = [
  {
    id: "barreau",
    title: "Conformité Barreau",
    subtitle: "Sans ça, tu n'existes pas comme avocat.",
  },
  {
    id: "fiducie",
    title: "Comptabilité en fidéicommis",
    subtitle: "Le piège qui fait radier le plus de solos.",
  },
  {
    id: "structure",
    title: "Structure juridique et fiscale",
    subtitle: "Le bon contenant pour ton revenu.",
  },
  {
    id: "compta",
    title: "Comptabilité et facturation",
    subtitle: "Là où le revenu fuit le plus vite.",
  },
  {
    id: "infra",
    title: "Infrastructure et outils",
    subtitle: "Cabinet en règle, données protégées, sommeil tranquille.",
  },
  {
    id: "acquisition",
    title: "Clients et développement",
    subtitle: "Faire venir le premier dossier. Et le deuxième.",
  },
  {
    id: "domaine",
    title: "Spécifiques à ton domaine",
    subtitle: "Les pièges propres à ta pratique.",
  },
  {
    id: "timeline",
    title: "Échéancier de lancement",
    subtitle: "90 jours pour ouvrir. Si tu sais quoi faire.",
  },
];

export interface GeneratedChecklist {
  answers: Answers;
  sections: Array<{
    meta: SectionMeta;
    items: ChecklistItem[];
  }>;
  totalItems: number;
  criticalCount: number;
}
