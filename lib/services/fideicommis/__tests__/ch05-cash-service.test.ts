import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * CH-05 — Chaîne des espèces, côté service.
 *
 * Ce qui est prouvé ici :
 *   1. le cumul du dossier est réellement consulté, et il déclenche le refus ;
 *   2. une exception invoquée sans justification est refusée ;
 *   3. le reçu exige les deux signatures, avec la dispense ontarienne et sans
 *      dispense québécoise ;
 *   4. la déclaration de l'art. 71 est datée à J+30, et n'existe pas en Ontario ;
 *   5. un remboursement qui devait être en espèces ne peut pas se faire autrement.
 */

let province: "QC" | "ON";
let aggregateResult: number;
let aggregateWhere: Record<string, unknown> | null = null;
let lastReceiptNumber: number | null;
let createdReceipt: Record<string, unknown> | null = null;
let receiptRow: Record<string, unknown> | null;
let createdRefund: Record<string, unknown> | null = null;

const txClient = {
  $executeRaw: vi.fn(async () => 1),
  cashReceipt: {
    findFirst: vi.fn(async () =>
      lastReceiptNumber === null ? null : { receiptNumber: lastReceiptNumber },
    ),
    create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => {
      createdReceipt = data;
      return { id: "cr-1", receiptNumber: data.receiptNumber };
    }),
  },
};

const prismaMock = {
  cabinet: { findUnique: vi.fn(async () => ({ config: JSON.stringify({ province }) })) },
  cashReceipt: {
    aggregate: vi.fn(async (args: { where: Record<string, unknown> }) => {
      aggregateWhere = args.where;
      return { _sum: { cadAmount: aggregateResult } };
    }),
    findFirst: vi.fn(async () => receiptRow),
    updateMany: vi.fn(async () => ({ count: 1 })),
    findMany: vi.fn(async () => []),
  },
  cashRefund: {
    create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => {
      createdRefund = data;
      return { id: "rf-1" };
    }),
  },
  $transaction: vi.fn(async (cb: (tx: typeof txClient) => Promise<unknown>) => cb(txClient)),
};

vi.mock("@/lib/db", () => ({ prisma: prismaMock }));
vi.mock("@/lib/services/audit", () => ({ createAuditLog: vi.fn().mockResolvedValue(undefined) }));

const BASE = {
  cabinetId: "cab1",
  clientId: "client-1",
  dossierId: "dossier-1",
  userId: "user-1",
  date: new Date("2026-06-10T00:00:00Z"),
  payerName: "Jean Tremblay",
  payerSignatureDocumentId: "sig-payeur",
  licenseeSignatureDocumentId: "sig-avocat",
};

beforeEach(() => {
  province = "QC";
  aggregateResult = 0;
  aggregateWhere = null;
  lastReceiptNumber = 12;
  createdReceipt = null;
  createdRefund = null;
  receiptRow = null;
  txClient.cashReceipt.create.mockClear();
  prismaMock.cashRefund.create.mockClear();
});

/* ════════════════════════════════════════════════════════════════
   Agrégation par dossier
   ════════════════════════════════════════════════════════════════ */

describe("Cumul des espèces par dossier", () => {
  it("consulte le cumul du DOSSIER, pas du client ni du cabinet", async () => {
    const { recordCashReceipt } = await import("../cash-service");
    await recordCashReceipt({ ...BASE, amount: 1000 });

    expect(aggregateWhere).toMatchObject({ cabinetId: "cab1", dossierId: "dossier-1" });
  });

  it("REFUSE le versement qui fait franchir le seuil au cumul", async () => {
    aggregateResult = 6000;
    const { recordCashReceipt } = await import("../cash-service");

    await expect(recordCashReceipt({ ...BASE, amount: 3000 })).rejects.toMatchObject({
      code: "CASH_THRESHOLD_EXCEEDED",
    });
    expect(txClient.cashReceipt.create).not.toHaveBeenCalled();
  });

  it("ne compte au Québec que les réceptions EN FIDÉICOMMIS", async () => {
    // L'art. 69 vise la réception en fidéicommis. Des espèces reçues en paiement
    // direct d'une facture n'entrent pas dans ce cumul.
    province = "QC";
    const { recordCashReceipt } = await import("../cash-service");
    await recordCashReceipt({ ...BASE, amount: 100 });

    expect(aggregateWhere).toMatchObject({ intoTrust: true });
  });

  it("compte en Ontario toutes les réceptions du dossier", async () => {
    // La s. 4(1) vise toute somme reçue relativement à un dossier client.
    province = "ON";
    const { recordCashReceipt } = await import("../cash-service");
    await recordCashReceipt({ ...BASE, amount: 100 });

    expect(aggregateWhere).not.toHaveProperty("intoTrust");
  });
});

/* ════════════════════════════════════════════════════════════════
   Exceptions
   ════════════════════════════════════════════════════════════════ */

