import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Certification du rapprochement — garde-fous R-1 et CH-00.
 *
 * Prouve que `certifyReconciliation` :
 *   1. certifie quand les TROIS voies concordent et qu'aucune carte-client n'est débitrice ;
 *   2. BLOQUE sur un écart bancaire ≠ 0                    (art. 41(5) QC / s. 18(8) ON) ;
 *   3. BLOQUE sur un écart cartes-clients ≠ 0              (art. 41(1) QC / s. 18(8)i ON) ← CH-00, P-1 ;
 *   4. BLOQUE si une carte-client est débitrice            (art. 59-60 QC / s. 9(3), 14 ON) ;
 *   5. BLOQUE la double certification                      (PR-5, immuabilité) ;
 *   6. écrit une attestation qui n'énumère QUE les contrôles réellement exécutés (PR-3).
 *
 * Note d'implémentation : les soldes de cartes-clients sont dérivés du registre
 * append-only (`getTrustBalancesByDossier`) et NON du cache `TrustAccount.currentBalance`.
 * Comparer un cache à un autre cache ne prouve rien (PR-1) : c'est précisément le
 * défaut que CH-00 corrige. Le garde-fou R-1 (aucun solde client négatif, même
 * masqué par un agrégat sain) est conservé, mais sur une base fiable.
 */

let reconciliationRow: {
  id: string;
  cabinetId: string;
  ecart: number;
  soldeRegistre: number;
  status: string;
  periode: string;
} | null;

let ledgerLines: { clientId: string; dossierId: string | null; balance: number }[];
let updateData: Record<string, unknown> | null = null;

const prismaMock = {
  trustReconciliation: {
    findFirst: vi.fn(async () => reconciliationRow),
    findUnique: vi.fn(async () => null),
    update: vi.fn(async ({ data }: { data: Record<string, unknown> }) => {
      updateData = data;
      return { id: "rec-1", status: "certified", ...data };
    }),
  },
  cabinet: {
    findUnique: vi.fn(async () => ({ config: JSON.stringify({ province: "QC" }) })),
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
  getGlobalTrustBalance: vi.fn(async () => 0),
  getTrustBalancesByDossier: vi.fn(async () => ledgerLines),
}));

const baseCall = { reconciliationId: "rec-1", cabinetId: "cab1", certifiedById: "user-1" };

beforeEach(() => {
  reconciliationRow = {
    id: "rec-1",
    cabinetId: "cab1",
    ecart: 0,
    soldeRegistre: 1000,
    status: "complete",
    periode: "2026-05",
  };
  // Par défaut : les cartes-clients totalisent exactement le solde du registre.
  ledgerLines = [
    { clientId: "c1", dossierId: "d1", balance: 600 },
    { clientId: "c2", dossierId: "d2", balance: 400 },
  ];
  updateData = null;
  prismaMock.trustReconciliation.findFirst.mockClear();
  prismaMock.trustReconciliation.update.mockClear();
  prismaMock.accountingPeriodLock.upsert.mockClear();
});

describe("certifyReconciliation — les trois voies (CH-00)", () => {
  it("certifie quand les trois voies concordent et qu'aucune carte-client n'est débitrice", async () => {
    const { certifyReconciliation } = await import("../reconciliation-service");

    const result = await certifyReconciliation(baseCall);

    expect(prismaMock.trustReconciliation.update).toHaveBeenCalledTimes(1);
    expect(result.status).toBe("certified");
    // La certification verrouille la période : plus aucune écriture antidatée.
    expect(prismaMock.accountingPeriodLock.upsert).toHaveBeenCalledTimes(1);
  });

  it("BLOQUE sur un écart bancaire ≠ 0", async () => {
    reconciliationRow!.ecart = 12.5;
    const { certifyReconciliation } = await import("../reconciliation-service");

    await expect(certifyReconciliation(baseCall)).rejects.toMatchObject({
      code: "RECONCILIATION_BANK_DISCREPANCY",
    });
    expect(prismaMock.trustReconciliation.update).not.toHaveBeenCalled();
  });

  it("BLOQUE sur un écart entre la somme des cartes-clients et le registre (3ᵉ voie)", async () => {
    // La banque concorde parfaitement (ecart = 0), mais une écriture est rattachée
    // au mauvais dossier : la somme des cartes-clients ne tombe plus sur le registre.
    // C'est exactement le cas que l'ancienne implémentation laissait passer.
    ledgerLines = [
      { clientId: "c1", dossierId: "d1", balance: 600 },
      { clientId: "c2", dossierId: "d2", balance: 250 },
    ];
    const { certifyReconciliation } = await import("../reconciliation-service");

    await expect(certifyReconciliation(baseCall)).rejects.toMatchObject({
      code: "RECONCILIATION_LEDGER_DISCREPANCY",
    });
    expect(prismaMock.trustReconciliation.update).not.toHaveBeenCalled();
  });

  it("BLOQUE si une carte-client est débitrice, même quand l'agrégat est sain", async () => {
    // −200 compensé par +200 : l'agrégat tombe juste, un client est pourtant à découvert.
    ledgerLines = [
      { clientId: "c1", dossierId: "d1", balance: 1200 },
      { clientId: "c2", dossierId: "d2", balance: -200 },
    ];
    const { certifyReconciliation } = await import("../reconciliation-service");

    await expect(certifyReconciliation(baseCall)).rejects.toMatchObject({
      code: "RECONCILIATION_NEGATIVE_CLIENT_BALANCE",
    });
    expect(prismaMock.trustReconciliation.update).not.toHaveBeenCalled();
  });

  it("BLOQUE la double certification", async () => {
    reconciliationRow!.status = "certified";
    const { certifyReconciliation } = await import("../reconciliation-service");

    await expect(certifyReconciliation(baseCall)).rejects.toMatchObject({
      code: "RECONCILIATION_ALREADY_CERTIFIED",
    });
    expect(prismaMock.trustReconciliation.update).not.toHaveBeenCalled();
  });

  it("cite l'article applicable dans le message d'erreur", async () => {
    reconciliationRow!.ecart = 5;
    const { certifyReconciliation } = await import("../reconciliation-service");

    await expect(certifyReconciliation(baseCall)).rejects.toThrow(/B-1 r\.5/);
  });
});

describe("certifyReconciliation — attestation adossée aux contrôles (PR-3)", () => {
  it("enregistre la liste des contrôles réellement exécutés", async () => {
    const { certifyReconciliation } = await import("../reconciliation-service");
    await certifyReconciliation(baseCall);

    const controls = JSON.parse(String(updateData?.verifiedControlsJson));
    expect(controls.map((c: { id: string }) => c.id)).toEqual([
      "bank_vs_journal",
      "client_ledgers_vs_journal",
      "no_negative_client_balance",
    ]);
    expect(controls.every((c: { passed: boolean }) => c.passed)).toBe(true);
  });

  it("n'affirme dans l'attestation QUE ce qui a été vérifié", async () => {
    const { certifyReconciliation } = await import("../reconciliation-service");
    await certifyReconciliation(baseCall);

    const text = String(updateData?.declarationText);
    // Les trois contrôles exécutés y sont.
    expect(text).toContain("solde bancaire rapproché");
    expect(text).toContain("cartes-clients");
    expect(text).toContain("débiteur");
    // ... et l'attestation borne explicitement sa propre portée.
    expect(text).toContain("porte sur les seuls éléments énumérés");
    // Elle n'affirme SURTOUT PAS une conformité générale au règlement, que le
    // système n'a pas vérifiée : c'est ce que faisait l'ancien texte figé.
    expect(text).not.toMatch(/conforme au règlement/i);
  });
});
