import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * R-2 — Prouve que `createTrustWithdrawal` :
 *   1. acquiert un advisory lock Postgres `pg_advisory_xact_lock` sur le compte
 *      fidéicommis (clé `trust:<trustAccountId>`) AVANT toute écriture,
 *   2. (re)lit le solde DANS la transaction via `trustTransaction.aggregate`
 *      (revalidation sous verrou — ferme la fenêtre TOCTOU),
 *   3. rejette un retrait qui excède le solde découvert sous verrou, sans rien créer.
 */

interface CallLog {
  txOpened: number;
  rawCalls: string[];
  txOps: string[];
}

const log: CallLog = { txOpened: 0, rawCalls: [], txOps: [] };

let trustBalance = 1000; // solde renvoyé par l'aggregate SOUS verrou

const txClient = {
  $executeRaw: vi.fn(async (...args: unknown[]) => {
    const first = args[0];
    const strings = Array.isArray(first)
      ? (first as string[])
      : ((first as { strings?: string[] })?.strings ?? []);
    log.rawCalls.push(strings.join("?"));
    log.txOps.push("$executeRaw");
    // mémorise aussi les valeurs interpolées pour vérifier la clé de verrou
    (txClient.$executeRaw as unknown as { lastArgs?: unknown[] }).lastArgs = args;
    return 1;
  }),
  trustTransaction: {
    aggregate: vi.fn(async () => {
      log.txOps.push("trustTransaction.aggregate");
      return { _sum: { amount: trustBalance } };
    }),
    create: vi.fn(async () => {
      log.txOps.push("trustTransaction.create");
      return { id: "ttx-1" };
    }),
  },
  trustAccount: {
    update: vi.fn(async () => {
      log.txOps.push("trustAccount.update");
      return { id: "trust-acc-1" };
    }),
  },
  client: { update: vi.fn(async () => ({ id: "client-1" })) },
  dossier: { update: vi.fn(async () => ({ id: "dossier-1" })) },
};

const prismaMock = {
  invoice: { findFirst: vi.fn(async () => ({ id: "inv1", clientId: "client-1" })) },
  // CH-06 — le garde-fou d'identité lit la fiche client avant tout mouvement de
  // fonds (art. 20 B-1 r.5 / s. 22(1)(b) By-Law 7.1). Client vérifié par défaut :
  // ces suites testent les règles du fidéicommis, pas celles de l'identité.
  client: {
    findFirst: vi.fn(async () => ({
      typeClient: "personne_physique",
      identityVerified: true,
      verificationDate: new Date("2026-01-01T00:00:00Z"),
      identityExemption: null,
      firstFundsMovementAt: null,
    })),
    updateMany: vi.fn(async () => ({ count: 1 })),
  },
  // CH-00 — le service lit la province du cabinet pour localiser les messages
  // réglementaires (PR-7 : jamais un article ontarien à un cabinet québécois).
  cabinet: { findUnique: vi.fn(async () => ({ config: JSON.stringify({ province: "QC" }) })) },
  // CH-01 — le service résout le compte bancaire de l'écriture avant d'écrire.
  trustBankAccount: { findMany: vi.fn(async () => [{ id: "acc-A" }]) },
  $transaction: vi.fn(async (cb: (tx: typeof txClient) => Promise<unknown>) => {
    log.txOpened += 1;
    return cb(txClient);
  }),
};

vi.mock("@/lib/db", () => ({ prisma: prismaMock }));
vi.mock("@/lib/services/audit", () => ({
  createAuditLog: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("@/lib/services/billing/trust-service", () => ({
  getOrCreateTrustAccount: vi.fn().mockResolvedValue({ id: "trust-acc-1" }),
}));
vi.mock("@/lib/services/billing/invoice-service", () => ({
  recalculateInvoiceTotals: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("@/lib/services/journal/journal-service", () => ({
  createJournalEntry: vi.fn().mockResolvedValue({ id: "j1" }),
}));

const baseParams = {
  cabinetId: "cab1",
  clientId: "client-1",
  dossierId: "dossier-1",
  dateTransaction: new Date("2026-06-15T00:00:00Z"),
  modePaiement: "VIREMENT" as const,
  // CH-00 — le motif est désormais obligatoire (art. 56 B-1 r.5 / s. 9(1) By-Law 9).
  motive: "REMISE_CLIENT_OU_TIERS" as const,
};

beforeEach(() => {
  log.txOpened = 0;
  log.rawCalls.length = 0;
  log.txOps.length = 0;
  trustBalance = 1000;
  txClient.$executeRaw.mockClear();
  txClient.trustTransaction.aggregate.mockClear();
  txClient.trustTransaction.create.mockClear();
  txClient.trustAccount.update.mockClear();
  prismaMock.$transaction.mockClear();
});

describe("createTrustWithdrawal — verrou advisory et revalidation sous tx (R-2)", () => {
  it("acquiert un advisory lock 'trust:<id>' AVANT la création de la transaction", async () => {
    const { createTrustWithdrawal } = await import("../trust-transaction-service");

    await createTrustWithdrawal({ ...baseParams, montant: 100 });

    expect(log.txOpened).toBe(1);
    const allRawText = log.rawCalls.join(" | ");
    expect(allRawText).toContain("pg_advisory_xact_lock");

    const interpolated = ((txClient.$executeRaw as unknown as { lastArgs?: unknown[] }).lastArgs ?? [])
      .slice(1)
      .map((v) => String(v))
      .join(" | ");
    expect(interpolated).toContain("trust:trust-acc-1");

    // ordre : lock ($executeRaw) avant la création de la transaction fidéicommis
    const lockIdx = log.txOps.indexOf("$executeRaw");
    const createIdx = log.txOps.indexOf("trustTransaction.create");
    expect(lockIdx).toBeGreaterThanOrEqual(0);
    expect(createIdx).toBeGreaterThan(lockIdx);
  });

  it("relit le solde SOUS verrou via aggregate (revalidation atomique)", async () => {
    const { createTrustWithdrawal } = await import("../trust-transaction-service");

    await createTrustWithdrawal({ ...baseParams, montant: 100 });

    expect(txClient.trustTransaction.aggregate).toHaveBeenCalledTimes(1);
    const aggIdx = log.txOps.indexOf("trustTransaction.aggregate");
    const createIdx = log.txOps.indexOf("trustTransaction.create");
    expect(aggIdx).toBeLessThan(createIdx); // on lit le solde avant d'écrire
  });

  it("rejette un retrait qui excède le solde découvert sous verrou, sans rien créer", async () => {
    trustBalance = 30; // solde réel post-lock
    const { createTrustWithdrawal } = await import("../trust-transaction-service");

    // CH-00 — l'erreur porte désormais son code stable et son article (art. 59
    // B-1 r.5 / s. 9(3) By-Law 9) plutôt qu'une chaîne libre.
    await expect(
      createTrustWithdrawal({ ...baseParams, montant: 50 }),
    ).rejects.toMatchObject({ code: "INSUFFICIENT_TRUST_BALANCE" });

    expect(txClient.trustTransaction.create).not.toHaveBeenCalled();
    expect(txClient.trustAccount.update).not.toHaveBeenCalled();
  });
});
