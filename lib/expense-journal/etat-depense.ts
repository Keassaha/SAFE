/**
 * SAFE — L'état d'une dépense du cabinet, et sa taxe, en mots.
 *
 * Le journal des dépenses affichait une file d'attente d'import
 * (`BankImportTransaction`) et jamais les dépenses elles-mêmes
 * (`CabinetExpense`) : l'onglet comptait 13, le tableau en montrait 0. Le
 * tableau montre maintenant les dépenses, et il doit dire de chacune deux
 * choses que l'avocate ne peut pas deviner d'un montant :
 *
 *   - où elle en est (à classer, à valider, validée) ;
 *   - si sa taxe est RÉCLAMABLE.
 *
 * La seconde est la plus importante et la moins visible. Une taxe calculée à
 * partir du montant payé n'est pas justifiable en vérification, faute du
 * montant lu sur la pièce. Le produit le sait déjà (`taxOrigin`), il ne le
 * disait nulle part dans la liste.
 *
 * Fonctions PURES : l'écran les appelle, les tests aussi.
 */

import type { ExpenseJournalValidationStatus, ExpenseTaxOrigin } from "@prisma/client";

export type EtatDepense = "a_classer" | "a_valider" | "validee";

/**
 * Une dépense sans catégorie est « à classer » quel que soit son statut : tant
 * qu'on ne sait pas ce que c'est, on ne peut ni la ventiler ni la déclarer.
 */
export function etatDepense(d: {
  statutValidation: ExpenseJournalValidationStatus;
  categoryName: string | null;
}): EtatDepense {
  if (!d.categoryName) return "a_classer";
  /* CORRIGE est une dépense validée qu'on a ensuite rectifiée : elle est
     réglée, pas en attente. La ranger dans « à valider » remettrait au travail
     une ligne déjà traitée, et gonflerait le compteur du bandeau. */
  if (d.statutValidation === "VALIDE" || d.statutValidation === "CORRIGE") return "validee";
  return "a_valider";
}

export type EtatTaxe = "confirmee" | "estimee" | "sans_taxe" | "inconnue";

/**
 * `taxOrigin` NULL ne veut PAS dire « sans taxe » : c'est une dépense
 * antérieure au calcul de taxe, dont on ne sait rien. Les confondre ferait
 * renoncer à une taxe récupérable sans que personne ne s'en aperçoive.
 */
export function etatTaxe(d: {
  taxOrigin: ExpenseTaxOrigin | null;
  tps: number | null;
  tvq: number | null;
}): EtatTaxe {
  if (d.taxOrigin === "DECLAREE") return "confirmee";
  if (d.taxOrigin === "ESTIMEE") return "estimee";
  if (d.taxOrigin === "AUCUNE") return "sans_taxe";
  return "inconnue";
}

/** La taxe totale portée par une dépense. */
export function taxeTotale(d: { tps: number | null; tvq: number | null }): number {
  return Math.round(((d.tps ?? 0) + (d.tvq ?? 0)) * 100) / 100;
}

/** Ce qui reste à faire, en deux compteurs, pour le bandeau du haut. */
export function resteAFaire(
  depenses: Array<{
    statutValidation: ExpenseJournalValidationStatus;
    categoryName: string | null;
  }>,
): { aClasser: number; aValider: number } {
  let aClasser = 0;
  let aValider = 0;
  for (const d of depenses) {
    const e = etatDepense(d);
    if (e === "a_classer") aClasser += 1;
    else if (e === "a_valider") aValider += 1;
  }
  return { aClasser, aValider };
}
