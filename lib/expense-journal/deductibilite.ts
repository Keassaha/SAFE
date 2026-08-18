/**
 * SAFE — Part déductible d'une dépense, par catégorie.
 *
 * Spec      : docs/accounting/SPEC_DEPENSES_ET_PREPARATION_FISCALE.md §2.2 (lot 2)
 * Recherche : docs/research/RECHERCHE_deductibilite_et_taxes_depenses_QC_ON_2026-08-17.md
 *
 * LA RÈGLE VIT SUR LA CATÉGORIE, JAMAIS SUR LA DÉPENSE
 *
 * Conséquence voulue : le cabinet n'a JAMAIS à se souvenir d'un pourcentage. Il
 * classe correctement, le reste suit. C'est aussi ce qui rend la règle modifiable en
 * un seul endroit le jour où elle change.
 *
 * DEUX TAUX, PAS UN
 *
 * La limite de 50 % sur les repas s'applique à la déduction au revenu ET au crédit
 * de taxe : quand la déduction est limitée à 50 %, seuls 50 % de la TPS/TVH payée
 * sont réclamables en CTI. Les deux taux coïncident aujourd'hui, ils sont portés
 * séparément parce que les confondre casserait à la première règle où ils divergent.
 *
 * UN PLAFOND N'EST PAS UN TAUX
 *
 * Au Québec, la déduction des frais de représentation est le MOINDRE de 50 % et d'un
 * plafond fondé sur le chiffre d'affaires annuel. Ce plafond ne se connaît qu'en fin
 * d'exercice et s'applique au CUMUL, pas à la ligne.
 *
 * D'où une règle dure de ce module : il ne calcule JAMAIS un « montant déductible »
 * par dépense, parce que ce montant n'existe pas avant la clôture. Il rend un taux et
 * signale qu'un plafond s'ajoutera. Le calcul du plafond appartient au dossier de fin
 * d'année (lot 4).
 */

/** Plafonds de fin d'exercice, appliqués au cumul et non à la ligne. */
export type PlafondFinExercice = "QC_REPRESENTATION";

export interface DeductibiliteRule {
  /**
   * Part déductible au revenu, de 0 à 1. `null` signifie « dépend d'une valeur que
   * le cabinet doit fournir » : aujourd'hui, seul le véhicule est dans ce cas.
   */
  tauxRevenu: number | null;
  /** Part de la taxe payée réclamable en CTI/RTI, de 0 à 1. */
  tauxTaxe: number | null;
  /** Un plafond de fin d'exercice s'ajoute au taux. */
  plafond?: PlafondFinExercice;
  /** Le taux vient d'un prorata d'usage déclaré par le cabinet, pas d'une règle. */
  prorataCabinet?: boolean;
  /** Phrase montrable au cabinet. Jamais un code, jamais un pourcentage seul. */
  motif: string;
  source: string;
  verifieLe: string;
}

const ARC_T2125 = "ARC, T2125 ligne 8523 (repas et frais de représentation)";
const ARC_RC4022 = "ARC, RC4022, limite de 50 % applicable au crédit de taxe";
const RQ_REPAS = "Revenu Québec, frais de repas et de représentation ; LI art. 175.6.1, 421.1, 421.1.1";
const ARC_VEHICULE = "ARC, calcul des frais de véhicule à moteur (prorata kilométrique)";

export const DEDUCTIBILITE_PAR_CATEGORIE: Readonly<Record<string, DeductibiliteRule>> = {
  // Les deux seules dépenses courantes d'un cabinet qui ne se déduisent pas en plein.
  REPAS_REPRESENTATION: {
    tauxRevenu: 0.5,
    tauxTaxe: 0.5,
    plafond: "QC_REPRESENTATION",
    motif:
      "Les repas et frais de représentation se déduisent à moitié, et la taxe payée ne se récupère qu'à moitié elle aussi. Au Québec, un plafond lié à votre chiffre d'affaires peut réduire encore ce montant à la clôture.",
    source: `${ARC_T2125} ; ${ARC_RC4022} ; ${RQ_REPAS}`,
    verifieLe: "2026-08-17",
  },

  // Pas de pourcentage fixe : la déduction suit la part d'usage d'affaires réelle.
  // Tant que le cabinet n'a pas déclaré son prorata, le taux est INCONNU et non
  // zéro : afficher zéro ferait croire que rien n'est déductible, ce qui est faux.
  VEHICULE: {
    tauxRevenu: null,
    tauxTaxe: null,
    prorataCabinet: true,
    motif:
      "La part déductible d'un véhicule suit son usage d'affaires. Indiquez votre prorata dans les paramètres du cabinet, sinon ces dépenses resteront hors de votre dossier de fin d'année.",
    source: ARC_VEHICULE,
    verifieLe: "2026-08-17",
  },
};

export const DEDUCTIBILITE_PLEINE: DeductibiliteRule = {
  tauxRevenu: 1,
  tauxTaxe: 1,
  motif: "Cette dépense se déduit en entier.",
  source: "Régime général",
  verifieLe: "2026-08-17",
};

/** Règle applicable à un code de catégorie. Jamais `undefined`. */
export function deductibiliteFor(code: string | null | undefined): DeductibiliteRule {
  if (!code) return DEDUCTIBILITE_PLEINE;
  return DEDUCTIBILITE_PAR_CATEGORIE[code] ?? DEDUCTIBILITE_PLEINE;
}

/**
 * Taux de crédit de taxe applicable, prorata du cabinet compris.
 *
 * `prorataUsage` est la part d'usage d'affaires déclarée par le cabinet, de 0 à 1.
 * Absente sur une catégorie qui en dépend, la fonction rend `null` : le taux est
 * INCONNU, et l'appelant doit le traiter comme une zone d'incertitude plutôt que de
 * réclamer quoi que ce soit.
 */
export function tauxTaxeReclamable(
  code: string | null | undefined,
  prorataUsage?: number | null,
): number | null {
  const regle = deductibiliteFor(code);
  if (!regle.prorataCabinet) return regle.tauxTaxe;
  if (prorataUsage == null || prorataUsage < 0 || prorataUsage > 1) return null;
  return prorataUsage;
}

/**
 * Le cabinet a-t-il des dépenses dont la déductibilité reste indéterminée ?
 *
 * Sert au dossier de fin d'année : un prorata véhicule non renseigné doit apparaître
 * comme une zone d'incertitude, pas se déduire silencieusement à zéro ni à cent.
 */
export function deductibiliteIndeterminee(
  code: string | null | undefined,
  prorataUsage?: number | null,
): boolean {
  return tauxTaxeReclamable(code, prorataUsage) === null;
}
