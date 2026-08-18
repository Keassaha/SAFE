/**
 * SAFE — Les délais de divulgation en matière familiale au Québec.
 *
 * Recherche : docs/research/RECHERCHE_divulgation_famille_QC_2026-08-18.md
 * Spec      : docs/product/SPEC_COLLECTE_PIECES_CLIENT.md
 *
 * POURQUOI CE MODULE EXISTE
 *
 * Six délais commandent la divulgation en matière familiale. Aucun n'est une
 * convention de cabinet : ils sont écrits dans le Code de procédure civile et dans le
 * Règlement de la Cour supérieure. Aujourd'hui l'avocat les tient de tête.
 *
 * TOUS LES DÉLAIS NE SE VALENT PAS
 *
 * C'est le point que ce module rend visible. Rater l'article 26 du règlement retarde.
 * Rater l'article 413 al. 2 du Code rend la demande **indécidable** : l'audience est
 * perdue, pas reportée. Un produit qui affiche les six pareil serait faux sur ce qui
 * compte le plus.
 *
 * CE QUE CE MODULE NE FAIT PAS
 *
 * Il ne dit jamais qu'une divulgation est complète, ni qu'un délai est respecté. Il
 * calcule une date à partir d'une règle écrite, et il nomme sa source. Le jugement
 * reste à l'avocat.
 *
 * LIMITE CONNUE, ET ELLE COMPTE
 *
 * Le calcul est en JOURS CALENDAIRES. Les règles de computation des délais du Code de
 * procédure civile (jours francs, report d'une échéance tombant un jour férié ou non
 * juridique) n'ont PAS été vérifiées.
 *
 * Sur un délai qui rend une demande indécidable, se tromper d'un jour est grave. Tant
 * que cette vérification n'est pas faite, l'écran doit présenter ces dates comme un
 * repère à confirmer, jamais comme un calcul opposable, et ne doit jamais afficher
 * « vous êtes dans les délais ».
 *
 * `A_CONFIRMER` C.p.c. art. 83 et suivants, computation des délais.
 */

import { toCalendarDayUTC, toIsoDay } from "@/lib/utils/calendar-date";

/* ── Ce que le dossier doit porter ────────────────────────────────────────── */

export interface DatesDossierFamille {
  /** Signification de la demande. Commande les délais de 180 jours. */
  signification?: Date | null;
  /** Présentation de la demande. Commande les délais de l'art. 413 al. 2. */
  presentation?: Date | null;
  /** Date d'instruction. Commande le délai de l'art. 26 du règlement. */
  instruction?: Date | null;
  /** Dépôt du protocole de l'instance. */
  protocole?: Date | null;
  /** Communication du formulaire de patrimoine par le demandeur. */
  communicationPatrimoine?: Date | null;
}

/* ── Ce que le module rend ────────────────────────────────────────────────── */

export type CodeDelaiFamille =
  | "CPC_413_AL2_DEMANDEUR"
  | "CPC_413_AL2_DEFENDEUR"
  | "CPC_413_AL1_PROTOCOLE"
  | "REGL_26_INSTRUCTION"
  | "REGL_27_SIGNIFICATION"
  | "REGL_27_CONTESTATION";

/**
 * Ce qui arrive si le délai est raté. C'est la seule hiérarchie qui compte pour
 * l'avocat, et elle ne doit jamais être aplatie à l'écran.
 */
export type ConsequenceDelai =
  /** La demande ne peut pas être décidée. L'audience est perdue. */
  | "demande_indecidable"
  /** Manquement procédural : retard, reproche, pas de perte sèche. */
  | "manquement_procedural";

export type EtatDelai =
  /** La date de départ n'est pas saisie : rien ne peut être calculé. */
  | "date_source_manquante"
  | "a_venir"
  | "echu";

export interface DelaiFamille {
  code: CodeDelaiFamille;
  /** Phrase montrable au cabinet. Jamais un code. */
  libelle: string;
  /** L'article, affichable, pour que l'avocat vérifie lui-même. */
  reference: string;
  consequence: ConsequenceDelai;
  etat: EtatDelai;
  /** Jour calendaire de l'échéance. `null` si la date source manque. */
  echeance: Date | null;
  /** Quelle date il faut saisir pour débloquer ce délai. */
  dateSourceManquante?: keyof DatesDossierFamille;
  /** Négatif si le délai est passé. `null` si non calculable. */
  joursRestants: number | null;
}

const JOUR_MS = 86_400_000;

/** Retranche des jours à un jour calendaire, sans jamais toucher à l'heure. */
function moins(jour: Date, jours: number): Date {
  return new Date(toCalendarDayUTC(jour).getTime() - jours * JOUR_MS);
}

/** Ajoute des jours à un jour calendaire. */
function plus(jour: Date, jours: number): Date {
  return new Date(toCalendarDayUTC(jour).getTime() + jours * JOUR_MS);
}

interface Regle {
  code: CodeDelaiFamille;
  libelle: string;
  reference: string;
  consequence: ConsequenceDelai;
  source: keyof DatesDossierFamille;
  /** Calcule l'échéance depuis la date source. */
  calcule: (source: Date) => Date;
}

