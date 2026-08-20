/**
 * SAFE — Ce que l'écran saisit, traduit en ce que le moteur calcule.
 *
 * POURQUOI CE MODULE EXISTE
 *
 * La lecture des champs et leur conversion vivaient dans un `useMemo` du composant.
 * Elles n'étaient donc vérifiables qu'en ouvrant un navigateur, ce qui rendait la
 * verification dépendante d'une fenêtre au premier plan. C'est une mauvaise raison pour
 * ne pas tester le chemin qui va de la frappe au montant.
 *
 * Ici, tout est pur. Le composant ne garde que le rendu.
 */

import type { Bien, CategorieBien } from "./calcul";

/** Une ligne du formulaire, telle que l'utilisateur la remplit : que du texte. */
export interface LigneSaisie {
  libelle: string;
  categorie: CategorieBien;
  possedeAvant: boolean;
  valeurBruteReference: string;
  detteReference: string;
  valeurBrutePartage: string;
  dettePartage: string;
  partageableEnNature: boolean;
  chargeFiscaleLatente: string;
}

/**
 * Lit un montant tapé à la main.
 *
 * Un cabinet québécois écrit « 1 250,50 $ », pas « 1250.5 ». Les espaces, les espaces
 * insécables, le symbole et la virgule décimale sont donc tous acceptés. Ce qui reste
 * illisible rend 0, jamais NaN : un NaN traverserait tout le calcul sans se signaler,
 * et `typeof NaN === "number"` ferait passer chaque garde-fou.
 */
export function nombre(saisie: string): number {
  const propre = saisie.replace(/[\s $]/g, "").replace(",", ".");
  const n = Number(propre);
  return Number.isFinite(n) ? n : 0;
}

/** Une ligne compte dès qu'elle porte un nom ou une valeur. */
export function ligneRemplie(l: LigneSaisie): boolean {
  return l.libelle.trim() !== "" || l.valeurBrutePartage.trim() !== "";
}

/**
 * Traduit une ligne en bien.
 *
 * Deux règles de saisie qui ne sont pas des détails :
 *
 * `possedeAvant` faux rend `valeurBruteReference` NULLE, pas zéro. Zéro voudrait dire
 * « ce bien valait zéro au mariage », ce qui déclencherait un refus pour valeur brute
 * nulle. Nul veut dire « acquis pendant l'union », donc aucune déduction à ce titre.
 *
 * Une charge fiscale laissée vide reste `undefined`, jamais zéro. Zéro voudrait dire
 * « il n'y a pas d'impôt », alors que vide veut dire « on ne l'a pas chiffré ». Le
 * moteur ne rend la seconde branche que dans le premier cas.
 */
export function ligneVersBien(l: LigneSaisie): Bien {
  return {
    libelle: l.libelle.trim() || "Bien sans nom",
    categorie: l.categorie,
    valeurBruteReference: l.possedeAvant ? nombre(l.valeurBruteReference) : null,
    detteReference: l.possedeAvant ? nombre(l.detteReference) : 0,
    valeurBrutePartage: nombre(l.valeurBrutePartage),
    dettePartage: nombre(l.dettePartage),
    partageableEnNature: l.partageableEnNature,
    chargeFiscaleLatente:
      l.chargeFiscaleLatente.trim() === "" ? undefined : nombre(l.chargeFiscaleLatente),
  };
}

export function lignesVersBiens(lignes: LigneSaisie[]): Bien[] {
  return lignes.filter(ligneRemplie).map(ligneVersBien);
}
