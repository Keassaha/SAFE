import { describe, it, expect, vi, beforeEach } from "vitest";

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    invoice: { aggregate: vi.fn() },
    creditNote: { aggregate: vi.fn() },
    cabinetExpense: { aggregate: vi.fn() },
  },
}));
vi.mock("@/lib/db", () => ({ prisma: prismaMock }));

import { getTaxRemittance, currentQuarter } from "@/lib/services/finance/tax-remittance";

beforeEach(() => {
  prismaMock.invoice.aggregate.mockReset();
  prismaMock.creditNote.aggregate.mockReset();
  prismaMock.cabinetExpense.aggregate.mockReset();
});

describe("getTaxRemittance — à remettre = perçue − notes de crédit − crédits intrants", () => {
  it("calcule TPS et TVQ nettes", async () => {
    prismaMock.invoice.aggregate.mockResolvedValue({ _sum: { taxGst: 1000, taxQst: 1995 } });
    prismaMock.creditNote.aggregate.mockResolvedValue({ _sum: { gstCredit: 50, qstCredit: 99.75 } });
    prismaMock.cabinetExpense.aggregate.mockResolvedValue({ _sum: { tps: 200, tvq: 399 } });

    const r = await getTaxRemittance("cab1", {
      from: new Date("2026-04-01T00:00:00Z"),
      to: new Date("2026-06-30T23:59:59Z"),
    });

    expect(r.tps).toEqual({ percue: 1000, notesCredit: 50, creditsIntrants: 200, aRemettre: 750 });
    expect(r.tvq).toEqual({ percue: 1995, notesCredit: 99.75, creditsIntrants: 399, aRemettre: 1496.25 });
    expect(r.totalARemettre).toBe(2246.25);
    expect(r.periode.from).toBe("2026-04-01");
  });

  it("gère les sommes nulles (aucune donnée)", async () => {
    prismaMock.invoice.aggregate.mockResolvedValue({ _sum: { taxGst: null, taxQst: null } });
    prismaMock.creditNote.aggregate.mockResolvedValue({ _sum: { gstCredit: null, qstCredit: null } });
    prismaMock.cabinetExpense.aggregate.mockResolvedValue({ _sum: { tps: null, tvq: null } });

    const r = await getTaxRemittance("cab1", { from: new Date("2026-04-01"), to: new Date("2026-06-30") });
    expect(r.totalARemettre).toBe(0);
  });
});

describe("currentQuarter", () => {
  it("retourne le trimestre civil de la date", () => {
    const q = currentQuarter(new Date("2026-05-15T12:00:00Z"));
    expect(q.from.getFullYear()).toBe(2026);
    expect(q.from.getMonth()).toBe(3); // avril (Q2)
    expect(q.to.getMonth()).toBe(5); // juin
  });
});
