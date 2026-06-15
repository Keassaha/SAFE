import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Lot 3 — Verrouillage de période (doctrine §9).
 *  - `createJournalEntry` refuse une écriture datée dans un mois verrouillé.
 *  - Une écriture dans une période ouverte passe normalement.
 *  - `getPeriodeFromDate` dérive bien "YYYY-MM".
 */

interface CallLog {
  txOps: string[];
}
const log: CallLog = { txOps: [] };

// Verrou présent pour la période "2026-05" uniquement.
let lockedPeriode: string | null = "2026-05";

const txClient = {
  $executeRaw: vi.fn(async () => 1),
  accountingPeriodLock: {
    findUnique: vi.fn(async (args: { where: { cabinetId_periode: { periode: string } } }) => {
      log.txOps.push("accountingPeriodLock.findUnique");
      const periode = args.where.cabinetId_periode.periode;
      return periode === lockedPeriode ? { id: "lock-1" } : null;
    }),
  },
  journalGeneralEntry: {
    findFirst: vi.fn(async () => {
      log.txOps.push("journalGeneralEntry.findFirst");
      return { solde: 0 };
    }),
    create: vi.fn(async () => {
      log.txOps.push("journalGeneralEntry.create");
      return { id: "jge-1" };
    }),
  },
};

const prismaMock = {
  $transaction: vi.fn(async (cb: (tx: typeof txClient) => Promise<unknown>) => cb(txClient)),
};

vi.mock("@/lib/db", () => ({ prisma: prismaMock }));

const baseInput = {
  cabinetId: "cab1",
  typeTransaction: "PAIEMENT" as const,
  description: "test",
  montantEntree: 100,
  montantSortie: 0,
  sourceModule: "PAIEMENTS" as const,
};

beforeEach(() => {
  log.txOps.length = 0;
  lockedPeriode = "2026-05";
  txClient.accountingPeriodLock.findUnique.mockClear();
  txClient.journalGeneralEntry.create.mockClear();
  prismaMock.$transaction.mockClear();
});

describe("createJournalEntry — garde-fou de période verrouillée (Lot 3)", () => {
  it("refuse une écriture datée dans un mois verrouillé, sans créer", async () => {
    const { createJournalEntry } = await import("../journal-service");

    await expect(
      createJournalEntry({ ...baseInput, dateTransaction: new Date(2026, 4, 15) }), // mai 2026
    ).rejects.toThrow(/verrouillée|verrouill/i);

    expect(txClient.journalGeneralEntry.create).not.toHaveBeenCalled();
  });

  it("accepte une écriture datée dans une période ouverte", async () => {
    const { createJournalEntry } = await import("../journal-service");

    const result = await createJournalEntry({
      ...baseInput,
      dateTransaction: new Date(2026, 5, 15), // juin 2026 (non verrouillé)
    });

    expect(result.id).toBe("jge-1");
    expect(txClient.journalGeneralEntry.create).toHaveBeenCalledTimes(1);
  });

  it("getPeriodeFromDate dérive le bon mois", async () => {
    const { getPeriodeFromDate } = await import("../period-lock");
    expect(getPeriodeFromDate(new Date(2026, 4, 1))).toBe("2026-05");
    expect(getPeriodeFromDate(new Date(2026, 11, 31))).toBe("2026-12");
  });
});
