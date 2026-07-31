import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * CH-07 — Virements électroniques et transferts, côté service.
 *
 * Ce qui est prouvé ici :
 *   1. le régime refuse de s'appliquer hors Ontario — servir le Form 9A à un cabinet
 *      québécois inventerait une obligation ;
 *   2. une réquisition signée APRÈS la saisie est refusée : l'ordre est la substance
 *      de la s. 12(2)4 ;
 *   3. le double contrôle bloque la même personne aux deux étapes, sauf praticien
 *      véritablement seul, et l'exemption est consignée ;
 *   4. le cautionnement se calcule sur le solde maximal de l'exercice précédent ;
 *   5. un transfert entre cartes-clients sans objet est refusé — mais le transfert
 *      lui-même est PERMIS, contrairement à l'interdiction absolue d'avant.
 */

let province: "QC" | "ON";
let userCount: number;
let signatoryRow: Record<string, unknown> | null;
let delegatedAccounts: Array<{ trustBankAccountId: string }>;
let requisitionRow: Record<string, unknown> | null;
let fiscalYearEnd: string | null;
let openingSum: number;
let periodEntries: Array<{ amount: number }>;
let updateData: Record<string, unknown> | null = null;
let createdTransfer: Record<string, unknown> | null = null;

const prismaMock = {
  cabinet: {
    findUnique: vi.fn(async () => ({
      config: JSON.stringify({ province }),
      fiscalYearEnd,
    })),
  },
  user: { count: vi.fn(async () => userCount) },
  trustSignatory: {
    findUnique: vi.fn(async () => signatoryRow),
    findMany: vi.fn(async () => delegatedAccounts),
  },
  trustTransaction: {
    aggregate: vi.fn(async () => ({ _sum: { amount: openingSum } })),
    findMany: vi.fn(async () => periodEntries),
  },
  electronicTrustTransferRequisition: {
    findFirst: vi.fn(async () => requisitionRow),
    create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => ({ id: "req-1", ...data })),
    update: vi.fn(async ({ data }: { data: Record<string, unknown> }) => {
      updateData = data;
      return { id: "req-1" };
    }),
    updateMany: vi.fn(async ({ data }: { data: Record<string, unknown> }) => {
      updateData = data;
      return { count: 1 };
    }),
    findMany: vi.fn(async () => []),
  },
  clientLedgerTransfer: {
    create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => {
      createdTransfer = data;
      return { id: "clt-1" };
    }),
  },
  referralFee: {
    create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => ({ id: "rf-1", ...data })),
  },
};

vi.mock("@/lib/db", () => ({ prisma: prismaMock }));
vi.mock("@/lib/services/audit", () => ({ createAuditLog: vi.fn().mockResolvedValue(undefined) }));

const SIGNED = new Date("2026-07-10T09:00:00Z");

const REQ = {
  cabinetId: "cab1",
  trustBankAccountId: "acc-A",
  signedByUserId: "user-avocat",
  signedAt: SIGNED,
  clientName: "Tremblay",
  amount: 5000,
  recipientName: "Vendeur inc.",
  recipientInstitution: "RBC",
  recipientAccountNumber: "987654",
  purpose: "Solde de clôture",
};

beforeEach(() => {
  province = "ON";
  userCount = 3;
  signatoryRow = { isLicensee: true, authorizedTo: null, bondAmount: null, bondExpiryDate: null };
  delegatedAccounts = [{ trustBankAccountId: "acc-A" }];
  requisitionRow = { id: "req-1", signedAt: SIGNED };
  fiscalYearEnd = "12-31";
  openingSum = 0;
  periodEntries = [];
  updateData = null;
  createdTransfer = null;
  prismaMock.electronicTrustTransferRequisition.create.mockClear();
  prismaMock.clientLedgerTransfer.create.mockClear();
});

/* ════════════════════════════════════════════════════════════════
   Garde province
   ════════════════════════════════════════════════════════════════ */

