import { describe, expect, it } from "vitest";
import { derivePaymentStatus } from "@/lib/billing/payment-status";

describe("derivePaymentStatus — invariant facture/paiement", () => {
  it("balanceDue = 0 → PAID", () => {
    expect(derivePaymentStatus(0, 100)).toBe("PAID");
  });

  it("balanceDue < 0 (sur-paiement) → PAID", () => {
    expect(derivePaymentStatus(-5, 105)).toBe("PAID");
  });

  it("balanceDue > 0 et totalPaid > 0 → PARTIAL", () => {
    expect(derivePaymentStatus(40, 60)).toBe("PARTIAL");
  });

  it("balanceDue > 0 et totalPaid = 0 → UNPAID", () => {
    expect(derivePaymentStatus(100, 0)).toBe("UNPAID");
  });

  it("transition PARTIAL → PAID quand allocation comble le solde", () => {
    // Avant 2e allocation : PARTIAL
    expect(derivePaymentStatus(50, 50)).toBe("PARTIAL");
    // Après 2e allocation qui solde : PAID
    expect(derivePaymentStatus(0, 100)).toBe("PAID");
  });
});