describe("Exceptions au seuil", () => {
  it("ACCEPTE l'avance d'honoraires justifiée au Québec", async () => {
    aggregateResult = 0;
    const { recordCashReceipt } = await import("../cash-service");

    const r = await recordCashReceipt({
      ...BASE,
      amount: 10000,
      exemptionInvoked: "AVANCE_HONORAIRES_OU_DEBOURS",
      exemptionJustification: "Provision initiale sur le mandat de divorce.",
    });

    expect(r.receiptNumber).toBe(13);
    expect(createdReceipt?.exemptionInvoked).toBe("AVANCE_HONORAIRES_OU_DEBOURS");
  });

  it("REFUSE une exception invoquée SANS justification", async () => {
    // Une exception non justifiée est une case cochée. Le motif devient la réponse
    // du cabinet en cas d'inspection.
    const { recordCashReceipt } = await import("../cash-service");

    await expect(
      recordCashReceipt({
        ...BASE,
        amount: 10000,
        exemptionInvoked: "AVANCE_HONORAIRES_OU_DEBOURS",
      }),
    ).rejects.toMatchObject({ code: "EXEMPTION_JUSTIFICATION_REQUIRED" });
  });

  it("REFUSE une exception qui n'existe pas dans la province", async () => {
    province = "ON";
    const { recordCashReceipt } = await import("../cash-service");

    await expect(
      recordCashReceipt({
        ...BASE,
        amount: 10000,
        exemptionInvoked: "DEPOT_MISE_EN_LIBERTE",
        exemptionJustification: "Mise en liberté du client.",
      }),
    ).rejects.toMatchObject({ code: "EXEMPTION_NOT_AVAILABLE_IN_PROVINCE" });
  });

  it("mémorise l'engagement de rembourser en espèces de la s. 6(e)", async () => {
    province = "ON";
    const { recordCashReceipt } = await import("../cash-service");

    await recordCashReceipt({
      ...BASE,
      amount: 10000,
      exemptionInvoked: "HONORAIRES_DEBOURS_OU_CAUTIONNEMENT",
      exemptionJustification: "Provision sur honoraires.",
    });

    expect(createdReceipt?.refundMustBeCash).toBe(true);
  });
});

/* ════════════════════════════════════════════════════════════════
   Reçu — art. 70 al. 2 / s. 19
   ════════════════════════════════════════════════════════════════ */

describe("Signatures du reçu", () => {
  it("REFUSE au Québec un reçu sans signature du payeur", async () => {
    const { recordCashReceipt } = await import("../cash-service");

    await expect(
      recordCashReceipt({ ...BASE, amount: 500, payerSignatureDocumentId: null }),
    ).rejects.toMatchObject({ code: "PAYER_SIGNATURE_REQUIRED" });
  });

  it("REFUSE au Québec même avec un motif : la dispense n'y existe pas", async () => {
    // B-1 r.5 ne prévoit aucune dispense de signature, contrairement à la s. 19(2).
    const { recordCashReceipt } = await import("../cash-service");

    await expect(
      recordCashReceipt({
        ...BASE,
        amount: 500,
        payerSignatureDocumentId: null,
        payerSignatureWaivedReason: "Le payeur a refusé de signer.",
      }),
    ).rejects.toThrow(/art\. 70/);
  });

  it("ACCEPTE en Ontario l'absence de signature avec efforts documentés (s. 19(2))", async () => {
    province = "ON";
    const { recordCashReceipt } = await import("../cash-service");

    await recordCashReceipt({
      ...BASE,
      amount: 500,
      payerSignatureDocumentId: null,
      payerSignatureWaivedReason: "Payeur reparti avant signature ; relance écrite envoyée.",
    });

    expect(createdReceipt?.payerSignatureWaivedReason).toContain("relance écrite");
  });

  it("REFUSE en Ontario l'absence de signature SANS motif", async () => {
    province = "ON";
    const { recordCashReceipt } = await import("../cash-service");

    await expect(
      recordCashReceipt({ ...BASE, amount: 500, payerSignatureDocumentId: null }),
    ).rejects.toMatchObject({ code: "PAYER_SIGNATURE_REQUIRED" });
  });

  it("numérote les reçus sans trou", async () => {
    lastReceiptNumber = 41;
    const { recordCashReceipt } = await import("../cash-service");
    const r = await recordCashReceipt({ ...BASE, amount: 500 });
    expect(r.receiptNumber).toBe(42);
  });

  it("démarre à 1 sur un cabinet sans reçu", async () => {
    lastReceiptNumber = null;
    const { recordCashReceipt } = await import("../cash-service");
    const r = await recordCashReceipt({ ...BASE, amount: 500 });
    expect(r.receiptNumber).toBe(1);
  });
});

/* ════════════════════════════════════════════════════════════════
   Déclaration — art. 71
   ════════════════════════════════════════════════════════════════ */

