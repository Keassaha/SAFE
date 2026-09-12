/**
 * SAFE — Les trois natures d'une ligne en préparation, et ce qu'elles totalisent.
 *
 * L'écran de préparation rangeait tout ce qui n'était ni rabais ni frais dans
 * « honoraires », débours compris. Le total final restait juste, mais le
 * sous-total taxable affiché incluait les débours NON taxables (frais de
 * greffe, frais gouvernementaux) : l'assiette montrée ne correspondait plus
 * à la TPS calculée juste en dessous, et personne ne pouvait refaire le
 * calcul.
 *
 * Ces fonctions sont PURES : l'écran les appelle, les tests aussi. Le reste
 * de l'écran est du React que la suite (environnement `node`) ne peut pas
 * rendre — donc tout ce qui compte de l'argent vit ici, où ça se vérifie.
 */

/** Les types de ligne qui sont une somme AVANCÉE pour le client, pas du travail. */
const DEBOURS = new Set([
  "debours",
  "debours_taxable",
  "debours_non_taxable",
  /* `frais_administratifs` en fait partie : le présentateur le rend déjà en
     `debours_taxable` sur le document. Le laisser du côté des honoraires à
     l'écran faisait dire deux choses différentes au formulaire et à la
     facture envoyée. */
  "frais_administratifs",
]);

export function estDebours(type: string): boolean {
  return DEBOURS.has(type);
}

export function estRabais(type: string): boolean {
  return type === "rabais";
}

export function estHonoraire(type: string): boolean {
  return !estDebours(type) && !estRabais(type);
}

/** La forme minimale qu'une ligne doit avoir pour être comptée. */
export interface LigneComptable {
  type: string;
  amount: number;
  /** `false` = hors assiette de la taxe. Absent vaut taxable. */
  taxable?: boolean;
  /** Rabais porté par la ligne elle-même (repris d'un registre de tâches). */
  rabais?: number;
}

export interface SousTotauxPreparation {
  honoraires: number;
  deboursTaxables: number;
  deboursNonTaxables: number;
  /** Somme des deux, telle qu'elle s'affiche sur le titre du groupe. */
  debours: number;
  rabais: number;
  /** L'assiette sur laquelle la TPS et la TVQ se calculent. */
  baseTaxable: number;
}

export function calculerSousTotaux(lignes: LigneComptable[]): SousTotauxPreparation {
  let honoraires = 0;
  let deboursTaxables = 0;
  let deboursNonTaxables = 0;
  let rabais = 0;

  for (const l of lignes) {
    const montant = l.amount || 0;
    if (estRabais(l.type)) {
      rabais += montant;
      continue;
    }
    if (estDebours(l.type)) {
      if (l.taxable === false) deboursNonTaxables += montant;
      else deboursTaxables += montant;
      continue;
    }
    honoraires += montant;
    if (l.rabais && l.rabais > 0) rabais += l.rabais;
  }

  return {
    honoraires: arrondi(honoraires),
    deboursTaxables: arrondi(deboursTaxables),
    deboursNonTaxables: arrondi(deboursNonTaxables),
    debours: arrondi(deboursTaxables + deboursNonTaxables),
    rabais: arrondi(rabais),
    /* Le travail, plus les débours taxables, moins les rabais. Les débours
       non taxables n'entrent jamais dans l'assiette. */
    baseTaxable: arrondi(honoraires + deboursTaxables - rabais),
  };
}

function arrondi(n: number): number {
  return Math.round(n * 100) / 100;
}
