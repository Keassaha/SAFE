import { describe, it, expect, vi, beforeEach } from "vitest";

const { prismaMock, trustMock, reconMock } = vi.hoisted(() => ({
  prismaMock: {
    dossier: { findMany: vi.fn(), count: vi.fn() },
    dossierJudgment: { findMany: vi.fn() },
    client: { count: vi.fn(), findMany: vi.fn() },
    immigrationDocument: { findMany: vi.fn() },
  },
  trustMock: vi.fn(),
  reconMock: vi.fn(),
}));
vi.mock("@/lib/db", () => ({ prisma: prismaMock }));
vi.mock("@/lib/services/finance/trust-monitoring", () => ({ getTrustAlerts: trustMock }));
vi.mock("@/lib/services/fideicommis/reconciliation-service", () => ({ getReconciliationStatus: reconMock }));

import { getSecurityAlerts } from "@/lib/services/security/security-alerts";

const NOW = new Date("2026-06-04T12:00:00Z");
const corpo = (nom: string) => ({ raisonSociale: nom, prenom: null, nom: null, typeClient: "personne_morale" });

beforeEach(() => {
  Object.values(prismaMock.dossier).forEach((f) => f.mockReset());
  prismaMock.dossierJudgment.findMany.mockReset();
  prismaMock.client.count.mockReset();
  prismaMock.client.findMany.mockReset();
  prismaMock.immigrationDocument.findMany.mockReset();
  trustMock.mockReset();
  reconMock.mockReset();
});

describe("getSecurityAlerts — agrégation des risques", () => {
  it("agrège fidéicommis, échéances et conformité avec la bonne sévérité", async () => {
    trustMock.mockResolvedValue({
      soldesNegatifs: [], fondsDormants: [], ecartRapprochement: null,
      summary: { nbCritiques: 1, nbAvertissements: 1 },
    });
    reconMock.mockResolvedValue({
      expectedPeriode: "2026-05", daysSinceMonthEnd: 30, overdue: true, critical: true, lastCertifiedPeriode: null,
    });
    // dossier.findMany : 1) IRCC  2) fintrac sample
    prismaMock.dossier.findMany
      .mockResolvedValueOnce([
        { id: "d1", intitule: "Imm A", numeroDossier: "I-1", submissionDeadline: new Date("2026-06-10T00:00:00Z"), client: corpo("ACME") },
        { id: "d0", intitule: "Imm B", numeroDossier: "I-0", submissionDeadline: new Date("2026-06-01T00:00:00Z"), client: corpo("Beta") }, // dépassée
      ])
      .mockResolvedValueOnce([{ id: "d3", intitule: "Immo", client: corpo("Gamma") }]) // fintrac sample
      .mockResolvedValueOnce([{ id: "d8", intitule: "Dossier P", client: corpo("Pi") }]); // pièces sample
    prismaMock.dossierJudgment.findMany.mockResolvedValue([
      { typeJugement: "Jugement X", dateLimiteAppel: new Date("2026-06-12T00:00:00Z"),
        dossier: { id: "d2", intitule: "Litige", numeroDossier: "L-1", client: corpo("Delta") } },
    ]);
    // client.count : identite(3), consent(0), conflit(1)
    prismaMock.client.count.mockResolvedValueOnce(3).mockResolvedValueOnce(0).mockResolvedValueOnce(1);
    // client.findMany : identite, consent, conflit
    prismaMock.client.findMany
      .mockResolvedValueOnce([{ id: "c1", raisonSociale: "ACME", prenom: null, nom: null, typeClient: "personne_morale" }])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ id: "c9", raisonSociale: "Theta", prenom: null, nom: null, typeClient: "personne_morale" }]);
    // dossier.count : fintrac(2), pieces(4)
    prismaMock.dossier.count.mockResolvedValueOnce(2).mockResolvedValueOnce(4);
    prismaMock.immigrationDocument.findMany.mockResolvedValue([
      { type: "medical", label: "Examen", expiresAt: new Date("2026-06-20T00:00:00Z"), // à venir
        dossier: { id: "d5", intitule: "Imm C", numeroDossier: "I-5", client: corpo("Eps") } },
      { type: "biometrics", label: null, expiresAt: new Date("2026-06-02T00:00:00Z"), // expiré
        dossier: { id: "d6", intitule: "Imm D", numeroDossier: "I-6", client: corpo("Zeta") } },
    ]);

    const r = await getSecurityAlerts("cab1", NOW);

    expect(r.echeances.ircc).toHaveLength(2);
    expect(r.echeances.ircc.find((e) => e.dossierId === "d0")!.joursRestants).toBeLessThan(0);
    expect(r.echeances.appels).toHaveLength(1);
    expect(r.echeances.documentsExpirant).toHaveLength(2);
    expect(r.echeances.documentsExpirant.find((d) => d.type === "biometrics")!.joursRestants).toBeLessThan(0);

    expect(r.fideicommis.rapprochementEnRetard).toEqual({ periode: "2026-05", joursDepuisFinMois: 30, critique: true });

    // critiques = trust(1) + rapprochement critique(1) + 2 dépassées (ircc d0 + doc biometrics) = 4
    expect(r.summary.nbCritiques).toBe(4);
    // avertissements = trust(1) + 3 à venir + identite(1) + fintrac(1) + conflit(1) + pieces(1) = 8
    expect(r.summary.nbAvertissements).toBe(8);

    expect(r.conformite.identiteNonVerifiee.count).toBe(3);
    expect(r.conformite.identiteNonVerifiee.sample).toHaveLength(1);
    expect(r.conformite.conflitsNonVerifies.count).toBe(1);
    expect(r.conformite.piecesManquantes.count).toBe(4);
    expect(r.conformite.consentementManquant.count).toBe(0);
    expect(r.conformite.fintracManquant.count).toBe(2);
    expect(r.conformite.fintracManquant.sample[0].label).toContain("Immo");
  });

  it("aucune alerte quand tout est sain", async () => {
    trustMock.mockResolvedValue({ soldesNegatifs: [], fondsDormants: [], ecartRapprochement: null, summary: { nbCritiques: 0, nbAvertissements: 0 } });
    reconMock.mockResolvedValue({ expectedPeriode: "2026-05", daysSinceMonthEnd: 5, overdue: false, critical: false, lastCertifiedPeriode: "2026-05" });
    prismaMock.dossier.findMany.mockResolvedValueOnce([]).mockResolvedValueOnce([]).mockResolvedValueOnce([]);
    prismaMock.dossierJudgment.findMany.mockResolvedValue([]);
    prismaMock.client.count.mockResolvedValueOnce(0).mockResolvedValueOnce(0).mockResolvedValueOnce(0);
    prismaMock.client.findMany.mockResolvedValueOnce([]).mockResolvedValueOnce([]).mockResolvedValueOnce([]);
    prismaMock.dossier.count.mockResolvedValueOnce(0).mockResolvedValueOnce(0);
    prismaMock.immigrationDocument.findMany.mockResolvedValue([]);

    const r = await getSecurityAlerts("cab1", NOW);
    expect(r.summary).toEqual({ nbCritiques: 0, nbAvertissements: 0 });
    expect(r.fideicommis.rapprochementEnRetard).toBeNull();
  });
});
