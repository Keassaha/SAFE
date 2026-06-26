import { describe, expect, it } from "vitest";
import {
  resolveInitialAllocationAmount,
  validateAllocationRequest,
  type AllocationItem,
} from "@/lib/services/billing/payment-allocation-service";

function balances(entries: Array<[string, number]>): Map<string, number> {
  return new Map(entries);
}

describe("validateAllocationRequest — règles métier d'allocation", () => {
  it("accepte une allocation jusqu'au solde exact de la facture", () => {
    const result = validateAllocationRequest({
      paymentTotal: 100,
      alreadyAllocatedFromThisPayment: 0,
      allocations: [{ invoiceId: "inv1", allocatedAmount: 100 }],
      invoiceBalances: balances([["inv1", 100]]),
    });
    expect(result).toEqual({ ok: true, items: [{ invoiceId: "inv1", allocatedAmount: 100 }] });
  });

  it("rejette une allocation supérieure au solde dû de la facture", () => {
    const result = validateAllocationRequest({
      paymentTotal: 200,
      alreadyAllocatedFromThisPayment: 0,
      allocations: [{ invoiceId: "inv1", allocatedAmount: 150 }],
      invoiceBalances: balances([["inv1", 100]]),
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toMatch(/excède son solde dû/);
    }
  });

  it("rejette les doublons d'invoiceId dans la même requête", () => {
    const result = validateAllocationRequest({
      paymentTotal: 200,
      alreadyAllocatedFromThisPayment: 0,
      allocations: [
        { invoiceId: "inv1", allocatedAmount: 50 },
        { invoiceId: "inv1", allocatedAmount: 30 },
      ],
      invoiceBalances: balances([["inv1", 200]]),
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toMatch(/double sur la facture inv1/);
      expect(result.error).toMatch(/consolidez/);
    }
  });

  it("conserve la règle : total ≤ montant du paiement (déjà alloué inclus)", () => {
    const result = validateAllocationRequest({
      paymentTotal: 100,
      alreadyAllocatedFromThisPayment: 60,
      allocations: [{ invoiceId: "inv1", allocatedAmount: 50 }],
      invoiceBalances: balances([["inv1", 100]]),
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toMatch(/dépasse le solde non alloué du paiement/);
    }
  });

  it("rejette les montants ≤ 0 explicitement", () => {
    const result = validateAllocationRequest({
      paymentTotal: 100,
      alreadyAllocatedFromThisPayment: 0,
      allocations: [{ invoiceId: "inv1", allocatedAmount: 0 }],
      invoiceBalances: balances([["inv1", 100]]),
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toMatch(/strictement positif/);
    }
  });

  it("rejette si la facture est inconnue (pas dans la map des soldes)", () => {
    const result = validateAllocationRequest({
      paymentTotal: 100,
      alreadyAllocatedFromThisPayment: 0,
      allocations: [{ invoiceId: "inv-unknown", allocatedAmount: 50 }],
      invoiceBalances: balances([]),
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toMatch(/introuvable/);
    }
  });

  it("permet plusieurs invoiceIds distincts répartissant un paiement", () => {
    const items: AllocationItem[] = [
      { invoiceId: "inv1", allocatedAmount: 60 },
      { invoiceId: "inv2", allocatedAmount: 40 },
    ];
    const result = validateAllocationRequest({
      paymentTotal: 100,
      alreadyAllocatedFromThisPayment: 0,
      allocations: items,
      invoiceBalances: balances([["inv1", 100], ["inv2", 100]]),
    });
    expect(result).toEqual({ ok: true, items });
  });
});

describe("resolveInitialAllocationAmount — paiement saisi depuis une facture", () => {
  it("alloue automatiquement le plus petit montant entre paiement et solde dû", () => {
    expect(
      resolveInitialAllocationAmount({
        paymentAmount: 80,
        invoiceBalanceDue: 120,
      }),
    ).toBe(80);

    expect(
      resolveInitialAllocationAmount({
        paymentAmount: 150,
        invoiceBalanceDue: 120,
      }),
    ).toBe(120);
  });

  it("respecte un montant d'allocation explicite positif", () => {
    expect(
      resolveInitialAllocationAmount({
        paymentAmount: 150,
        invoiceBalanceDue: 120,
        requestedAllocatedAmount: 50,
      }),
    ).toBe(50);
  });

  it("retombe sur l'allocation automatique si le montant explicite est absent ou zéro", () => {
    expect(
      resolveInitialAllocationAmount({
        paymentAmount: 150,
        invoiceBalanceDue: 120,
        requestedAllocatedAmount: 0,
      }),
    ).toBe(120);

    expect(
      resolveInitialAllocationAmount({
        paymentAmount: 150,
        invoiceBalanceDue: 120,
        requestedAllocatedAmount: null,
      }),
    ).toBe(120);
  });

  it("n'alloue rien si la facture n'a aucun solde dû", () => {
    expect(
      resolveInitialAllocationAmount({
        paymentAmount: 100,
        invoiceBalanceDue: 0,
      }),
    ).toBe(0);
  });
});
