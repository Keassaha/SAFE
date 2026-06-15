import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Lot 2 — Cycle de vie des débours (doctrine §5/§9).
 *  - `recalculateInvoiceTotals` fait passer les débours d'une facture
 *    FACTURE → RECOUVRE quand elle est entièrement payée, et RECOUVRE → FACTURE
 *    si elle retombe sous PAID (paiement annulé). Jamais NON_FACTURE ni RADIE.
 *  - Le KPI « Débours à récupérer » est propagé par `computeJournalKpis`.
 */

vi.mock("@/lib/db", () => ({ prisma: {} }));
vi.mock("@/lib/billing/cabinet-tax-config", () => ({
  getCabinetTaxConfigById: vi
    .fn()
    .mockResolvedValue({ province: "QC", mode: "none", rates: {} }),
}));

interface UpdateManyCall {
  where: { factureId: string; statutDebours: string };
  data: { statutDebours: string };
}

let allocatedAmount = 100;
const updateManyCalls: UpdateManyCall[] = [];

const client = {
  invoice: {
    findUnique: vi.fn(async () => ({
      id: "inv-1",
      cabinetId: "cab1",
      invoiceLines: [
        { lineType: "expense", lineSubtotal: 100, montant: 100, taxable: false, gstAmount: 0, qstAmount: 0 },
      ],
      invoiceItems: [],
      paymentAllocations: [{ allocatedAmount }],
      trustAppliedAmount: 0,
      trustApplied: 0,
      creditAppliedAmount: 0,
      client: { billingProvince: null },
    })),
    update: vi.fn(async () => ({ id: "inv-1" })),
  },
  deboursDossier: {
    updateMany: vi.fn(async (args: UpdateManyCall) => {
      updateManyCalls.push(args);
      return { count: 1 };
    }),
  },
};

beforeEach(() => {
  allocatedAmount = 100;
  updateManyCalls.length = 0;
  client.invoice.findUnique.mockClear();
  client.invoice.update.mockClear();
  client.deboursDossier.updateMany.mockClear();
});

describe("recalculateInvoiceTotals — transitions de statut des débours (Lot 2)", () => {
  it("facture entièrement payée → débours FACTURE → RECOUVRE", async () => {
    allocatedAmount = 100; // total = 100 (mode none), payé 100 → balanceDue 0 → PAID
    client.invoice.findUnique.mockResolvedValueOnce({
      id: "inv-1",
      cabinetId: "cab1",
      invoiceLines: [
        { lineType: "expense", lineSubtotal: 100, montant: 100, taxable: false, gstAmount: 0, qstAmount: 0 },
      ],
      invoiceItems: [],
      paymentAllocations: [{ allocatedAmount: 100 }],
      trustAppliedAmount: 0,
      trustApplied: 0,
      creditAppliedAmount: 0,
      client: { billingProvince: null },
    });

    const { recalculateInvoiceTotals } = await import("../invoice-service");
    await recalculateInvoiceTotals("inv-1", client as never);

    expect(updateManyCalls).toHaveLength(1);
    expect(updateManyCalls[0].where).toEqual({ factureId: "inv-1", statutDebours: "FACTURE" });
    expect(updateManyCalls[0].data).toEqual({ statutDebours: "RECOUVRE" });
  });

  it("facture partiellement payée → revert RECOUVRE → FACTURE (jamais NON_FACTURE/RADIE)", async () => {
    client.invoice.findUnique.mockResolvedValueOnce({
      id: "inv-1",
      cabinetId: "cab1",
      invoiceLines: [
        { lineType: "expense", lineSubtotal: 100, montant: 100, taxable: false, gstAmount: 0, qstAmount: 0 },
      ],
      invoiceItems: [],
      paymentAllocations: [{ allocatedAmount: 50 }], // balanceDue 50 → PARTIAL
      trustAppliedAmount: 0,
      trustApplied: 0,
      creditAppliedAmount: 0,
      client: { billingProvince: null },
    });

    const { recalculateInvoiceTotals } = await import("../invoice-service");
    await recalculateInvoiceTotals("inv-1", client as never);

    expect(updateManyCalls).toHaveLength(1);
    expect(updateManyCalls[0].where).toEqual({ factureId: "inv-1", statutDebours: "RECOUVRE" });
    expect(updateManyCalls[0].data).toEqual({ statutDebours: "FACTURE" });
  });
});

describe("computeJournalKpis — KPI « Débours à récupérer » (Lot 2)", () => {
  it("propage le montant des débours à récupérer (et 0 par défaut)", async () => {
    const { computeJournalKpis } = await import("@/lib/services/journal/kpi");
    const period = {
      from: new Date("2026-06-01"),
      to: new Date("2026-06-30"),
      prevFrom: new Date("2026-05-01"),
      prevTo: new Date("2026-05-31"),
    };

    expect(computeJournalKpis([], 0, period).deboursARecuperer).toBe(0);
    expect(computeJournalKpis([], 0, period, 432.1).deboursARecuperer).toBe(432.1);
  });
});
