import { describe, expect, it } from "vitest";
import {
  warnPaymentWithoutInvoice,
  assertInvoiceHasClient,
  warnInvoiceWithoutDossier,
  warnUnbilledDeboursOnClosedDossier,
} from "../anti-erreurs";

describe("anti-erreurs — contrôles de saisie comptables (Lot 4)", () => {
  describe("warnPaymentWithoutInvoice", () => {
    it("avertit quand le paiement n'a pas de facture", () => {
      expect(warnPaymentWithoutInvoice(false)?.code).toBe("PAYMENT_WITHOUT_INVOICE");
    });
    it("n'avertit pas quand une facture est associée", () => {
      expect(warnPaymentWithoutInvoice(true)).toBeNull();
    });
  });

  describe("assertInvoiceHasClient", () => {
    it("bloque une facture sans client", () => {
      expect(() => assertInvoiceHasClient({ clientId: null })).toThrow(/rattachée à un client/);
      expect(() => assertInvoiceHasClient({ clientId: "   " })).toThrow(/rattachée à un client/);
    });
    it("passe quand un client est fourni", () => {
      expect(() => assertInvoiceHasClient({ clientId: "client-1" })).not.toThrow();
    });
  });

  describe("warnInvoiceWithoutDossier", () => {
    it("avertit sans dossier", () => {
      expect(warnInvoiceWithoutDossier({ dossierId: null })?.code).toBe("INVOICE_WITHOUT_DOSSIER");
    });
    it("n'avertit pas avec dossier", () => {
      expect(warnInvoiceWithoutDossier({ dossierId: "d1" })).toBeNull();
    });
  });

  describe("warnUnbilledDeboursOnClosedDossier", () => {
    it("avertit : débours refacturable NON_FACTURE sur dossier cloturé", () => {
      const w = warnUnbilledDeboursOnClosedDossier({
        statutDebours: "NON_FACTURE",
        dossierStatut: "cloture",
        refacturable: true,
      });
      expect(w?.code).toBe("UNBILLED_DEBOURS_ON_CLOSED_DOSSIER");
    });
    it("avertit aussi sur dossier archivé", () => {
      expect(
        warnUnbilledDeboursOnClosedDossier({ statutDebours: "NON_FACTURE", dossierStatut: "archive", refacturable: true }),
      ).not.toBeNull();
    });
    it("n'avertit pas sur dossier actif", () => {
      expect(
        warnUnbilledDeboursOnClosedDossier({ statutDebours: "NON_FACTURE", dossierStatut: "actif", refacturable: true }),
      ).toBeNull();
    });
    it("n'avertit pas si déjà facturé", () => {
      expect(
        warnUnbilledDeboursOnClosedDossier({ statutDebours: "FACTURE", dossierStatut: "cloture", refacturable: true }),
      ).toBeNull();
    });
    it("n'avertit pas si non refacturable", () => {
      expect(
        warnUnbilledDeboursOnClosedDossier({ statutDebours: "NON_FACTURE", dossierStatut: "cloture", refacturable: false }),
      ).toBeNull();
    });
  });
});
