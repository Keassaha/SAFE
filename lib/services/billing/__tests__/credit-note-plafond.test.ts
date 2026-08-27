import { describe, it, expect } from "vitest";
import { creditRestant, depasseLePlafondDeCredit } from "../credit-note-service";

/**
 * B-02 — une facture pouvait être créditée deux fois en entier.
 *
 * Le montant n'était comparé qu'au solde de la facture, jamais à ce qui avait
 * déjà été crédité. Deux notes successives de 149,99 $ sur une facture de
 * 149,99 $ passaient toutes les deux.
 */
describe("plafond cumulé de crédit", () => {
  it("laisse passer un premier crédit jusqu'au total", () => {
    expect(depasseLePlafondDeCredit({ totalFacture: 149.99, dejaCredite: 0, montant: 149.99 }))
      .toBe(false);
  });

  it("refuse le second crédit qui ferait dépasser le total", () => {
    expect(depasseLePlafondDeCredit({ totalFacture: 149.99, dejaCredite: 149.99, montant: 149.99 }))
      .toBe(true);
  });

  it("laisse passer deux crédits partiels qui tombent juste", () => {
    expect(depasseLePlafondDeCredit({ totalFacture: 149.99, dejaCredite: 100, montant: 49.99 }))
      .toBe(false);
  });

  it("refuse un dépassement d'un cent", () => {
    expect(depasseLePlafondDeCredit({ totalFacture: 149.99, dejaCredite: 100, montant: 50 }))
      .toBe(true);
  });

  /* La tolérance joue en faveur de la demande : sans elle, une somme de
     décimales exactes au sens comptable serait refusée pour une poussière
     binaire. Voir A-03, toujours ouvert. */
  it("tolère la poussière de la virgule flottante", () => {
    const somme = 0.1 + 0.2; // 0.30000000000000004
    expect(depasseLePlafondDeCredit({ totalFacture: 0.3, dejaCredite: 0, montant: somme }))
      .toBe(false);
  });

  it("dit ce qu'il reste, jamais un montant négatif", () => {
    expect(creditRestant({ totalFacture: 149.99, dejaCredite: 100 })).toBe(49.99);
    expect(creditRestant({ totalFacture: 149.99, dejaCredite: 149.99 })).toBe(0);
    expect(creditRestant({ totalFacture: 149.99, dejaCredite: 200 })).toBe(0);
  });

  it("arrondit au cent plutôt que de traîner un flottant", () => {
    expect(creditRestant({ totalFacture: 100, dejaCredite: 33.33 })).toBe(66.67);
  });
});