describe("Applicabilité du régime", () => {
  it("REFUSE de créer une réquisition pour un cabinet québécois", async () => {
    // B-1 r.5 art. 58 permet le virement sans réquisition ni formulaire. Servir le
    // Form 9A ici inventerait une obligation.
    province = "QC";
    const { createTransferRequisition } = await import("../electronic-transfer-service");

    await expect(createTransferRequisition(REQ)).rejects.toMatchObject({
      code: "REGIME_NOT_APPLICABLE",
    });
    expect(prismaMock.electronicTrustTransferRequisition.create).not.toHaveBeenCalled();
  });

  it("cite l'art. 58 québécois dans le refus", async () => {
    province = "QC";
    const { createTransferRequisition } = await import("../electronic-transfer-service");
    await expect(createTransferRequisition(REQ)).rejects.toThrow(/art\. 58/);
  });

  it("ACCEPTE pour un cabinet ontarien", async () => {
    const { createTransferRequisition } = await import("../electronic-transfer-service");
    const r = await createTransferRequisition(REQ);
    expect(r.id).toBe("req-1");
  });

  it("REFUSE le registre des frais de renvoi hors Ontario", async () => {
    province = "QC";
    const { recordReferralFee } = await import("../electronic-transfer-service");

    await expect(
      recordReferralFee({
        cabinetId: "cab1",
        direction: "RECEIVED",
        date: SIGNED,
        method: "VIREMENT",
        amount: 500,
        counterpartyLicensee: "Me Autre",
        userId: "user-1",
      }),
    ).rejects.toMatchObject({ code: "REFERRAL_REGISTER_NOT_APPLICABLE" });
  });
});

/* ════════════════════════════════════════════════════════════════
   Ordre chronologique — s. 12(2)4
   ════════════════════════════════════════════════════════════════ */

describe("Réquisition avant saisie", () => {
  it("accepte une saisie postérieure à la signature", async () => {
    const { recordTransferExecution } = await import("../electronic-transfer-service");

    await recordTransferExecution({
      cabinetId: "cab1",
      requisitionId: "req-1",
      dataEnteredByUserId: "u1",
      dataEnteredAt: new Date("2026-07-10T10:00:00Z"),
      authorizedByUserId: "u2",
      authorizedAt: new Date("2026-07-10T10:05:00Z"),
      userId: "u1",
    });

    expect(updateData?.dataEnteredByUserId).toBe("u1");
  });

  it("REFUSE une saisie ANTÉRIEURE à la signature de la réquisition", async () => {
    // La s. 12(2)4 dit « BEFORE any data […] is entered ». Une réquisition signée
    // après coup régularise, elle ne vérifie rien.
    const { recordTransferExecution } = await import("../electronic-transfer-service");

    await expect(
      recordTransferExecution({
        cabinetId: "cab1",
        requisitionId: "req-1",
        dataEnteredByUserId: "u1",
        dataEnteredAt: new Date("2026-07-10T08:00:00Z"),
        authorizedByUserId: "u2",
        authorizedAt: new Date("2026-07-10T08:05:00Z"),
        userId: "u1",
      }),
    ).rejects.toMatchObject({ code: "REQUISITION_SIGNED_AFTER_ENTRY" });
  });
});

/* ════════════════════════════════════════════════════════════════
   Double contrôle — s. 12(2)1 et 12(3)
   ════════════════════════════════════════════════════════════════ */

describe("Double contrôle", () => {
  const exec = {
    cabinetId: "cab1",
    requisitionId: "req-1",
    dataEnteredAt: new Date("2026-07-10T10:00:00Z"),
    authorizedAt: new Date("2026-07-10T10:05:00Z"),
    userId: "u1",
  };

  it("REFUSE la même personne aux deux étapes dans un cabinet à plusieurs", async () => {
    const { recordTransferExecution } = await import("../electronic-transfer-service");

    await expect(
      recordTransferExecution({ ...exec, dataEnteredByUserId: "u1", authorizedByUserId: "u1" }),
    ).rejects.toMatchObject({ code: "SAME_PERSON_BOTH_STEPS" });
  });

  it("ADMET la même personne pour le praticien véritablement seul (s. 12(3))", async () => {
    userCount = 1;
    const { recordTransferExecution } = await import("../electronic-transfer-service");

    await recordTransferExecution({
      ...exec,
      dataEnteredByUserId: "u1",
      authorizedByUserId: "u1",
    });

    // L'exemption est CONSIGNÉE : à l'inspection, elle doit être assumée, pas découverte.
    expect(updateData?.solePractitionerExemption).toBe(true);
  });

  it("N'ADMET PAS l'exemption dès qu'il y a une deuxième personne au cabinet", async () => {
    // La s. 12(3) est exigeante : « without another licensee OR PERSON as an
    // employee ». Un avocat avec une adjointe n'est pas un praticien seul.
    userCount = 2;
    const { recordTransferExecution } = await import("../electronic-transfer-service");

    await expect(
      recordTransferExecution({ ...exec, dataEnteredByUserId: "u1", authorizedByUserId: "u1" }),
    ).rejects.toMatchObject({ code: "SAME_PERSON_BOTH_STEPS" });
  });

  it("ne marque PAS l'exemption quand deux personnes distinctes agissent", async () => {
    userCount = 1;
    const { recordTransferExecution } = await import("../electronic-transfer-service");

    await recordTransferExecution({
      ...exec,
      dataEnteredByUserId: "u1",
      authorizedByUserId: "u2",
    });

    expect(updateData?.solePractitionerExemption).toBe(false);
  });
});

