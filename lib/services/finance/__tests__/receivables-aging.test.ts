import { describe, it, expect, vi, beforeEach } from "vitest";

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: { invoice: { findMany: vi.fn() } },
}));
vi.mock("@/lib/db", () => ({ prisma: prismaMock }));

import { getReceivablesAging } from "@/lib/services/finance/receivables-aging";

const NOW = new Date("2026-06-04T12:00:00Z");
const corpo = (nom: string) => ({ raisonSociale: nom, prenom: null, nom: null, typeClient: "personne_morale" });

beforeEach(() => prismaMock.invoice.findMany.mockReset());

describe("getReceivablesAging — ventilation par ancienneté", () => {
  it("classe par tranche de retard et trie les clients par montant en retard", async () => {
    prismaMock.invoice.findMany.mockResolvedValue([
      { id: "i1", clientId: "X", balanceDue: 100, dateEcheance: new Date("2026-06-10T00:00:00Z"), client: corpo("ACME") }, // courant
      { id: "i2", clientId: "X", balanceDue: 200, dateEcheance: new Date("2026-05-20T00:00:00Z"), client: corpo("ACME") }, // 15 j
      { id: "i3", clientId: "Y", balanceDue: 500, dateEcheance: new Date("2026-02-01T00:00:00Z"), client: corpo("Beta") }, // >90 j
    ]);

    const r = await getReceivablesAging("cab1", NOW);

    expect(r.totals.totalDu).toBe(800);
    expect(r.totals.courant).toBe(100);
    expect(r.totals.enRetard).toBe(700);
    expect(r.totals.b1_30).toBe(200);
    expect(r.totals.b31_60).toBe(0);
    expect(r.totals.b61_90).toBe(0);
    expect(r.totals.b90plus).toBe(500);
    expect(r.totals.nbFactures).toBe(3);
    expect(r.totals.nbClients).toBe(2);

    expect(r.clients.map((c) => c.clientId)).toEqual(["Y", "X"]); // Y a + de retard
    const x = r.clients.find((c) => c.clientId === "X")!;
    expect(x.totalDu).toBe(300);
    expect(x.montantEnRetard).toBe(200);
    expect(x.joursRetardMax).toBe(15);
  });
});
