import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * CH-01 — Isolation entre comptes bancaires en fidéicommis.
 *
 * Ferme M-02 de l'audit, la dette de conception la plus lourde : SAFE ne modélisait
 * pas le compte bancaire. `TrustAccount` est la carte-client, pas la banque.
 *
 * Ce qui est prouvé ici :
 *   1. une écriture porte son compte bancaire ;
 *   2. le plafond de retrait est celui du compte visé, JAMAIS la somme des comptes
 *      (s. 9(3) By-Law 9 : « more money than is held on behalf of that client IN
 *      THAT TRUST ACCOUNT ») ;
 *   3. quand le cabinet a plusieurs comptes généraux, le système refuse de choisir
 *      à sa place plutôt que d'imputer l'argent au mauvais compte.
 */

let trustBalanceByAccount: Record<string, number>;
let generalAccounts: Array<{ id: string }>;
let aggregateWhere: Record<string, unknown> | null = null;

const txClient = {
  $executeRaw: vi.fn(async () => 1),
  trustTransaction: {
    aggregate: vi.fn(async (args: { where: Record<string, unknown> }) => {
      aggregateWhere = args.where;
      const acc = args.where.trustBankAccountId as string | undefined;
      // Sans compte précisé, on additionne tout : comportement d'avant CH-01.
      const total = acc
        ? (trustBalanceByAccount[acc] ?? 0)
        : Object.values(trustBalanceByAccount).reduce((a, b) => a + b, 0);
      return { _sum: { amount: total } };
    }),
    create: vi.fn(async (_args: { data: Record<string, unknown> }) => ({ id: "ttx-1" })),
  },
  trustAccount: { update: vi.fn(async () => ({ id: "trust-acc-1" })) },
  client: { update: vi.fn(async () => ({ id: "client-1" })) },
  dossier: { update: vi.fn(async () => ({ id: "dossier-1" })) },
};

const prismaMock = {
  invoice: { findFirst: vi.fn(async () => null) },
  trustTransaction: { findFirst: vi.fn(async () => ({ id: "ttx-original" })) },
  cabinet: {
    findUnique: vi.fn(async () => ({
      config: JSON.stringify({ province: "QC" }),
      identityProofRequired: true,
      identityGateEnforcedFrom: null,
    })),
  },
  trustBankAccount: {
    findMany: vi.fn(async () => generalAccounts),
    count: vi.fn(async () => generalAccounts.length),
  },
  // CH-05 — le dépôt en espèces consulte le cumul du dossier (art. 69 QC / s. 4(1) ON).
  cashReceipt: { aggregate: vi.fn(async () => ({ _sum: { cadAmount: 0 } })) },
  $transaction: vi.fn(async (cb: (tx: typeof txClient) => Promise<unknown>) => cb(txClient)),
};