/* ════════════════════════════════════════════════════════════════
   Cautionnement — s. 11(b)
   ════════════════════════════════════════════════════════════════ */

describe("Cautionnement du signataire", () => {
  it("calcule le solde maximal de l'exercice précédent en rejouant le registre", async () => {
    // Le plancher n'est pas le solde de clôture : c'est le POINT HAUT de l'exercice.
    openingSum = 1000;
    periodEntries = [{ amount: 9000 }, { amount: -7000 }, { amount: 2000 }];
    const { getMaxBalancePreviousFiscalYear } = await import("../electronic-transfer-service");

    const r = await getMaxBalancePreviousFiscalYear({
      cabinetId: "cab1",
      trustBankAccountIds: ["acc-A"],
      now: new Date("2026-07-15T00:00:00Z"),
    });

    // 1000 → 10000 → 3000 → 5000 : le maximum est 10000.
    expect(r?.amount).toBe(10000);
  });

  it("renvoie null sans fin d'exercice connue, plutôt qu'un chiffre inventé", async () => {
    fiscalYearEnd = null;
    const { getMaxBalancePreviousFiscalYear } = await import("../electronic-transfer-service");

    const r = await getMaxBalancePreviousFiscalYear({
      cabinetId: "cab1",
      trustBankAccountIds: ["acc-A"],
    });
    expect(r).toBeNull();
  });

  it("REFUSE une réquisition signée par un délégué non cautionné", async () => {
    signatoryRow = { isLicensee: false, authorizedTo: null, bondAmount: null, bondExpiryDate: null };
    openingSum = 0;
    periodEntries = [{ amount: 50000 }];
    const { createTransferRequisition } = await import("../electronic-transfer-service");

    await expect(createTransferRequisition(REQ)).rejects.toMatchObject({ code: "BOND_MISSING" });
  });

  it("REFUSE un cautionnement inférieur au solde maximal de l'exercice", async () => {
    signatoryRow = {
      isLicensee: false,
      authorizedTo: null,
      bondAmount: 10000,
      bondExpiryDate: null,
    };
    openingSum = 0;
    periodEntries = [{ amount: 50000 }];
    const { createTransferRequisition } = await import("../electronic-transfer-service");

    await expect(createTransferRequisition(REQ)).rejects.toMatchObject({
      code: "BOND_INSUFFICIENT",
    });
  });

  it("ACCEPTE un délégué suffisamment cautionné", async () => {
    signatoryRow = {
      isLicensee: false,
      authorizedTo: null,
      bondAmount: 60000,
      bondExpiryDate: new Date("2027-12-31"),
    };
    openingSum = 0;
    periodEntries = [{ amount: 50000 }];
    const { createTransferRequisition } = await import("../electronic-transfer-service");

    const r = await createTransferRequisition(REQ);
    expect(r.id).toBe("req-1");
  });
});

/* ════════════════════════════════════════════════════════════════
   Confirmation et contresignature — s. 12(2)3, 12(5)
   ════════════════════════════════════════════════════════════════ */

describe("Confirmation de l'institution", () => {
  it("signale les éléments manquants SANS refuser l'enregistrement", async () => {
    // La confirmation vient de la banque : le cabinet ne la fabrique pas. Refuser de
    // l'enregistrer parce qu'elle est incomplète priverait le dossier de la seule
    // preuve disponible.
    const { recordTransferConfirmation } = await import("../electronic-transfer-service");

    const r = await recordTransferConfirmation({
      cabinetId: "cab1",
      requisitionId: "req-1",
      confirmation: {
        sourceAccountNumber: "12345",
        confirmationSentAt: new Date("2026-07-14T16:00:00Z"),
      },
      userId: "u1",
    });

    expect(r.missingFields).toEqual(
      expect.arrayContaining(["recipientInstitution", "recipientName", "recipientAccountNumber"]),
    );
    expect(r.countersignDueAt.toISOString().slice(0, 10)).toBe("2026-07-15");
  });

  it("ouvre l'échéance de contresignature au jour bancaire suivant", async () => {
    const ferme = new Set(["2026-07-18", "2026-07-19"]);
    const { recordTransferConfirmation } = await import("../electronic-transfer-service");

    const r = await recordTransferConfirmation({
      cabinetId: "cab1",
      requisitionId: "req-1",
      confirmation: { confirmationSentAt: new Date("2026-07-17T16:00:00Z") },
      isBankingDay: (d) => !ferme.has(d.toISOString().slice(0, 10)),
      userId: "u1",
    });

    expect(r.countersignDueAt.toISOString().slice(0, 10)).toBe("2026-07-20");
  });

  it("consigne les quatre gestes de la s. 12(5) à la contresignature", async () => {
    const { countersignTransferConfirmation } = await import("../electronic-transfer-service");

    await countersignTransferConfirmation({
      cabinetId: "cab1",
      requisitionId: "req-1",
      countersignedByUserId: "user-avocat",
      countersignedAt: new Date("2026-07-15T10:00:00Z"),
      annotatedClientId: "client-1",
      annotatedDossierId: "dossier-1",
    });

    expect(updateData).toMatchObject({
      annotatedClientId: "client-1",
      countersignedByUserId: "user-avocat",
    });
    expect(updateData?.printedAt).toBeInstanceOf(Date);
    expect(updateData?.comparedAt).toBeInstanceOf(Date);
  });
});

