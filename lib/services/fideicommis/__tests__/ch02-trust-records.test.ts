import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * CH-02 — Champs du journal de caisse et registre des chèques, côté service.
 *
 * Ferme M-13 et M-04 de l'audit. Ce qui est prouvé ici :
 *   1. les champs de l'art. 38 sont réellement persistés sur l'écriture ;
 *   2. un chèque au porteur ou à « cash » est refusé AVANT toute écriture
 *      (art. 57 al. 2 QC / s. 11(a) ON) ;
 *   3. un retrait par chèque alimente le registre de l'art. 61, sans lequel la
 *      liste des chèques en circulation de l'art. 41(2) est impossible à produire.
 */

let trustBalance: number;
let existingCheque: Record<string, unknown> | null;
let createdCheque: Record<string, unknown> | null = null;

const txClient = {
  $executeRaw: vi.fn(async () => 1),
  trustTransaction: {
    aggregate: vi.fn(async () => ({ _sum: { amount: trustBalance } })),
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
  trustBankAccount: { findMany: vi.fn(async () => [{ id: "acc-A" }]) },
  trustCheque: {
    findUnique: vi.fn(async () => existingCheque),
    create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => {
      createdCheque = data;
      return { id: "chq-1" };
    }),
    findMany: vi.fn(async () => [{ chequeNumber: 101 }, { chequeNumber: 103 }]),
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
vi.mock("@/lib/services/identity/identity-gate", () => ({
  assertIdentityForFundsMovement: vi.fn().mockResolvedValue(undefined),
}));

const DATE = new Date("2026-06-15T00:00:00Z");
const BASE = {
  cabinetId: "cab1",
  clientId: "client-1",
  dossierId: "dossier-1",
  dateTransaction: DATE,
};

beforeEach(() => {
  trustBalance = 5000;
  existingCheque = null;
  createdCheque = null;
  txClient.trustTransaction.create.mockClear();
  prismaMock.trustCheque.create.mockClear();
});

/* ════════════════════════════════════════════════════════════════
   Champs de l'art. 38 réellement persistés
   ════════════════════════════════════════════════════════════════ */

describe("Champs du journal de caisse (art. 38)", () => {
  it("persiste le payeur, l'objet et l'affectation sur une recette", async () => {
    const { createTrustDeposit } = await import("../trust-transaction-service");

    await createTrustDeposit({
      ...BASE,
      montant: 5000,
      modePaiement: "CHEQUE",
      payerName: "Jean Tremblay",
      purposeCode: "AVANCE_HONORAIRES",
      purposeText: "Provision initiale",
      fundAllocation: "Honoraires du mandat de divorce",
    });

    const data = txClient.trustTransaction.create.mock.calls[0]![0].data;
    expect(data.payerName).toBe("Jean Tremblay");
    expect(data.purposeCode).toBe("AVANCE_HONORAIRES");
    expect(data.fundAllocation).toBe("Honoraires du mandat de divorce");
  });

  it("marque l'indicateur espèces depuis le mode, sans double saisie (art. 38(1)g)", async () => {
    const { createTrustDeposit } = await import("../trust-transaction-service");

    await createTrustDeposit({ ...BASE, montant: 100, modePaiement: "ESPECES" });
    expect(txClient.trustTransaction.create.mock.calls[0]![0].data.isCash).toBe(true);

    txClient.trustTransaction.create.mockClear();
    await createTrustDeposit({ ...BASE, montant: 100, modePaiement: "VIREMENT" });
    expect(txClient.trustTransaction.create.mock.calls[0]![0].data.isCash).toBe(false);
  });

  it("consigne les DEUX dates, sans lesquelles le délai de dépôt est invérifiable", async () => {
    // Art. 50 QC (« sans délai ») / s. 7(1) ON (« immediately ») : c'est l'écart
    // entre réception et dépôt qui constitue la preuve.
    const { createTrustDeposit } = await import("../trust-transaction-service");
    const recu = new Date("2026-06-10T00:00:00Z");

    await createTrustDeposit({
      ...BASE,
      montant: 100,
      modePaiement: "CHEQUE",
      receivedAt: recu,
    });

    const data = txClient.trustTransaction.create.mock.calls[0]![0].data;
    expect(data.receivedAt).toEqual(recu);
    expect(data.depositedAt).toEqual(DATE);
  });

  it("marque les fonds reçus d'un tiers (art. 49)", async () => {
    const { createTrustDeposit } = await import("../trust-transaction-service");

    await createTrustDeposit({
      ...BASE,
      montant: 100,
      modePaiement: "VIREMENT",
      payerName: "Succession Tremblay",
      fromThirdParty: true,
    });

    expect(txClient.trustTransaction.create.mock.calls[0]![0].data.fromThirdParty).toBe(true);
  });

  it("persiste le bénéficiaire et le numéro de chèque sur un débours (art. 38(2))", async () => {
    const { createTrustWithdrawal } = await import("../trust-transaction-service");

    await createTrustWithdrawal({
      ...BASE,
      montant: 500,
      motive: "REMISE_CLIENT_OU_TIERS",
      modePaiement: "CHEQUE",
      payeeName: "Ville de Montréal",
      purposeCode: "PAIEMENT_TIERS",
      chequeNumber: 105,
    });

    const data = txClient.trustTransaction.create.mock.calls[0]![0].data;
    expect(data.payeeName).toBe("Ville de Montréal");
    expect(data.chequeNumber).toBe(105);
    expect(data.purposeCode).toBe("PAIEMENT_TIERS");
  });
});

/* ════════════════════════════════════════════════════════════════
   Bénéficiaire du chèque — art. 57 al. 2 / s. 11(a)
   ════════════════════════════════════════════════════════════════ */

describe("Bénéficiaire d'un chèque en fidéicommis", () => {
  it("REFUSE un chèque à l'ordre de « cash », avant toute écriture", async () => {
    const { createTrustWithdrawal } = await import("../trust-transaction-service");

    await expect(
      createTrustWithdrawal({
        ...BASE,
        montant: 500,
        motive: "REMISE_CLIENT_OU_TIERS",
        modePaiement: "CHEQUE",
        payeeName: "cash",
        chequeNumber: 105,
      }),
    ).rejects.toMatchObject({ code: "CHEQUE_PAYEE_INVALID" });

    expect(txClient.trustTransaction.create).not.toHaveBeenCalled();
    expect(prismaMock.trustCheque.create).not.toHaveBeenCalled();
  });

  it("REFUSE un chèque sans bénéficiaire (fait en blanc)", async () => {
    const { createTrustWithdrawal } = await import("../trust-transaction-service");

    await expect(
      createTrustWithdrawal({
        ...BASE,
        montant: 500,
        motive: "REMISE_CLIENT_OU_TIERS",
        modePaiement: "CHEQUE",
        chequeNumber: 105,
      }),
    ).rejects.toMatchObject({ code: "CHEQUE_PAYEE_INVALID" });
  });

  it("cite l'article et propose une action de remplacement (PR-2)", async () => {
    const { createTrustWithdrawal } = await import("../trust-transaction-service");

    await expect(
      createTrustWithdrawal({
        ...BASE,
        montant: 500,
        motive: "REMISE_CLIENT_OU_TIERS",
        modePaiement: "CHEQUE",
        payeeName: "au porteur",
        chequeNumber: 105,
      }),
    ).rejects.toThrow(/art\. 57/);
  });

  it("n'entrave PAS un virement sans bénéficiaire nommé", async () => {
    // La règle de l'art. 57 al. 2 vise les CHÈQUES. L'étendre au virement ajouterait
    // au règlement et bloquerait une opération licite.
    const { createTrustWithdrawal } = await import("../trust-transaction-service");

    await createTrustWithdrawal({
      ...BASE,
      montant: 500,
      motive: "REMISE_CLIENT_OU_TIERS",
      modePaiement: "VIREMENT",
    });

    expect(txClient.trustTransaction.create).toHaveBeenCalledTimes(1);
  });
});

/* ════════════════════════════════════════════════════════════════
   Registre des chèques — art. 61, 41(2)
   ════════════════════════════════════════════════════════════════ */

describe("Registre des chèques", () => {
  it("inscrit le chèque au registre après le retrait", async () => {
    const { createTrustWithdrawal } = await import("../trust-transaction-service");

    await createTrustWithdrawal({
      ...BASE,
      montant: 500,
      motive: "REMISE_CLIENT_OU_TIERS",
      modePaiement: "CHEQUE",
      payeeName: "Ville de Montréal",
      chequeNumber: 105,
    });

    expect(createdCheque).toMatchObject({
      chequeNumber: 105,
      payeeName: "Ville de Montréal",
      amount: 500,
      trustTransactionId: "ttx-1",
    });
  });

  it("n'inscrit rien au registre pour un virement", async () => {
    const { createTrustWithdrawal } = await import("../trust-transaction-service");

    await createTrustWithdrawal({
      ...BASE,
      montant: 500,
      motive: "REMISE_CLIENT_OU_TIERS",
      modePaiement: "VIREMENT",
      payeeName: "Ville de Montréal",
    });

    expect(prismaMock.trustCheque.create).not.toHaveBeenCalled();
  });

  it("REFUSE un numéro de chèque déjà utilisé sur le compte (art. 61)", async () => {
    existingCheque = {
      id: "chq-old",
      payeeName: "Autre bénéficiaire",
      issueDate: new Date("2026-05-01T00:00:00Z"),
    };
    const { registerTrustCheque } = await import("../trust-cheque-service");

    await expect(
      registerTrustCheque({
        cabinetId: "cab1",
        trustBankAccountId: "acc-A",
        chequeNumber: 105,
        issueDate: DATE,
        payeeName: "Ville de Montréal",
        amount: 500,
      }),
    ).rejects.toMatchObject({ code: "CHEQUE_NUMBER_ALREADY_USED" });
  });

  it("signale les trous dans la numérotation consécutive", async () => {
    // Le registre contient 101 et 103 : le 102 manque. Ce n'est pas nécessairement
    // une faute, mais c'est ce qu'un inspecteur cherche, et le cabinet doit pouvoir
    // l'expliquer.
    const { getChequeSequenceGaps } = await import("../trust-cheque-service");
    expect(await getChequeSequenceGaps("acc-A")).toEqual([102]);
  });
});