vi.mock("@/lib/db", () => ({ prisma: prismaMock }));
vi.mock("@/lib/services/audit", () => ({ createAuditLog: vi.fn().mockResolvedValue(undefined) }));
vi.mock("@/lib/services/billing/trust-service", () => ({
  getOrCreateTrustAccount: vi.fn().mockResolvedValue({ id: "trust-acc-1" }),
}));
vi.mock("@/lib/services/billing/invoice-service", () => ({
  recalculateInvoiceTotals: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("@/lib/services/journal/journal-service", () => ({
  createJournalEntry: vi.fn().mockResolvedValue({ id: "j1" }),
}));
// Le garde-fou d'identité a sa propre suite : neutralisé ici pour isoler CH-01.
vi.mock("@/lib/services/identity/identity-gate", () => ({
  assertIdentityForFundsMovement: vi.fn().mockResolvedValue(undefined),
}));

const DATE = new Date("2026-06-15T00:00:00Z");
const BASE = {
  cabinetId: "cab1",
  clientId: "client-1",
  dossierId: "dossier-1",
  dateTransaction: DATE,
  modePaiement: "VIREMENT" as const,
};

beforeEach(() => {
  // Le client détient 1 000 $ dans le compte A et 5 000 $ dans le compte B.
  trustBalanceByAccount = { "acc-A": 1000, "acc-B": 5000 };
  generalAccounts = [{ id: "acc-A" }];
  aggregateWhere = null;
  txClient.trustTransaction.create.mockClear();
  txClient.trustTransaction.aggregate.mockClear();
});

/* ════════════════════════════════════════════════════════════════
   Rattachement de l'écriture au compte
   ════════════════════════════════════════════════════════════════ */

describe("Rattachement au compte bancaire", () => {
  it("enregistre le compte fourni sur le dépôt", async () => {
    const { createTrustDeposit } = await import("../trust-transaction-service");

    await createTrustDeposit({ ...BASE, montant: 200, trustBankAccountId: "acc-B" });

    const data = txClient.trustTransaction.create.mock.calls[0]![0].data;
    expect(data.trustBankAccountId).toBe("acc-B");
  });

  it("retient l'unique compte général quand aucun n'est précisé", async () => {
    // Un cabinet solo n'a qu'un compte : lui demander de le choisir à chaque dépôt
    // serait une friction sans contrepartie réglementaire.
    const { createTrustDeposit } = await import("../trust-transaction-service");

    await createTrustDeposit({ ...BASE, montant: 200 });

    const data = txClient.trustTransaction.create.mock.calls[0]![0].data;
    expect(data.trustBankAccountId).toBe("acc-A");
  });

  it("REFUSE de choisir quand le cabinet a plusieurs comptes généraux", async () => {
    /* Ce test s'appelait déjà « REFUSE » et vérifiait l'inverse : il exigeait que
       l'écriture soit CRÉÉE, simplement sans compte. Il codifiait le défaut qu'il
       prétendait interdire (constat A-01 de l'audit).

       Une écriture sans compte est invisible au rapprochement, qui se fait compte
       par compte (art. 36 QC / s. 18(8)ii ON). Et surtout, le garde-fou de solde
       perdait son bornage : sans compte, il additionnait TOUS les comptes, donc un
       retrait sur A pouvait être autorisé par des fonds dormant sur B. */
    generalAccounts = [{ id: "acc-A" }, { id: "acc-B" }];
    const { createTrustDeposit } = await import("../trust-transaction-service");

    await expect(createTrustDeposit({ ...BASE, montant: 200 })).rejects.toMatchObject({
      code: "TRUST_BANK_ACCOUNT_AMBIGUOUS",
    });
    expect(txClient.trustTransaction.create).not.toHaveBeenCalled();
  });

  it("accepte quand le compte est désigné explicitement, même avec plusieurs comptes", async () => {
    // Le refus ne doit pas enfermer le cabinet : désigner le compte lève l'ambiguïté.
    generalAccounts = [{ id: "acc-A" }, { id: "acc-B" }];
    const { createTrustDeposit } = await import("../trust-transaction-service");

    await createTrustDeposit({ ...BASE, montant: 200, trustBankAccountId: "acc-B" });

    const data = txClient.trustTransaction.create.mock.calls[0]![0].data;
    expect(data.trustBankAccountId).toBe("acc-B");
  });

  it("le plafond du retrait est le solde DU COMPTE visé, pas la somme des comptes", async () => {
    /* s. 9(3) By-Law 9 : « shall not at any time with respect to a client withdraw
       from a trust account more money than is held on behalf of that client IN
       THAT TRUST ACCOUNT at that time ». */
    generalAccounts = [{ id: "acc-A" }, { id: "acc-B" }];
    trustBalanceByAccount = { "acc-A": 100, "acc-B": 900 };
    const { createTrustWithdrawal } = await import("../trust-transaction-service");

    // 500 $ < 1000 $ tous comptes confondus, mais > 100 $ sur le compte A.
    await expect(
      createTrustWithdrawal({
        ...BASE,
        montant: 500,
        trustBankAccountId: "acc-A",
        motive: "REMISE_CLIENT_OU_TIERS",
        modePaiement: "VIREMENT",
      }),
    ).rejects.toMatchObject({ code: "INSUFFICIENT_TRUST_BALANCE" });
    expect(txClient.trustTransaction.create).not.toHaveBeenCalled();
  });

  it("porte le compte sur le retrait et sur la correction", async () => {
    const { createTrustWithdrawal, createTrustCorrection } = await import(
      "../trust-transaction-service"
    );

    await createTrustWithdrawal({
      ...BASE,
      montant: 100,
      motive: "REMISE_CLIENT_OU_TIERS",
      trustBankAccountId: "acc-B",
    });
    expect(txClient.trustTransaction.create.mock.calls[0]![0].data.trustBankAccountId).toBe("acc-B");

    txClient.trustTransaction.create.mockClear();
    await createTrustCorrection({
      cabinetId: "cab1",
      clientId: "client-1",
      dossierId: "dossier-1",
      montant: -50,
      dateTransaction: DATE,
      correctionOfId: "ttx-original",
      description: "Correction",
      trustBankAccountId: "acc-B",
    });
    expect(txClient.trustTransaction.create.mock.calls[0]![0].data.trustBankAccountId).toBe("acc-B");
  });
});

/* ════════════════════════════════════════════════════════════════
   Le plafond de retrait est celui DU COMPTE — s. 9(3) By-Law 9
   ════════════════════════════════════════════════════════════════ */

describe("Plafond de retrait borné au compte visé", () => {
  it("borne la lecture du solde au compte de l'écriture", async () => {
    const { createTrustWithdrawal } = await import("../trust-transaction-service");

    await createTrustWithdrawal({
      ...BASE,
      montant: 100,
      motive: "REMISE_CLIENT_OU_TIERS",
      trustBankAccountId: "acc-A",
    });

    expect(aggregateWhere).toMatchObject({ trustBankAccountId: "acc-A" });
  });

  it("REFUSE un retrait couvert par un AUTRE compte du même client", async () => {
    // Le client a 1 000 $ dans A et 5 000 $ dans B, soit 6 000 $ au total. Un retrait
    // de 3 000 $ sur A doit être refusé : les 5 000 $ de B ne sont pas dans A.
    // Sans le bornage, le compte A passerait en découvert, ce qui revient à utiliser
    // les fonds d'un autre client (art. 59-60 QC / s. 9(3), 14 ON).
    const { createTrustWithdrawal } = await import("../trust-transaction-service");

    await expect(
      createTrustWithdrawal({
        ...BASE,
        montant: 3000,
        motive: "REMISE_CLIENT_OU_TIERS",
        trustBankAccountId: "acc-A",
      }),
    ).rejects.toMatchObject({ code: "INSUFFICIENT_TRUST_BALANCE" });

    expect(txClient.trustTransaction.create).not.toHaveBeenCalled();
  });

  it("ACCEPTE le même montant sur le compte qui le détient réellement", async () => {
    const { createTrustWithdrawal } = await import("../trust-transaction-service");

    await createTrustWithdrawal({
      ...BASE,
      montant: 3000,
      motive: "REMISE_CLIENT_OU_TIERS",
      trustBankAccountId: "acc-B",
    });

    expect(txClient.trustTransaction.create).toHaveBeenCalledTimes(1);
  });

  it("REFUSE une correction qui rendrait débiteur le compte visé, même si un autre est créditeur", async () => {
    const { createTrustCorrection } = await import("../trust-transaction-service");

    await expect(
      createTrustCorrection({
        cabinetId: "cab1",
        clientId: "client-1",
        dossierId: "dossier-1",
        montant: -2000,
        dateTransaction: DATE,
        correctionOfId: "ttx-original",
        description: "Correction",
        trustBankAccountId: "acc-A",
      }),
    ).rejects.toMatchObject({ code: "CORRECTION_WOULD_CREATE_DEBIT_BALANCE" });
  });
});
