import { describe, it, expect, vi, beforeEach } from "vitest";

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: { timeEntry: { findMany: vi.fn() } },
}));
vi.mock("@/lib/db", () => ({ prisma: prismaMock }));

import { getUnbilledTimeReport } from "@/lib/services/finance/unbilled-time";

const NOW = new Date("2026-06-04T12:00:00Z");

function entry(over: Record<string, unknown>) {
  return {
    id: "e",
    date: new Date("2026-06-01T00:00:00Z"),
    montant: 100,
    feeAmount: null,
    billingStatus: "READY_TO_BILL",
    facturable: true,
    isWrittenOff: false,
    clientId: null,
    dossierId: null,
    client: null,
    dossier: null,
    ...over,
  };
}

const clientX = { raisonSociale: "ACME", prenom: null, nom: null, typeClient: "personne_morale" };
const clientY = { raisonSociale: "Beta", prenom: null, nom: null, typeClient: "personne_morale" };
const clientZ = { raisonSociale: "Zeta", prenom: null, nom: null, typeClient: "personne_morale" };

beforeEach(() => prismaMock.timeEntry.findMany.mockReset());

describe("getUnbilledTimeReport — agrégation déterministe", () => {
  it("calcule total, tranches d'âge, dormant et regroupe par dossier", async () => {
    prismaMock.timeEntry.findMany.mockResolvedValue([
      // Dossier A : 425 (feeAmount prioritaire) à 3 j + 300 à 64 j
      entry({ id: "e1", dossierId: "A", montant: 500, feeAmount: 425, date: new Date("2026-06-01T00:00:00Z"),
        dossier: { intitule: "Dossier A", numeroDossier: "A-1", clientId: "cx", client: clientX } }),
      entry({ id: "e2", dossierId: "A", montant: 300, feeAmount: null, date: new Date("2026-04-01T00:00:00Z"),
        dossier: { intitule: "Dossier A", numeroDossier: "A-1", clientId: "cx", client: clientX } }),
      // Dossier B : 800 à 154 j (dormant)
      entry({ id: "e3", dossierId: "B", montant: 1000, feeAmount: 800, date: new Date("2026-01-01T00:00:00Z"),
        dossier: { intitule: "Dossier B", numeroDossier: "B-1", clientId: "cy", client: clientY } }),
      // Sans dossier, rattaché au client Z : 200 à 15 j
      entry({ id: "e4", clientId: "cz", montant: 200, date: new Date("2026-05-20T00:00:00Z"), client: clientZ }),
    ]);

    const r = await getUnbilledTimeReport("cab1", NOW);

    expect(r.totals.montantTotal).toBe(1725);
    expect(r.totals.nbEntries).toBe(4);
    expect(r.totals.nbDossiers).toBe(3);
    expect(r.totals.montantDormant).toBe(800);
    expect(r.totals.nbDossiersDormants).toBe(1);
    expect(r.totals.plusAncienneDate).toBe("2026-01-01");

    expect(r.parTranche).toEqual({ t0_30: 625, t31_60: 0, t61_90: 300, t90plus: 800 });

    // Trié par montant décroissant : B (800) > A (725) > Z (200)
    expect(r.dossiers.map((d) => d.montant)).toEqual([800, 725, 200]);
    const dossierA = r.dossiers.find((d) => d.dossierId === "A")!;
    expect(dossierA.nbEntries).toBe(2);
    expect(dossierA.plusAncienneDate).toBe("2026-04-01");
    expect(dossierA.montantDormant).toBe(0);
  });

  it("exclut les fiches radiées (montant 0) et retourne un rapport vide si rien", async () => {
    prismaMock.timeEntry.findMany.mockResolvedValue([
      entry({ id: "w", montant: 500, isWrittenOff: true, dossierId: "A",
        dossier: { intitule: "A", numeroDossier: null, clientId: "cx", client: clientX } }),
    ]);

    const r = await getUnbilledTimeReport("cab1", NOW);
    expect(r.totals.montantTotal).toBe(0);
    expect(r.totals.nbDossiers).toBe(0);
    expect(r.dossiers).toEqual([]);
  });
});
