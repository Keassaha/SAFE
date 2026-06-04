import { describe, it, expect, vi, beforeEach } from "vitest";

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    trustAccount: { findMany: vi.fn() },
    dossier: { findMany: vi.fn() },
    trustReconciliation: { findFirst: vi.fn() },
  },
}));
vi.mock("@/lib/db", () => ({ prisma: prismaMock }));

import { getTrustAlerts } from "@/lib/services/finance/trust-monitoring";

const NOW = new Date("2026-06-04T12:00:00Z");
const corpo = (nom: string) => ({ raisonSociale: nom, prenom: null, nom: null, typeClient: "personne_morale" });

beforeEach(() => {
  prismaMock.trustAccount.findMany.mockReset();
  prismaMock.dossier.findMany.mockReset();
  prismaMock.trustReconciliation.findFirst.mockReset();
});

describe("getTrustAlerts — surveillance fidéicommis", () => {
  it("détecte solde négatif, fonds dormant et écart de rapprochement", async () => {
    prismaMock.trustAccount.findMany.mockResolvedValue([
      { id: "A1", clientId: "x", matterId: "d1", currentBalance: -50, updatedAt: new Date("2026-06-01T00:00:00Z"), client: corpo("ACME") },
      { id: "A2", clientId: "y", matterId: "d2", currentBalance: 1000, updatedAt: new Date("2025-11-01T00:00:00Z"), client: corpo("Beta") },
      { id: "A3", clientId: "z", matterId: null, currentBalance: 500, updatedAt: new Date("2026-05-25T00:00:00Z"), client: corpo("Zeta") },
    ]);
    prismaMock.dossier.findMany.mockResolvedValue([
      { id: "d1", intitule: "Dossier 1" },
      { id: "d2", intitule: "Dossier 2" },
    ]);
    prismaMock.trustReconciliation.findFirst.mockResolvedValue({ periode: "2026-05", ecart: 12.5, status: "draft" });

    const r = await getTrustAlerts("cab1", NOW);

    expect(r.soldesNegatifs.map((a) => a.accountId)).toEqual(["A1"]);
    expect(r.soldesNegatifs[0].currentBalance).toBe(-50);
    expect(r.soldesNegatifs[0].dossierIntitule).toBe("Dossier 1");

    expect(r.fondsDormants.map((a) => a.accountId)).toEqual(["A2"]);
    expect(r.fondsDormants[0].inactifJours).toBeGreaterThan(180);

    expect(r.ecartRapprochement).toEqual({ periode: "2026-05", ecart: 12.5, status: "draft" });
    expect(r.summary).toEqual({ nbCritiques: 2, nbAvertissements: 1 });
  });

  it("aucune alerte quand soldes sains et rapprochement équilibré", async () => {
    prismaMock.trustAccount.findMany.mockResolvedValue([
      { id: "A3", clientId: "z", matterId: null, currentBalance: 500, updatedAt: new Date("2026-05-25T00:00:00Z"), client: corpo("Zeta") },
    ]);
    prismaMock.dossier.findMany.mockResolvedValue([]);
    prismaMock.trustReconciliation.findFirst.mockResolvedValue({ periode: "2026-05", ecart: 0, status: "certified" });

    const r = await getTrustAlerts("cab1", NOW);
    expect(r.soldesNegatifs).toEqual([]);
    expect(r.fondsDormants).toEqual([]);
    expect(r.ecartRapprochement).toBeNull();
    expect(r.summary).toEqual({ nbCritiques: 0, nbAvertissements: 0 });
  });
});
