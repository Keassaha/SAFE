import { describe, it, expect } from "vitest";
import { provenanceEcriture } from "../provenance";

/** La provenance se lit dans une donnée déjà stockée, jamais devinée. */
describe("provenanceEcriture", () => {
  it("traduit le mode de paiement, jamais le mot brut de la base", () => {
    expect(provenanceEcriture({ typeTransaction: "PAIEMENT", categorie: "Paiement bank_transfer" })).toBe("Virement bancaire");
    expect(provenanceEcriture({ typeTransaction: "PAIEMENT", categorie: "Paiement e_transfer" })).toBe("Interac");
    expect(provenanceEcriture({ typeTransaction: "PAIEMENT", categorie: "Paiement trust" })).toBe("Fidéicommis");
    expect(provenanceEcriture({ typeTransaction: "PAIEMENT", categorie: "Paiement cheque" })).toBe("Chèque");
  });

  it("accepte le vocabulaire historique du schéma", () => {
    expect(provenanceEcriture({ typeTransaction: "PAIEMENT", categorie: "Paiement virement" })).toBe("Virement bancaire");
  });

  it("n'affiche rien sur une facture : la provenance y répéterait le type", () => {
    expect(provenanceEcriture({ typeTransaction: "FACTURE", categorie: "Facturation client" })).toBeNull();
  });

  it("pour une dépense, la catégorie EST la provenance", () => {
    expect(provenanceEcriture({ typeTransaction: "DEPENSE", categorie: "Frais tribunal" })).toBe("Frais tribunal");
  });

  it("un mode inconnu sort tel quel plutôt que de disparaître", () => {
    expect(provenanceEcriture({ typeTransaction: "PAIEMENT", categorie: "Paiement crypto" })).toBe("crypto");
  });

  it("sans catégorie, rien", () => {
    expect(provenanceEcriture({ typeTransaction: "PAIEMENT", categorie: null })).toBeNull();
  });
});
