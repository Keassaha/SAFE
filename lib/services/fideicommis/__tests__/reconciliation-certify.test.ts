import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * R-1 — Prouve que `certifyReconciliation` :
 *   1. certifie quand l'écart est nul ET qu'aucun compte fidéicommis n'est négatif,
 *   2. BLOQUE si un `TrustAccount.currentBalance < 0` existe (un solde négatif masqué
 *      par l'agrégat `soldeParDossier` ne doit jamais passer la certification),
 *   3. préserve le blocage historique sur écart ≠ 0 et sur double certification.
 */

let reconciliationRow: {
  id: string;
  cabinetId: string;
  ecart: number;
  status: string;
  periode: string;
} | null;

let negativeAccounts: { id: string; clientId: string; currentBalance: number }[];

const prismaMock = {
  trustReconciliation: {
    findFirst: vi.fn(async () => reconciliationRow),
    update: vi.fn(async () => ({ id: "rec-1", status: "certified" })),
  },
  trustAccount: {
    findMany: vi.fn(async () => negativeAccounts),
  },
  accountingPeriodLock: {
    upsert: vi.fn(async () => ({ id: "lock-1" })),
  },
};

vi.mock("@/lib/db", () => ({ prisma: prismaMock }));
vi.mock("@/lib/services/audit", () => ({
  createAuditLog: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("../trust-balance-service", () => ({
  getGlobalTrustBalance: vi.fn().mockResolvedValue(0),
}));

const baseCall = { reconciliationId: "rec-1", cabinetId: "cab1", certifiedById: "user-1" };

beforeEach(() => {
  reconciliationRow = {
    id: "rec-1",
    cabinetId: "cab1",
    ecart: 0,
    status: "complete",
    periode: "2026-05",
  };
  negativeAccounts = [];
  prismaMock.trustReconciliation.findFirst.mockClear();
  prismaMock.trustReconciliation.update.mockClear();
  prismaMock.trustAccount.findMany.mockClear();
  prismaMock.accountingPeriodLock.upsert.mockClear();
});

describe("certifyReconciliation — garde-fou solde négatif par compte (R-1)", () => {
  it("certifie quand écart = 0 et aucun compte négatif", async () => {
    const { certifyReconciliation } = await import("../reconciliation-service");

    const result = await certifyReconciliation(baseCall);

    expect(prismaMock.trustAccount.findMany).toHaveBeenCalledTimes(1);
    expect(prismaMock.trustReconciliation.update).toHaveBeenCalledTimes(1);
    expect(result.status).toBe("certified");
    // Lot 3 — la certification verrouille la période du rapprochement.
    expect(prismaMock.accountingPeriodLock.upsert).toHaveBeenCalledTimes(1);
  });

  it("BLOQUE la certification si un compte fidéicommis est négatif", async () => {
    negativeAccounts = [{ id: "trust-acc-9", clientId: "client-9", currentBalance: -200 }];
    const { certifyReconciliation } = await import("../reconciliation-service");

    await expect(certifyReconciliation(baseCall)).rejects.toThrow(/negative balance/i);
    expect(prismaMock.trustReconciliation.update).not.toHaveBeenCalled();
  });

  it("préserve le blocage sur écart ≠ 0 (sans même interroger les comptes)", async () => {
    reconciliationRow = { ...reconciliationRow!, ecart: 12.5 };
    const { certifyReconciliation } = await import("../reconciliation-service");

    await expect(certifyReconciliation(baseCall)).rejects.toThrow(/discrepancy/i);
    expect(prismaMock.trustReconciliation.update).not.toHaveBeenCalled();
  });

  it("préserve le blocage sur double certification", async () => {
    reconciliationRow = { ...reconciliationRow!, status: "certified" };
    const { certifyReconciliation } = await import("../reconciliation-service");

    await expect(certifyReconciliation(baseCall)).rejects.toThrow(/already been certified/i);
    expect(prismaMock.trustReconciliation.update).not.toHaveBeenCalled();
  });
});
