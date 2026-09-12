import { describe, it, expect } from "vitest";
import { etatDepense, etatTaxe, taxeTotale, resteAFaire } from "../etat-depense";

describe("état d'une dépense", () => {
  it("est « à classer » tant qu'elle n'a pas de catégorie", () => {
    expect(etatDepense({ statutValidation: "NOUVEAU", categoryName: null })).toBe("a_classer");
  });

  it("reste « à classer » même marquée valide, si la catégorie manque", () => {
    // Sans catégorie on ne peut ni ventiler ni déclarer : le statut ne suffit pas.
    expect(etatDepense({ statutValidation: "VALIDE", categoryName: null })).toBe("a_classer");
  });

  it("est « à valider » quand elle est classée mais pas encore validée", () => {
    expect(etatDepense({ statutValidation: "A_VALIDER", categoryName: "Loyer" })).toBe("a_valider");
    expect(etatDepense({ statutValidation: "NOUVEAU", categoryName: "Loyer" })).toBe("a_valider");
  });

  it("est « validée » quand elle est classée et validée", () => {
    expect(etatDepense({ statutValidation: "VALIDE", categoryName: "Loyer" })).toBe("validee");
  });

  it("compte une dépense corrigée comme réglée, pas comme à refaire", () => {
    expect(etatDepense({ statutValidation: "CORRIGE", categoryName: "Loyer" })).toBe("validee");
  });

  it("compte une dépense proposée comme à valider", () => {
    expect(etatDepense({ statutValidation: "PROPOSE", categoryName: "Loyer" })).toBe("a_valider");
  });
});

describe("état de la taxe", () => {
  it("dit « confirmée » quand le montant a été lu sur une pièce", () => {
    expect(etatTaxe({ taxOrigin: "DECLAREE", tps: 15, tvq: 29.93 })).toBe("confirmee");
  });

  it("dit « estimée » quand la taxe a été calculée à partir du montant payé", () => {
    expect(etatTaxe({ taxOrigin: "ESTIMEE", tps: 2.54, tvq: 5.07 })).toBe("estimee");
  });

  it("dit « sans taxe » quand l'absence de taxe est affirmée", () => {
    expect(etatTaxe({ taxOrigin: "AUCUNE", tps: 0, tvq: 0 })).toBe("sans_taxe");
  });

  it("ne confond PAS une origine inconnue avec une absence de taxe", () => {
    // Confondre les deux ferait renoncer en silence à une taxe récupérable.
    expect(etatTaxe({ taxOrigin: null, tps: 0, tvq: 0 })).toBe("inconnue");
    expect(etatTaxe({ taxOrigin: null, tps: 0, tvq: 0 })).not.toBe("sans_taxe");
  });
});

describe("taxe totale", () => {
  it("additionne TPS et TVQ", () => {
    expect(taxeTotale({ tps: 15, tvq: 29.93 })).toBe(44.93);
  });

  it("traite l'absence comme zéro", () => {
    expect(taxeTotale({ tps: null, tvq: null })).toBe(0);
  });

  it("arrondit au cent, pas au flottant", () => {
    expect(taxeTotale({ tps: 0.1, tvq: 0.2 })).toBe(0.3);
  });
});

describe("ce qui reste à faire", () => {
  it("compte zéro sur un journal vide", () => {
    expect(resteAFaire([])).toEqual({ aClasser: 0, aValider: 0 });
  });

  it("sépare ce qui est à classer de ce qui est à valider", () => {
    expect(
      resteAFaire([
        { statutValidation: "NOUVEAU", categoryName: null },
        { statutValidation: "NOUVEAU", categoryName: null },
        { statutValidation: "A_VALIDER", categoryName: "Déplacements" },
        { statutValidation: "VALIDE", categoryName: "Loyer" },
      ]),
    ).toEqual({ aClasser: 2, aValider: 1 });
  });

  it("ne compte pas deux fois la même dépense", () => {
    const r = resteAFaire([{ statutValidation: "NOUVEAU", categoryName: null }]);
    expect(r.aClasser + r.aValider).toBe(1);
  });
});
