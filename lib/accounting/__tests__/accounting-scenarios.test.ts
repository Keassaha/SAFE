/**
 * Les 6 scénarios comptables exigés par la refonte, vérifiés bout-à-bout au
 * niveau des fonctions PURES (sans Prisma). Chaque scénario s'appuie sur la
 * fonction canonique réelle utilisée en production — aucun calcul dupliqué.
 */
import { describe, expect, it } from "vitest";
import { describeMovement } from "@/lib/accounting/movement-semantics";
import { computeBillingTotals, type BillingLineRow } from "@/lib/invoice-calculations";
import { derivePaymentStatus } from "@/lib/billing/payment-status";
import { creditFromBalanceDue } from "@/lib/services/billing/overpayment-service";

const feeLine = (amount: number): BillingLineRow => ({
  lineType: "fee",
  lineSubtotal: amount,
  taxable: true,
});

describe("Scénarios comptables (doctrine)", () => {
  it("1. Une facture envoyée augmente le dû (et n'est pas du cash)", () => {
    const v = describeMovement({
      typeTransaction: "FACTURE",
      sourceModule: "FACTURATION",
      montantEntree: 1000,
      montantSortie: 0,
    });
    expect(v.increasesDue).toBeGreaterThan(0);
    expect(v.cashImpact).toBe(0);
  });

  it("2. Un paiement reçu réduit le dû", () => {
    const v = describeMovement({
      typeTransaction: "PAIEMENT",
      sourceModule: "PAIEMENTS",
      montantEntree: 400,
      montantSortie: 0,
    });
    expect(v.reducesDue).toBeGreaterThan(0);
    expect(v.cashImpact).toBeGreaterThan(0);
  });

  it("3. Un paiement partiel laisse une balance due", () => {
    // Facture 100 + taxes QC, payé 50 → solde restant > 0, statut PARTIAL.
    const totals = computeBillingTotals([feeLine(100)], 50, 0, 0);
    expect(totals.balanceDue).toBeGreaterThan(0);
    expect(derivePaymentStatus(totals.balanceDue, totals.totalPaidAmount)).toBe("PARTIAL");
  });

  it("4. Un paiement complet met la facture payée", () => {
    const totals = computeBillingTotals([feeLine(100)], 0, 0, 0);
    const fullyPaid = computeBillingTotals([feeLine(100)], totals.totalInvoiceAmount, 0, 0);
    expect(fullyPaid.balanceDue).toBe(0);
    expect(derivePaymentStatus(fullyPaid.balanceDue, fullyPaid.totalPaidAmount)).toBe("PAID");
  });

  it("5. Un paiement en trop est identifié (crédit client)", () => {
    const totals = computeBillingTotals([feeLine(100)], 0, 0, 0);
    const overpaid = computeBillingTotals([feeLine(100)], totals.totalInvoiceAmount + 75, 0, 0);
    expect(overpaid.balanceDue).toBeLessThan(0);
    expect(creditFromBalanceDue(overpaid.balanceDue)).toBeCloseTo(75, 2);
    // Surpaiement compté comme PAID (solde ≤ 0), jamais comme dû résiduel.
    expect(derivePaymentStatus(overpaid.balanceDue, overpaid.totalPaidAmount)).toBe("PAID");
  });

  it("6. Le fidéicommis reste séparé de l'argent du cabinet", () => {
    const deposit = describeMovement({
      typeTransaction: "DEPOT_FIDEICOMMIS",
      sourceModule: "FIDEICOMMIS",
      montantEntree: 3000,
      montantSortie: 0,
    });
    expect(deposit.cashImpact).toBe(0);
    expect(deposit.relatedBalance).toBe("TRUST");
  });
});
