import { describe, expect, it } from "vitest";
import { creditFromBalanceDue } from "@/lib/services/billing/overpayment-service";

describe("creditFromBalanceDue — détection de surpaiement", () => {
  it("solde net négatif (trop-payé) → crédit positif", () => {
    expect(creditFromBalanceDue(-50)).toBe(50);
  });

  it("solde net nul → aucun crédit", () => {
    expect(creditFromBalanceDue(0)).toBe(0);
  });

  it("solde net positif (le client doit encore) → aucun crédit", () => {
    expect(creditFromBalanceDue(100)).toBe(0);
  });

  it("crédit net d'une note de crédit (balanceDue déjà nette) → compté", () => {
    // Facture 200, note de crédit 100 appliquée, payé 150 → balanceDue = -50
    expect(creditFromBalanceDue(-50)).toBe(50);
  });

  it("écart sous le seuil epsilon → ignoré (pas de faux surpaiement)", () => {
    expect(creditFromBalanceDue(-0.003)).toBe(0);
  });

  it("écart au-dessus du seuil → compté", () => {
    expect(creditFromBalanceDue(-0.02)).toBeCloseTo(0.02, 5);
  });
});