/**
 * Les six règles, dans l'ordre de leur gravité, pas de leur article.
 *
 * L'ordre est un choix de produit : ce que l'avocat doit voir en premier est ce qui
 * peut lui coûter une audience, pas ce qui vient en premier dans le Code.
 */
const REGLES: readonly Regle[] = [
  {
    code: "CPC_413_AL2_DEMANDEUR",
    libelle:
      "Déposer au greffe l'état des revenus et dépenses et le bilan. Sans ce dépôt, la demande de pension ne peut pas être décidée.",
    reference: "C.p.c. art. 413 al. 2",
    consequence: "demande_indecidable",
    source: "presentation",
    calcule: (d) => moins(d, 10),
  },
  {
    code: "CPC_413_AL2_DEFENDEUR",
    libelle:
      "Déposer l'état et le bilan de la partie défenderesse, à moins qu'elle n'admette avoir les facultés de payer.",
    reference: "C.p.c. art. 413 al. 2",
    consequence: "demande_indecidable",
    source: "presentation",
    calcule: (d) => moins(d, 5),
  },
  {
    code: "REGL_26_INSTRUCTION",
    libelle:
      "Notifier à l'autre partie l'état de situation financière À JOUR, avec le formulaire de fixation des pensions pour enfants.",
    reference: "Règl. Cour sup. fam. art. 26",
    consequence: "manquement_procedural",
    source: "instruction",
    calcule: (d) => moins(d, 10),
  },
  {
    code: "CPC_413_AL1_PROTOCOLE",
    libelle:
      "Joindre au protocole de l'instance l'état de ses biens, en indiquant ceux qui sont inclus ou non dans le patrimoine.",
    reference: "C.p.c. art. 413 al. 1",
    consequence: "manquement_procedural",
    source: "protocole",
    calcule: (d) => toCalendarDayUTC(d),
  },
  {
    code: "REGL_27_SIGNIFICATION",
    libelle:
      "Communiquer et produire le formulaire de calcul de l'état du patrimoine familial, ou une déclaration ou renonciation équivalente.",
    reference: "Règl. Cour sup. fam. art. 27 et 29",
    consequence: "manquement_procedural",
    source: "signification",
    calcule: (d) => plus(d, 180),
  },
  {
    code: "REGL_27_CONTESTATION",
    libelle:
      "Produire son propre formulaire de calcul, si la partie défenderesse conteste celui du demandeur.",
    reference: "Règl. Cour sup. fam. art. 27 et 29",
    consequence: "manquement_procedural",
    source: "communicationPatrimoine",
    calcule: (d) => plus(d, 30),
  },
] as const;

/**
 * Calcule les six délais.
 *
 * `aujourdhui` est passé et non lu de l'horloge : un calcul de délai ne doit pas
 * dépendre du moment où la page est rendue, sinon il devient intestable et il varie
 * entre le serveur et l'écran.
 */
export function calculerDelaisFamille(
  dates: DatesDossierFamille,
  aujourdhui: Date,
): DelaiFamille[] {
  const jour = toCalendarDayUTC(aujourdhui);

  return REGLES.map((r) => {
    const source = dates[r.source] ?? null;

    // Sans date source, on ne devine pas. Une échéance inventée sur un délai qui rend
    // une demande indécidable serait pire que pas d'échéance du tout.
    if (!source) {
      return {
        code: r.code,
        libelle: r.libelle,
        reference: r.reference,
        consequence: r.consequence,
        etat: "date_source_manquante" as const,
        echeance: null,
        dateSourceManquante: r.source,
        joursRestants: null,
      };
    }

    const echeance = r.calcule(source);
    const joursRestants = Math.round((echeance.getTime() - jour.getTime()) / JOUR_MS);

    return {
      code: r.code,
      libelle: r.libelle,
      reference: r.reference,
      consequence: r.consequence,
      etat: joursRestants < 0 ? ("echu" as const) : ("a_venir" as const),
      echeance,
      joursRestants,
    };
  });
}

/**
 * Les dates qu'il faut saisir pour que les délais se calculent.
 *
 * Sert à l'écran : plutôt que d'afficher six lignes « non calculable », on dit quelles
 * dates manquent, une fois.
 */
export function datesManquantes(dates: DatesDossierFamille): Array<keyof DatesDossierFamille> {
  const requises = new Set(REGLES.map((r) => r.source));
  return [...requises].filter((k) => !dates[k]);
}

/** Le délai le plus grave parmi ceux qui sont calculables et non échus. */
export function delaiLePlusUrgent(delais: DelaiFamille[]): DelaiFamille | null {
  const candidats = delais.filter((d) => d.etat === "a_venir");
  if (candidats.length === 0) return null;

  // Une conséquence « indécidable » passe devant, quelle que soit la date : un délai
  // dans 20 jours qui coûte l'audience prime sur un manquement dans 3 jours.
  const graves = candidats.filter((d) => d.consequence === "demande_indecidable");
  const pool = graves.length > 0 ? graves : candidats;
  return pool.reduce((a, b) => ((a.joursRestants ?? 0) <= (b.joursRestants ?? 0) ? a : b));
}

/** Format court pour l'affichage et les tests. */
export function formatEcheance(d: DelaiFamille): string {
  return d.echeance ? toIsoDay(d.echeance) : "—";
}
