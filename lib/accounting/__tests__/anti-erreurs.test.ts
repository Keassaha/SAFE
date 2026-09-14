import { describe, expect, it } from "vitest";
import {
  warnPaymentWithoutInvoice,
  assertInvoiceHasClient,
  warnInvoiceWithoutDossier,
  warnUnbilledDeboursOnClosedDossier,
  warnPaymentOnUndeliveredInvoice,
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

  describe("warnPaymentOnUndeliveredInvoice", () => {
    it("avertit quand de l'argent entre sur une facture jamais transmise", () => {
      const w = warnPaymentOnUndeliveredInvoice({
        invoiceId: "inv-1",
        invoiceNumero: "2026-0039",
        deliveredAt: null,
      });
      expect(w?.code).toBe("PAYMENT_ON_UNDELIVERED_INVOICE");
      // L'écran a besoin de la facture pour offrir la déclaration sur place.
      expect(w?.invoiceId).toBe("inv-1");
      expect(w?.invoiceNumero).toBe("2026-0039");
      expect(w?.message).toContain("2026-0039");
    });

    it("n'avertit pas quand la facture a été transmise, quel que soit le canal", () => {
      expect(
        warnPaymentOnUndeliveredInvoice({
          invoiceId: "inv-1",
          invoiceNumero: "2026-0039",
          deliveredAt: new Date("2026-09-09T12:00:00Z"),
        }),
      ).toBeNull();
    });

    it("n'avertit pas quand le paiement ne vise aucune facture", () => {
      // C'est warnPaymentWithoutInvoice qui parle dans ce cas, pas celui-ci :
      // deux avertissements pour un même fait en feraient un bruit.
      expect(
        warnPaymentOnUndeliveredInvoice({ invoiceId: null, deliveredAt: null }),
      ).toBeNull();
      expect(
        warnPaymentOnUndeliveredInvoice({ deliveredAt: null }),
      ).toBeNull();
    });

    it("reste lisible quand le numéro de facture manque", () => {
      const w = warnPaymentOnUndeliveredInvoice({ invoiceId: "inv-2", deliveredAt: null });
      expect(w?.code).toBe("PAYMENT_ON_UNDELIVERED_INVOICE");
      expect(w?.invoiceNumero).toBeUndefined();
      expect(w?.message).toContain("jamais été transmise");
    });

    it("traite un numéro vide comme absent", () => {
      const w = warnPaymentOnUndeliveredInvoice({
        invoiceId: "inv-3",
        invoiceNumero: "   ",
        deliveredAt: null,
      });
      expect(w?.invoiceNumero).toBeUndefined();
    });
  });
});
