import { describe, it, expect } from "vitest";
import {
  PROVISIONAL_INVOICE_PREFIX,
  formatInvoiceNumero,
  isProvisionalInvoiceNumero,
  displayInvoiceNumero,
} from "@/lib/facturation/invoice-numero-format";

describe("invoice-numero-format (helpers purs)", () => {
  describe("formatInvoiceNumero", () => {
    it("formate ANNÉE-XXX avec padding 3 chiffres", () => {
      expect(formatInvoiceNumero(2026, 1)).toBe("2026-001");
      expect(formatInvoiceNumero(2026, 42)).toBe("2026-042");
      expect(formatInvoiceNumero(2026, 137)).toBe("2026-137");
    });
  });

  describe("isProvisionalInvoiceNumero", () => {
    it("détecte un numéro provisoire", () => {
      expect(isProvisionalInvoiceNumero(`${PROVISIONAL_INVOICE_PREFIX}abc-123`)).toBe(true);
    });
    it("rejette un numéro officiel, null, undefined, vide", () => {
      expect(isProvisionalInvoiceNumero("2026-001")).toBe(false);
      expect(isProvisionalInvoiceNumero(null)).toBe(false);
      expect(isProvisionalInvoiceNumero(undefined)).toBe(false);
      expect(isProvisionalInvoiceNumero("")).toBe(false);
    });
  });

  describe("displayInvoiceNumero", () => {
    it("montre le libellé brouillon pour un provisoire ou un numéro absent", () => {
      expect(displayInvoiceNumero(`${PROVISIONAL_INVOICE_PREFIX}xyz`)).toBe("Brouillon");
      expect(displayInvoiceNumero(null)).toBe("Brouillon");
      expect(displayInvoiceNumero(undefined)).toBe("Brouillon");
    });
    it("montre le numéro officiel tel quel", () => {
      expect(displayInvoiceNumero("2026-007")).toBe("2026-007");
    });
    it("accepte un libellé brouillon localisé", () => {
      expect(displayInvoiceNumero(null, "Draft")).toBe("Draft");
      expect(displayInvoiceNumero(`${PROVISIONAL_INVOICE_PREFIX}x`, "Draft")).toBe("Draft");
      expect(displayInvoiceNumero("2026-007", "Draft")).toBe("2026-007");
    });
  });
});
