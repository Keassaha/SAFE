/**
 * SAFE — Fixation de la pension alimentaire pour enfants (modèle québécois).
 *
 * MODULE FEUILLE. Aucune importation hors de sa propre table, aucun état partagé,
 * aucun accès à la base.
 *
 * CE MODULE TRANSCRIT UN FORMULAIRE, IL NE L'INTERPRÈTE PAS.
 *
 * Le règlement C-25.01, r. 0.4 donne, ligne par ligne, quelles lignes additionner ou
 * multiplier. Chaque étape rendue ici porte donc SON NUMÉRO DE LIGNE, et le calcul se
 * relit contre le formulaire officiel sans traduction. C'est une différence importante
 * avec le patrimoine familial, où la formule demandait une lecture de l'article 418.
 *
 * SOURCES, vérifiées le 2026-08-19, registre : docs/research/REGISTRE_SOURCES_famille_QC.md
 *   - C-25.01, r. 0.4, règles 1 à 10 et formulaire (annexe I), à jour au 1er avril 2026
 *   - C-25.01, r. 12, annexe I, table applicable depuis le 1er janvier 2026
 *   - C.c.Q. art. 585 à 596
 *   - Loi sur le divorce, art. 2(1) et 2(5) ; DORS/97-237
 *
 * CE MODULE NE REND JAMAIS UN AVIS. Il rend un calcul, ses lignes, et ce qu'il refuse
 * de trancher. Le formulaire se produit sous serment : c'est un parent qui signe.
 */

import {
  DEDUCTION_DE_BASE,
  PLAFOND_TABLE,
  POURCENTAGES_AU_DELA,
  TABLE_VERSION,
  TRANCHES,
} from "./table-2026-01-01";

export const VERIFIE_LE = "2026-08-19";

export type Parent = "pere" | "mere";

/**
 * La situation de garde, telle que le règlement la découpe (art. 4 à 7).
 * Elle décide de la SECTION du formulaire, donc du calcul entier.
 */
export type SituationGarde =
  | "exclusive"
  | "visite_prolongee"
  | "exclusive_chacun"
  | "partagee"
  | "mixte";

export interface RevenusParent {
  /** Ligne 300 : revenu annuel de toute provenance (art. 9, 2°). */
  revenuAnnuel: number;
  /** Ligne 302. */
  cotisationsSyndicales: number;
  /** Ligne 303. */
  cotisationsProfessionnelles: number;
}

export interface Frais {
  /** Ligne 403, nets de tout avantage ou crédit, réputés nuls si négatifs. */
  garde: number;
  /** Ligne 404. */
  etudesPostsecondaires: number;
  /** Ligne 405. */
  particuliers: number;
}

export interface Entree {
  pere: RevenusParent;
  mere: RevenusParent;
  /** Ligne 400. */
  nombreEnfants: number;
  frais: Frais;
  garde: {
    situation: SituationGarde;
    /** Garde exclusive et visite prolongée : qui ne garde pas. */
    parentNonGardien?: Parent;
    /** Visite prolongée : jours de garde du parent non gardien, sur 365 (ligne 515). */
    joursNonGardien?: number;
    /** Garde exclusive à chacun : lignes 520 et 521. */
    enfantsChezPere?: number;
    enfantsChezMere?: number;
    /** Garde partagée : jours de chacun, sur 365 (ligne 530). */
    joursPere?: number;
    joursMere?: number;
  };
}

export interface Ligne {
  /** Le numéro tel qu'il figure au formulaire officiel. */
  numero: string;
  libelle: string;
  formule: string;
  /** Un montant, ou une paire père/mère quand le formulaire en demande deux. */
  valeur: number | { pere: number; mere: number };
}

export interface Reserve {
  code:
    | "garde_mixte"
    | "revenu_au_dela_du_plafond"
    | "ajustements_motives"
    | "plafond_capacite_applique"
    | "regime_federal";
  message: string;
  reference: string;
  verifieLe: string;
  leveePar: string;
}

export interface Resultat {
  /** null quand le calcul a été refusé. */
  pensionAnnuelle: number | null;
  pensionMensuelle: number | null;
  /** Qui paie. null si personne ne doit rien, ou si le calcul est refusé. */
  debiteur: Parent | null;
  lignes: Ligne[];
  reserves: Reserve[];
}

