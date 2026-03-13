import { describe, it, expect } from "vitest";
import { formatInvoiceNumero } from "../numero-facture";

describe("formatInvoiceNumero", () => {
  it("formate année et séquence en ANNEE-XXX", () => {
    expect(formatInvoiceNumero(2025, 1)).toBe("2025-001");
    expect(formatInvoiceNumero(2025, 42)).toBe("2025-042");
    expect(formatInvoiceNumero(2025, 999)).toBe("2025-999");
  });

  it("pad avec des zéros pour les petites séquences", () => {
    expect(formatInvoiceNumero(2024, 1)).toBe("2024-001");
    expect(formatInvoiceNumero(2030, 10)).toBe("2030-010");
  });
});