describe("Déclaration au directeur de l'inspection", () => {
  it("date l'échéance à J+30 au Québec dès 7 500 $", async () => {
    const { recordCashReceipt } = await import("../cash-service");

    const r = await recordCashReceipt({
      ...BASE,
      amount: 8000,
      exemptionInvoked: "AVANCE_HONORAIRES_OU_DEBOURS",
      exemptionJustification: "Provision.",
    });

    expect(r.declarationDueAt?.toISOString().slice(0, 10)).toBe("2026-07-10");
  });

  it("n'ouvre AUCUNE échéance sous le seuil", async () => {
    const { recordCashReceipt } = await import("../cash-service");
    const r = await recordCashReceipt({ ...BASE, amount: 500 });
    expect(r.declarationDueAt).toBeNull();
  });

  it("n'ouvre AUCUNE échéance en Ontario, où l'obligation n'existe pas", async () => {
    province = "ON";
    const { recordCashReceipt } = await import("../cash-service");

    const r = await recordCashReceipt({
      ...BASE,
      amount: 20000,
      exemptionInvoked: "HONORAIRES_DEBOURS_OU_CAUTIONNEMENT",
      exemptionJustification: "Provision.",
    });

    expect(r.declarationDueAt).toBeNull();
  });
});

/* ════════════════════════════════════════════════════════════════
   Conversion — art. 73 / s. 4(2)
   ════════════════════════════════════════════════════════════════ */

describe("Espèces en devise étrangère", () => {
  it("exige un taux de conversion", async () => {
    const { recordCashReceipt } = await import("../cash-service");

    await expect(
      recordCashReceipt({ ...BASE, amount: 1000, currency: "USD" }),
    ).rejects.toThrow(/art\. 73/);
  });

  it("agrège sur le montant CONVERTI, pas sur le nominal", async () => {
    // 6 000 USD dépassent le seuil une fois convertis, alors que 6 000 est sous le
    // seuil en nominal.
    const { recordCashReceipt } = await import("../cash-service");

    await expect(
      recordCashReceipt({ ...BASE, amount: 6000, currency: "USD", conversionRate: 1.37 }),
    ).rejects.toMatchObject({ code: "CASH_THRESHOLD_EXCEEDED" });
  });
});

/* ════════════════════════════════════════════════════════════════
   Remboursement — art. 72 / s. 6(e)
   ════════════════════════════════════════════════════════════════ */

describe("Remboursement d'espèces", () => {
  it("REFUSE un remboursement autre qu'en espèces pour une somme de 7 500 $ ou plus", async () => {
    receiptRow = {
      id: "cr-1",
      cabinetId: "cab1",
      clientId: "client-1",
      dossierId: "dossier-1",
      cadAmount: 9000,
      exemptionInvoked: null,
      refunds: [],
    };
    const { recordCashRefund } = await import("../cash-service");

    await expect(
      recordCashRefund({
        cabinetId: "cab1",
        cashReceiptId: "cr-1",
        date: new Date("2026-07-01"),
        amount: 2000,
        recipientName: "Jean Tremblay",
        refundInCash: false,
        userId: "user-1",
      }),
    ).rejects.toMatchObject({ code: "REFUND_MUST_BE_CASH" });
  });

  it("ACCEPTE le même remboursement effectué en espèces (art. 72)", async () => {
    receiptRow = {
      id: "cr-1",
      cabinetId: "cab1",
      clientId: "client-1",
      dossierId: "dossier-1",
      cadAmount: 9000,
      exemptionInvoked: null,
      refunds: [],
    };
    const { recordCashRefund } = await import("../cash-service");

    await recordCashRefund({
      cabinetId: "cab1",
      cashReceiptId: "cr-1",
      date: new Date("2026-07-01"),
      amount: 2000,
      recipientName: "Jean Tremblay",
      refundInCash: true,
      userId: "user-1",
    });

    expect(createdRefund).toMatchObject({ amount: 2000, recipientName: "Jean Tremblay" });
  });

  it("REFUSE un remboursement qui dépasserait la somme reçue", async () => {
    receiptRow = {
      id: "cr-1",
      cabinetId: "cab1",
      clientId: "client-1",
      dossierId: "dossier-1",
      cadAmount: 3000,
      exemptionInvoked: null,
      refunds: [{ amount: 2500 }],
    };
    const { recordCashRefund } = await import("../cash-service");

    await expect(
      recordCashRefund({
        cabinetId: "cab1",
        cashReceiptId: "cr-1",
        date: new Date("2026-07-01"),
        amount: 1000,
        recipientName: "Jean Tremblay",
        refundInCash: true,
        userId: "user-1",
      }),
    ).rejects.toMatchObject({ code: "REFUND_EXCEEDS_RECEIPT" });
  });

  it("Ontario : l'exception s. 6(e) impose l'espèces même sur un petit montant", async () => {
    province = "ON";
    receiptRow = {
      id: "cr-1",
      cabinetId: "cab1",
      clientId: "client-1",
      dossierId: "dossier-1",
      cadAmount: 1000,
      exemptionInvoked: "HONORAIRES_DEBOURS_OU_CAUTIONNEMENT",
      refunds: [],
    };
    const { recordCashRefund } = await import("../cash-service");

    await expect(
      recordCashRefund({
        cabinetId: "cab1",
        cashReceiptId: "cr-1",
        date: new Date("2026-07-01"),
        amount: 200,
        recipientName: "Jean Tremblay",
        refundInCash: false,
        userId: "user-1",
      }),
    ).rejects.toMatchObject({ code: "REFUND_MUST_BE_CASH" });
  });
});