const R2 = (x: number) => Math.round(x * 100) / 100;
const positif = (x: number) => (x > 0 ? R2(x) : 0);

/**
 * Ligne 401, la contribution de base des deux parents.
 *
 * Trois régimes dans une seule ligne du formulaire, et il faut les trois :
 *
 *   - jusqu'à 200 000 $ de revenu disponible combiné, on LIT la tranche ;
 *   - au-delà, on ajoute un pourcentage de l'excédent au montant du plafond ;
 *   - au-delà de six enfants, on prolonge la table par l'écart entre 5 et 6 enfants
 *     (r. 12, art. 1 al. 2), ce qui vaut aussi pour le pourcentage.
 */
export function contributionDeBase(
  revenuDisponibleCombine: number,
  nombreEnfants: number,
): number {
  if (revenuDisponibleCombine <= 0 || nombreEnfants < 1) return 0;

  const colonne = Math.min(nombreEnfants, 6) - 1;
  const prolonger = (montants: number[]) =>
    nombreEnfants <= 6
      ? montants[colonne]
      : montants[5] + (nombreEnfants - 6) * (montants[5] - montants[4]);

  if (revenuDisponibleCombine <= PLAFOND_TABLE) {
    const t = TRANCHES.find(
      (x) => revenuDisponibleCombine >= x.de && revenuDisponibleCombine <= x.a,
    );
    return t ? R2(prolonger(t.montants)) : 0;
  }

  // Au-delà du plafond : le montant de la dernière tranche, plus le pourcentage.
  const derniere = TRANCHES[TRANCHES.length - 1];
  const pct =
    nombreEnfants <= 6
      ? POURCENTAGES_AU_DELA[colonne]
      : POURCENTAGES_AU_DELA[5] +
        (nombreEnfants - 6) * (POURCENTAGES_AU_DELA[5] - POURCENTAGES_AU_DELA[4]);
  const excedent = revenuDisponibleCombine - PLAFOND_TABLE;
  return R2(prolonger(derniere.montants) + (excedent * pct) / 100);
}

