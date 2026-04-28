import { describe, expect, it } from "vitest";
import {
  computeBillingTotals,
  computeInvoiceTotals,
  computeInterestAmount,
} from "@/lib/invoice-calculations";
import { calculateInterest } from "@/lib/utils/interest";

describe("computeInvoiceTotals", () => {
  it("calcule les sous-totaux, taxes et solde a payer", () => {
    const totals = computeInvoiceTotals(
      [
        { type: "honoraires", amount: 1000 },
        { type: "debours_taxable", amount: 200 },
        { type: "debours_non_taxable", amount: 50 },
        { type: "frais_rappel", amount: 25 },
        { type: "interets", amount: 10 },
      ],
      300,
      100
    );

    expect(totals.subtotalTaxable).toBe(1235);
    expect(totals.tps).toBe(61.75);
    expect(totals.tvq).toBe(123.19);
    expect(totals.totalInvoice).toBe(1469.94);
    expect(totals.balanceDue).toBe(1069.94);
  });
});

describe("computeBillingTotals", () => {
  it("integre credits, fiducie et lignes non taxables", () => {
    const totals = computeBillingTotals(
      [
        { lineType: "fee", lineSubtotal: 1000, taxable: true },
        { lineType: "expense", lineSubtotal: 200, taxable: true },
        { lineType: "adjustment", lineSubtotal: 50, taxable: true },
        { lineType: "interest", lineSubtotal: 25, taxable: true },
        { lineType: "credit", lineSubtotal: 100, taxable: false },
        { lineType: "non_taxable", lineSubtotal: 80, taxable: false },
      ],
      300,
      100,
      50
    );

    expect(totals.subtotalBeforeTax).toBe(1175);
    expect(totals.taxGst).toBe(58.75);
    expect(totals.taxQst).toBe(117.21);
    expect(totals.totalInvoiceAmount).toBe(1430.96);
    expect(totals.balanceDue).toBe(980.96);
  });
});

describe("interest helpers", () => {
  it("calcule des interets journaliers arrondis", () => {
    expect(computeInterestAmount(1000, 12, 30)).toBe(9.86);
  });

  it("retourne zero avant l'echeance et un montant apres", () => {
    const dueDate = new Date("2026-04-01T00:00:00.000Z");

    expect(
      calculateInterest(1000, 0.12, dueDate, new Date("2026-03-31T00:00:00.000Z"))
    ).toBe(0);

    expect(
      calculateInterest(1000, 0.12, dueDate, new Date("2026-04-11T00:00:00.000Z"))
    ).toBe(3.29);
  });
});
