import { describe, it, expect } from "vitest";
import {
  FACTURE_LISTE_TAILLE_PAGE,
  estChampTri,
  getFactureListeOrderBy,
} from "@/lib/facturation/liste-query";

/**
 * Le registre de facturation n'avait ni tri ni pagination : il chargeait
 * toutes les factures du cabinet à chaque visite, dans un ordre imposé.
 */
describe("tri du registre de facturation", () => {
  it("n'accepte que les champs qui existent vraiment", () => {
    expect(estChampTri("dateEmission")).toBe(true);
    expect(estChampTri("balanceDue")).toBe(true);
    // `statut` est dérivé de invoiceStatus + paymentStatus + échéance : trier
    // sur la colonne de la base trierait sur une valeur qui n'est plus la vérité.
    expect(estChampTri("statut")).toBe(false);
    expect(estChampTri("../../etc/passwd")).toBe(false);
    expect(estChampTri(undefined)).toBe(false);
  });

  it("trie le client sur la raison sociale PUIS sur le nom", () => {
    // Une personne physique n'a pas de raison sociale : trier sur elle seule
    // renverrait tous les particuliers en bloc, dans l'ordre d'insertion.
    expect(getFactureListeOrderBy("client", "asc")).toEqual([
      { client: { raisonSociale: "asc" } },
      { client: { nom: "asc" } },
      { client: { prenom: "asc" } },
    ]);
  });

  it("départage les ex æquo par numéro, pour que la pagination soit stable", () => {
    // Sans second critère, deux factures du même jour peuvent changer de place
    // d'une page à l'autre, et une ligne se voir deux fois ou jamais.
    expect(getFactureListeOrderBy("dateEmission", "desc")).toEqual([
      { dateEmission: "desc" },
      { numero: "desc" },
    ]);
    expect(getFactureListeOrderBy("montantTotal", "asc")).toEqual([
      { montantTotal: "asc" },
      { numero: "desc" },
    ]);
  });

  it("pagine par vingt, comme tous les registres du produit", () => {
    expect(FACTURE_LISTE_TAILLE_PAGE).toBe(20);
  });
});
