/**
 * SAFE — Plafond québécois sur les frais de représentation.
 *
 * Recherche : docs/research/RECHERCHE_deductibilite_et_taxes_depenses_QC_ON_2026-08-17.md
 * Paliers    : confirmés le 2026-08-18, voir SOURCES plus bas.
 *
 * CE QUE CE MODULE CALCULE, ET CE QU'IL NE CALCULE PAS
 *
 * Au Québec, la déduction des frais de représentation est le MOINDRE de deux
 * montants : 50 % des frais engagés, et un plafond fondé sur le chiffre d'affaires
 * annuel. Le taux de 50 % vit sur la catégorie (lot 2) ; le plafond vit ICI, parce
 * qu'il s'applique au CUMUL de l'exercice et ne se connaît qu'à la clôture.
 *
 * Le module ne produit donc jamais un montant par dépense. Il prend le total de
 * l'exercice et rend le montant déductible final.
 *
 * L'ONTARIO N'A PAS DE PLAFOND
 *
 * L'article 67.1 de la Loi de l'impôt sur le revenu n'impose que la limite de 50 %,
 * sans aucun plafond lié au chiffre d'affaires. Le plafond est une mesure
 * québécoise, et l'harmonisation fédérale est partielle. Un cabinet ontarien n'y est
 * donc pas soumis.
 *
 * SOURCES
 *
 * - Revenu Québec, guide IN-155 « Les revenus d'entreprise ou de profession »,
 *   §6.11.1, tableau des paliers. Vérifié le 2026-08-18.
 * - Ministère des Finances du Québec, recueil des dépenses fiscales 2025, fiche
 *   230105 : confirme les trois valeurs (2 %, 650 $, 1,25 %) toujours en vigueur.
 * - Loi sur les impôts (QC), art. 175.6.1, 421.1 et 421.1.1.
 * - Loi de l'impôt sur le revenu (fédéral), art. 67.1 : 50 %, aucun plafond.
 */

/** Palier du plafond québécois. Voir IN-155 §6.11.1. */
export interface PalierPlafond {
  /** Borne supérieure du chiffre d'affaires, exclusive. `null` = pas de borne. */
  jusqua: number | null;
  /** Pourcentage du chiffre d'affaires, ou `null` si le plafond est un montant fixe. */
  pourcentage: number | null;
  /** Montant fixe, ou `null` si le plafond est un pourcentage. */
  montantFixe: number | null;
}

/**
 * Les trois paliers, dans l'ordre.
 *
 * Cohérence interne à noter : 2 % de 32 500 = 650, et 1,25 % de 52 000 = 650. Le
 * plafond est donc CONTINU aux deux bornes, ce qui est une propriété voulue du
 * barème et un bon garde-fou contre une erreur de transcription. Un test la vérifie.
 */
export const PALIERS_QC: ReadonlyArray<PalierPlafond> = [
  { jusqua: 32_500, pourcentage: 2, montantFixe: null },
  { jusqua: 52_000, pourcentage: null, montantFixe: 650 },
  { jusqua: null, pourcentage: 1.25, montantFixe: null },
];

export const PLAFOND_VERIFIE_LE = "2026-08-18";

const R2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

/**
 * Plafond applicable à un chiffre d'affaires annuel, au Québec.
 *
 * `null` hors Québec : il n'y a pas de plafond, et rendre zéro laisserait croire
 * qu'aucune déduction n'est permise.
 */
export function plafondRepresentation(
  chiffreAffairesAnnuel: number,
  province: string | null | undefined,
): number | null {
  if ((province ?? "").toUpperCase() !== "QC") return null;
  if (!Number.isFinite(chiffreAffairesAnnuel) || chiffreAffairesAnnuel < 0) return null;

  for (const p of PALIERS_QC) {
    if (p.jusqua == null || chiffreAffairesAnnuel <= p.jusqua) {
      return R2(p.montantFixe ?? (chiffreAffairesAnnuel * (p.pourcentage ?? 0)) / 100);
    }
  }
  return null;
}

export interface DeductionRepresentation {
  /** 50 % des frais engagés. */
  limite50: number;
  /** Plafond du chiffre d'affaires. `null` hors Québec. */
  plafond: number | null;
  /** Le moindre des deux, donc le montant réellement déductible. */
  deductible: number;
  /** Le plafond a-t-il mordu ? Utile à afficher : le cabinet comprend pourquoi. */
  plafondApplique: boolean;
}

/**
 * Déduction finale des frais de représentation d'un exercice.
 *
 * `fraisEngages` est le TOTAL de l'exercice, pas une ligne : le plafond s'applique
 * au cumul, et l'appliquer ligne par ligne donnerait un résultat plus généreux et
 * faux.
 */
export function deductionRepresentation(params: {
  fraisEngages: number;
  chiffreAffairesAnnuel: number;
  province: string | null | undefined;
}): DeductionRepresentation {
  const limite50 = R2(Math.max(0, params.fraisEngages) * 0.5);
  const plafond = plafondRepresentation(params.chiffreAffairesAnnuel, params.province);

  if (plafond == null) {
    return { limite50, plafond: null, deductible: limite50, plafondApplique: false };
  }
  const deductible = Math.min(limite50, plafond);
  return { limite50, plafond, deductible: R2(deductible), plafondApplique: plafond < limite50 };
}