export function calculerPension(e: Entree): Resultat {
  const lignes: Ligne[] = [];
  const reserves: Reserve[] = [];

  // ── Partie 3 : le revenu disponible ────────────────────────────────────────
  const disponible = (r: RevenusParent) =>
    positif(
      r.revenuAnnuel -
        (DEDUCTION_DE_BASE + r.cotisationsSyndicales + r.cotisationsProfessionnelles),
    );

  const dispPere = disponible(e.pere);
  const dispMere = disponible(e.mere);
  const disp2 = R2(dispPere + dispMere);

  lignes.push({
    numero: "300",
    libelle: "Revenu annuel",
    formule: "de toute provenance (art. 9, 2°)",
    valeur: { pere: e.pere.revenuAnnuel, mere: e.mere.revenuAnnuel },
  });
  lignes.push({
    numero: "301",
    libelle: "Déduction de base",
    formule: `table applicable depuis le ${TABLE_VERSION}`,
    valeur: { pere: DEDUCTION_DE_BASE, mere: DEDUCTION_DE_BASE },
  });
  lignes.push({
    numero: "305",
    libelle: "Revenu disponible de chaque parent",
    formule: "ligne 300 − ligne 304, zéro si négatif",
    valeur: { pere: dispPere, mere: dispMere },
  });
  lignes.push({
    numero: "306",
    libelle: "Revenu disponible des deux parents",
    formule: "somme des lignes 305",
    valeur: disp2,
  });

  // Ligne 307, le facteur de répartition. Deux revenus nuls rendraient 0/0.
  const facteurPere = disp2 > 0 ? dispPere / disp2 : 0;
  const facteurMere = disp2 > 0 ? dispMere / disp2 : 0;
  lignes.push({
    numero: "307",
    libelle: "Facteur de répartition des revenus",
    formule: "ligne 305 ÷ ligne 306 × 100",
    valeur: { pere: R2(facteurPere * 100), mere: R2(facteurMere * 100) },
  });

  // ── Partie 4 : la contribution et les frais ────────────────────────────────
  const l401 = contributionDeBase(disp2, e.nombreEnfants);
  lignes.push({
    numero: "401",
    libelle: "Contribution alimentaire parentale de base",
    formule: `table, selon ligne 306 et ligne 400 (${e.nombreEnfants} enfant(s))`,
    valeur: l401,
  });

  if (disp2 > PLAFOND_TABLE) {
    reserves.push({
      code: "revenu_au_dela_du_plafond",
      message:
        `Le revenu disponible des deux parents dépasse ${PLAFOND_TABLE.toLocaleString("fr-CA")} $. ` +
        "Au-delà, le pourcentage de la table n'est donné qu'à titre INDICATIF : le " +
        "tribunal peut fixer un montant différent pour la partie excédentaire. Le " +
        "montant ci-dessous applique le pourcentage, il ne le garantit pas.",
      reference: "C-25.01, r. 0.4, art. 10",
      verifieLe: VERIFIE_LE,
      leveePar: "Rien. C'est une discrétion confiée au tribunal.",
    });
  }

  const l402 = { pere: R2(l401 * facteurPere), mere: R2(l401 * facteurMere) };
  lignes.push({
    numero: "402",
    libelle: "Contribution de base de chacun des parents",
    formule: "ligne 401 × ligne 307",
    valeur: l402,
  });

  const l406 = R2(
    positif(e.frais.garde) +
      positif(e.frais.etudesPostsecondaires) +
      positif(e.frais.particuliers),
  );
  lignes.push({
    numero: "406",
    libelle: "Total des frais",
    formule: "lignes 403 à 405, nets et réputés nuls si négatifs",
    valeur: l406,
  });

  const l407 = { pere: R2(l406 * facteurPere), mere: R2(l406 * facteurMere) };
  lignes.push({
    numero: "407",
    libelle: "Contribution de chacun des parents aux frais",
    formule: "ligne 406 × ligne 307",
    valeur: l407,
  });

  // ── Partie 5 : la section dictée par le temps de garde ─────────────────────
  const resultatSection = appliquerSection(e, {
    l401,
    l402,
    l406,
    l407,
    facteurPere,
    facteurMere,
    lignes,
    reserves,
  });

  if (resultatSection === null) {
    return { pensionAnnuelle: null, pensionMensuelle: null, debiteur: null, lignes, reserves };
  }

  const { annuelleAvantPlafond, debiteur } = resultatSection;

  // ── Partie 6 : la capacité de payer ────────────────────────────────────────
  // Deux plafonds distincts dans ce formulaire, et celui-ci n'a rien à voir avec le
  // seuil de 200 000 $ : il borne ce qu'un parent peut payer, pas ce que la table dit.
  let annuelle = annuelleAvantPlafond;
  if (debiteur && annuelleAvantPlafond > 0) {
    const dispDebiteur = debiteur === "pere" ? dispPere : dispMere;
    const l601 = R2(dispDebiteur * 0.5);
    lignes.push({
      numero: "601",
      libelle: "La moitié du revenu disponible du parent qui paie",
      formule: "ligne 600 × 50 %",
      valeur: l601,
    });
    lignes.push({
      numero: "602",
      libelle: "Pension selon la partie 5",
      formule: "report de la section applicable",
      valeur: annuelleAvantPlafond,
    });
    annuelle = Math.min(l601, annuelleAvantPlafond);
    lignes.push({
      numero: "603",
      libelle: "Pension annuelle à payer",
      formule: "le moindre des lignes 601 et 602",
      valeur: annuelle,
    });
    if (annuelle < annuelleAvantPlafond) {
      reserves.push({
        code: "plafond_capacite_applique",
        message:
          "La pension calculée dépassait la moitié du revenu disponible du parent qui " +
          "paie, et a donc été ramenée à ce plafond. Le tribunal peut en décider " +
          "autrement, notamment au vu des actifs de ce parent.",
        reference: "C-25.01, r. 0.4, art. 8 et partie 6 du formulaire",
        verifieLe: VERIFIE_LE,
        leveePar: "Rien. L'exception est une appréciation du tribunal.",
      });
    }
  }

  reserves.push({
    code: "ajustements_motives",
    message:
      "Le formulaire prévoit des lignes d'ajustement (512.1, 518.1, 526.1, 534.1) pour " +
      "s'écarter de ce calcul en donnant les motifs. Elles corrigent notamment deux " +
      "présomptions : que les frais sont payés par le parent qui reçoit la pension, et " +
      "que la contribution de base est assumée en proportion du temps de garde. Ce " +
      "calcul ne les applique pas : ce sont des décisions motivées, pas des formules.",
    reference: "C-25.01, r. 0.4, formulaire, notes 2 et 3",
    verifieLe: VERIFIE_LE,
    leveePar: "Rien. Ces lignes existent pour que quelqu'un décide et s'explique.",
  });

  return {
    pensionAnnuelle: annuelle,
    // Le formulaire raisonne en montants ANNUELS et divise à la partie 8 selon la
    // fréquence convenue. Le mensuel est donc une commodité d'affichage, pas la valeur
    // de référence.
    pensionMensuelle: R2(annuelle / 12),
    debiteur,
    lignes,
    reserves,
  };
}