/* ════════════════════════════════════════════════════════════════
   Transferts entre cartes-clients — s. 18(4)
   ════════════════════════════════════════════════════════════════ */

describe("Transfert entre cartes-clients", () => {
  const base = {
    cabinetId: "cab1",
    trustBankAccountId: "acc-A",
    date: SIGNED,
    amount: 1000,
    fromClientId: "client-1",
    fromDossierId: "dossier-1",
    toClientId: "client-2",
    toDossierId: "dossier-2",
    userId: "u1",
  };

  it("est PERMIS avec un objet — l'interdiction absolue était plus stricte que le texte", async () => {
    // La s. 18(4) exige le REGISTRE de ces transferts, donc les suppose. Le
    // sur-blocage poussait au contournement par retrait puis dépôt, ce qui casse le
    // lien et rend ce registre impossible à produire.
    const { recordClientLedgerTransfer } = await import("../electronic-transfer-service");

    await recordClientLedgerTransfer({ ...base, purpose: "Regroupement de deux mandats." });
    expect(createdTransfer).toMatchObject({ amount: 1000, purpose: "Regroupement de deux mandats." });
  });

  it("REFUSE un transfert sans objet (s. 18(4))", async () => {
    const { recordClientLedgerTransfer } = await import("../electronic-transfer-service");

    await expect(
      recordClientLedgerTransfer({ ...base, purpose: "   " }),
    ).rejects.toMatchObject({ code: "TRANSFER_PURPOSE_REQUIRED" });
  });

  it("REFUSE un transfert vers la même carte-client", async () => {
    const { recordClientLedgerTransfer } = await import("../electronic-transfer-service");

    await expect(
      recordClientLedgerTransfer({
        ...base,
        toClientId: "client-1",
        toDossierId: "dossier-1",
        purpose: "Test",
      }),
    ).rejects.toMatchObject({ code: "TRANSFER_SAME_LEDGER" });
  });

  it("fonctionne aussi au Québec (art. 56(3))", async () => {
    province = "QC";
    const { recordClientLedgerTransfer } = await import("../electronic-transfer-service");

    await recordClientLedgerTransfer({ ...base, purpose: "Transfert vers le dossier successoral." });
    expect(createdTransfer).toBeTruthy();
  });
});

/* ════════════════════════════════════════════════════════════════
   Frais de renvoi — s. 19.1
   ════════════════════════════════════════════════════════════════ */

describe("Frais de renvoi", () => {
  const base = {
    cabinetId: "cab1",
    date: SIGNED,
    method: "CHEQUE",
    amount: 500,
    counterpartyLicensee: "Me Autre",
    userId: "u1",
  };

  it("exige l'identifiant du document pour un frais PAYÉ (s. 19.1(2))", async () => {
    const { recordReferralFee } = await import("../electronic-transfer-service");

    await expect(
      recordReferralFee({ ...base, direction: "PAID" }),
    ).rejects.toMatchObject({ code: "REFERRAL_DOCUMENT_IDENTIFIER_REQUIRED" });
  });

  it("ne l'exige PAS pour un frais REÇU (s. 19.1(1))", async () => {
    // La s. 19.1(1) énumère date, mode, montant, titulaire et client. Elle ne
    // mentionne pas d'identifiant de document, contrairement à la s. 19.1(2).
    const { recordReferralFee } = await import("../electronic-transfer-service");

    const r = await recordReferralFee({ ...base, direction: "RECEIVED" });
    expect(r.id).toBe("rf-1");
  });
});
