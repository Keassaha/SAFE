import { describe, expect, it } from "vitest";
import {
  ONLINE_PAYMENT_SOURCE_ACCOUNT,
  ONLINE_PAYMENTS_ENABLED,
  canOfferOnlinePayment,
  isInvoiceOnlinePayable,
} from "@/lib/payments/eligibility";

/**
 * Garde-fous du paiement en ligne (ADR-012). Le test le plus important verrouille
 * l'invariant Barreau : un encaissement en ligne crédite TOUJOURS le compte
 * d'opération, jamais le fidéicommis.
 */
describe("Paiement en ligne — garde-fous (ADR-012)", () => {
  it("INVARIANT : un paiement en ligne crédite operating, jamais trust", () => {
    expect(ONLINE_PAYMENT_SOURCE_ACCOUNT).toBe("operating");
  });

  it("le flag est éteint par défaut (aucun bouton payer en prod tant qu'inactif)", () => {
    expect(ONLINE_PAYMENTS_ENABLED).toBe(false);
  });

  describe("isInvoiceOnlinePayable", () => {
    it("solde dû > 0 + statut émis → payable", () => {
      expect(isInvoiceOnlinePayable({ invoiceStatus: "ISSUED", totals: { balanceDue: 100 } })).toBe(true);
      expect(isInvoiceOnlinePayable({ invoiceStatus: "PARTIALLY_PAID", totals: { balanceDue: 50 } })).toBe(true);
      expect(isInvoiceOnlinePayable({ invoiceStatus: "OVERDUE", totals: { balanceDue: 10 } })).toBe(true);
    });

    it("solde nul ou négatif → jamais payable", () => {
      expect(isInvoiceOnlinePayable({ invoiceStatus: "ISSUED", totals: { balanceDue: 0 } })).toBe(false);
      expect(isInvoiceOnlinePayable({ invoiceStatus: "ISSUED", totals: { balanceDue: -5 } })).toBe(false);
    });

    it("brouillon, payée, annulée, créditée → jamais payable", () => {
      for (const s of ["DRAFT", "PAID", "CANCELLED", "CREDITED"]) {
        expect(isInvoiceOnlinePayable({ invoiceStatus: s, totals: { balanceDue: 100 } })).toBe(false);
      }
    });

    it("statut inconnu/legacy + solde > 0 → payable (on se fie au solde)", () => {
      expect(isInvoiceOnlinePayable({ invoiceStatus: null, totals: { balanceDue: 100 } })).toBe(true);
      expect(isInvoiceOnlinePayable({ totals: { balanceDue: 100 } })).toBe(true);
    });
  });

  describe("canOfferOnlinePayment", () => {
    it("flag éteint par défaut → jamais d'offre, même avec Connect prêt + facture payable", () => {
      expect(
        canOfferOnlinePayment({
          connectChargesEnabled: true,
          invoice: { invoiceStatus: "ISSUED", totals: { balanceDue: 100 } },
        }),
      ).toBe(false);
    });
  });
});