/** Les quatre sections calculables de la partie 5. La cinquième est refusée. */
function appliquerSection(
  e: Entree,
  ctx: {
    l401: number;
    l402: { pere: number; mere: number };
    l406: number;
    l407: { pere: number; mere: number };
    facteurPere: number;
    facteurMere: number;
    lignes: Ligne[];
    reserves: Reserve[];
  },
): { annuelleAvantPlafond: number; debiteur: Parent | null } | null {
  const { l401, l402, l406, l407, facteurPere, facteurMere, lignes, reserves } = ctx;
  const g = e.garde;
  const facteur = (p: Parent) => (p === "pere" ? facteurPere : facteurMere);

  if (g.situation === "mixte") {
    // La section 4 combine garde exclusive, visite prolongée et garde partagée sur des
    // sous-groupes d'enfants, sur vingt-cinq lignes. Elle est transcriptible, mais je
    // n'ai AUCUN cas publié pour la vérifier, et une erreur y serait invisible.
    reserves.push({
      code: "garde_mixte",
      message:
        "Plusieurs types de garde coexistent dans ce dossier. La section 4 du " +
        "formulaire les combine sur vingt-cinq lignes, et ce calcul ne la reproduit " +
        "pas encore. Utilisez le formulaire officiel pour cette situation.",
      reference: "C-25.01, r. 0.4, art. 7 et formulaire, section 4",
      verifieLe: VERIFIE_LE,
      leveePar:
        "Un cas chiffré de garde mixte, déjà calculé, contre lequel vérifier la " +
        "transcription. Aucun n'a été trouvé publié.",
    });
    return null;
  }

  if (g.situation === "exclusive" || g.situation === "visite_prolongee") {
    const nonGardien = g.parentNonGardien;
    if (!nonGardien) return null;

    let contributionDeuxParents = R2(l401 + l406);
    lignes.push({
      numero: g.situation === "exclusive" ? "511" : "514",
      libelle: "Contribution alimentaire annuelle des deux parents",
      formule: "ligne 401 + ligne 406",
      valeur: contributionDeuxParents,
    });

    if (g.situation === "visite_prolongee") {
      const pct = ((g.joursNonGardien ?? 0) / 365) * 100;
      lignes.push({
        numero: "515",
        libelle: "Pourcentage du temps de garde du parent non gardien",
        formule: `${g.joursNonGardien ?? 0} jours ÷ 365 × 100`,
        valeur: R2(pct),
      });
      // Ligne 516 : (pourcentage − 20 %) × ligne 401. Le seuil de 20 % est dans la
      // formule elle-même, pas seulement dans la règle qui choisit la section.
      const compensation = R2(((pct - 20) / 100) * l401);
      lignes.push({
        numero: "516",
        libelle: "Compensation pour droit de visite et de sortie prolongé",
        formule: `(${R2(pct)} % − 20 %) × ligne 401`,
        valeur: compensation,
      });
      contributionDeuxParents = R2(contributionDeuxParents - compensation);
      lignes.push({
        numero: "517",
        libelle: "Contribution annuelle ajustée des deux parents",
        formule: "ligne 514 − ligne 516",
        valeur: contributionDeuxParents,
      });
    }

    const annuelle = positif(contributionDeuxParents * facteur(nonGardien));
    lignes.push({
      numero: g.situation === "exclusive" ? "512" : "518",
      libelle: "Pension annuelle à payer par le parent non gardien",
      formule: g.situation === "exclusive" ? "ligne 511 × ligne 307" : "ligne 517 × ligne 307",
      valeur: annuelle,
    });
    return { annuelleAvantPlafond: annuelle, debiteur: annuelle > 0 ? nonGardien : null };
  }

  if (g.situation === "exclusive_chacun") {
    const nPere = g.enfantsChezPere ?? 0;
    const nMere = g.enfantsChezMere ?? 0;
    const coutMoyen = e.nombreEnfants > 0 ? R2(l401 / e.nombreEnfants) : 0;
    lignes.push({
      numero: "523",
      libelle: "Coût moyen par enfant",
      formule: "ligne 401 ÷ ligne 400",
      valeur: coutMoyen,
    });
    const l524 = { pere: R2(coutMoyen * nPere), mere: R2(coutMoyen * nMere) };
    lignes.push({
      numero: "524",
      libelle: "Coût de la garde pour chaque parent",
      formule: "ligne 523 × nombre d'enfants gardés",
      valeur: l524,
    });
    const l525 = {
      pere: positif(l402.pere - l524.pere),
      mere: positif(l402.mere - l524.mere),
    };
    lignes.push({
      numero: "525",
      libelle: "Pension annuelle de base",
      formule: "ligne 522 − ligne 524, zéro si négatif",
      valeur: l525,
    });
    // Ligne 526 : « Inscrire 0 si ligne 525 égale 0 ». Les frais ne s'ajoutent donc
    // pas à un parent qui ne doit rien.
    const l526 = {
      pere: l525.pere === 0 ? 0 : R2(l525.pere + l407.pere),
      mere: l525.mere === 0 ? 0 : R2(l525.mere + l407.mere),
    };
    lignes.push({
      numero: "526",
      libelle: "Pension annuelle à payer",
      formule: "ligne 525 + ligne 407, zéro si ligne 525 est nulle",
      valeur: l526,
    });
    const debiteur: Parent | null =
      l526.pere > l526.mere ? "pere" : l526.mere > l526.pere ? "mere" : null;
    return {
      annuelleAvantPlafond: debiteur ? Math.max(l526.pere, l526.mere) : 0,
      debiteur,
    };
  }

  // Garde partagée, section 3.
  const pctPere = ((g.joursPere ?? 0) / 365) * 100;
  const pctMere = ((g.joursMere ?? 0) / 365) * 100;
  lignes.push({
    numero: "530",
    libelle: "Facteur de répartition de la garde",
    formule: "jours de garde ÷ 365 × 100",
    valeur: { pere: R2(pctPere), mere: R2(pctMere) },
  });
  const l532 = {
    pere: R2((l401 * pctPere) / 100),
    mere: R2((l401 * pctMere) / 100),
  };
  lignes.push({
    numero: "532",
    libelle: "Coût de la garde pour chaque parent",
    formule: "ligne 401 × ligne 530",
    valeur: l532,
  });
  const l533 = {
    pere: positif(l402.pere - l532.pere),
    mere: positif(l402.mere - l532.mere),
  };
  lignes.push({
    numero: "533",
    libelle: "Pension annuelle de base",
    formule: "ligne 531 − ligne 532, zéro si négatif",
    valeur: l533,
  });
  const l534 = {
    pere: l533.pere === 0 ? 0 : R2(l533.pere + l407.pere),
    mere: l533.mere === 0 ? 0 : R2(l533.mere + l407.mere),
  };
  lignes.push({
    numero: "534",
    libelle: "Pension annuelle à payer",
    formule: "ligne 533 + ligne 407, zéro si ligne 533 est nulle",
    valeur: l534,
  });
  const debiteur: Parent | null =
    l534.pere > l534.mere ? "pere" : l534.mere > l534.pere ? "mere" : null;
  return {
    annuelleAvantPlafond: debiteur ? Math.max(l534.pere, l534.mere) : 0,
    debiteur,
  };
}
