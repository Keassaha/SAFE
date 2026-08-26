import type { Prisma } from "@prisma/client";

/**
 * Tri et pagination du registre de facturation.
 *
 * Vit à part du composant, comme `lib/clients/query.ts` : la page a besoin du
 * `orderBy` et le test n'a pas besoin d'un navigateur.
 *
 * Le registre chargeait jusqu'ici TOUTES les factures du cabinet, sans `take` :
 * un cabinet à quelques milliers de factures rendait la page entière à chaque
 * visite. Vingt par page, comme les autres registres du produit.
 */
export const FACTURE_LISTE_TAILLE_PAGE = 20;

/**
 * Champs triables.
 *
 * `statut` n'en est pas : le statut affiché est dérivé de `invoiceStatus`, de
 * `paymentStatus` et de la date d'échéance (voir
 * `docs/accounting/INVOICE_STATUS_NORMALIZATION.md`). Trier sur la colonne
 * `statut` de la base trierait sur une valeur qui n'est plus la vérité.
 */
export const FACTURE_CHAMPS_TRI = [
  "client",
  "dateEmission",
  "dateEcheance",
  "montantTotal",
  "balanceDue",
] as const;

export type FactureChampTri = (typeof FACTURE_CHAMPS_TRI)[number];
export type FactureOrdreTri = "asc" | "desc";

export function estChampTri(valeur: string | undefined): valeur is FactureChampTri {
  return FACTURE_CHAMPS_TRI.includes(valeur as FactureChampTri);
}

/**
 * `client` trie sur la raison sociale puis sur le nom de famille : une personne
 * physique n'a pas de raison sociale, et un tri sur elle seule renverrait tous
 * les particuliers en bloc, dans l'ordre d'insertion.
 */
export function getFactureListeOrderBy(
  champ: FactureChampTri,
  ordre: FactureOrdreTri,
): Prisma.InvoiceOrderByWithRelationInput[] {
  if (champ === "client") {
    return [
      { client: { raisonSociale: ordre } },
      { client: { nom: ordre } },
      { client: { prenom: ordre } },
    ];
  }
  return [{ [champ]: ordre }, { numero: "desc" }];
}
