import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * CH-00 — Tests d'INTERDICTION du retrait en fidéicommis.
 *
 * Réf. docs/compliance/PROGRAMME_INSPECTION_READY.md §8.1.
 *
 * Chaque test tente une opération que le règlement interdit et exige qu'elle
 * échoue avec le bon code. Le rôle de cette suite est de jouer l'inspecteur : elle
 * ne vérifie pas que le système fonctionne, elle vérifie qu'il refuse.
 *
 * Ce qui était possible AVANT ce chantier, et que ces tests interdisent désormais :
 *   - retirer des honoraires sur une facture au statut brouillon ;
 *   - retirer sur une facture jamais envoyée au client ;
 *   - retirer plus que le solde dû de la facture ;
 *   - retirer avant la date d'émission de la facture ;
 *   - retirer en espèces d'un compte général en fidéicommis ;
 *   - retirer sans indiquer aucun motif réglementaire ;
 *   - passer une correction qui rend le solde d'un dossier débiteur.
 */

/* ─────────────── État manipulable par chaque test ─────────────── */

let invoiceRow: Record<string, unknown> | null;
let trustBalance: number;
let correctionTarget: { id: string } | null;
const auditLogs: Array<{ reason?: string }> = [];

const txClient = {
  $executeRaw: vi.fn(async () => 1),
  trustTransaction: {
    aggregate: vi.fn(async () => ({ _sum: { amount: trustBalance } })),
    // Argument typé : les assertions lisent `mock.calls[0][0].data`.
    create: vi.fn(async (_args: { data: Record<string, unknown> }) => ({ id: "ttx-1" })),
  },
  trustAccount: { update: vi.fn(async () => ({ id: "trust-acc-1" })) },
  client: { update: vi.fn(async () => ({ id: "client-1" })) },
  dossier: { update: vi.fn(async () => ({ id: "dossier-1" })) },
  invoice: {
    findUniqueOrThrow: vi.fn(async () => ({ trustAppliedAmount: 0, trustApplied: 0 })),
    update: vi.fn(async () => ({ id: "inv1" })),
  },
};

const prismaMock = {
  invoice: { findFirst: vi.fn(async () => invoiceRow) },
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
  trustTransaction: { findFirst: vi.fn(async () => correctionTarget) },
  cabinet: { findUnique: vi.fn(async () => ({ config: JSON.stringify({ province: "QC" }) })) },
  // CH-01 — le service résout le compte bancaire de l'écriture avant d'écrire.
  trustBankAccount: { findMany: vi.fn(async () => [{ id: "acc-A" }]) },
  // CH-05 — le dépôt en espèces consulte le cumul du dossier (art. 69 QC / s. 4(1) ON).
  cashReceipt: { aggregate: vi.fn(async () => ({ _sum: { cadAmount: 0 } })) },
  $transaction: vi.fn(async (cb: (tx: typeof txClient) => Promise<unknown>) => cb(txClient)),
};

vi.mock("@/lib/db", () => ({ prisma: prismaMock }));
vi.mock("@/lib/services/audit", () => ({
  createAuditLog: vi.fn(async (p: { metadata?: { reason?: string } }) => {
    auditLogs.push({ reason: p.metadata?.reason });
  }),
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

const WITHDRAWAL_DATE = new Date("2026-06-15T00:00:00Z");

const base = {
  cabinetId: "cab1",
  clientId: "client-1",
  dossierId: "dossier-1",
  dateTransaction: WITHDRAWAL_DATE,
  modePaiement: "VIREMENT" as const,
};

/** Facture pleinement conforme : émise, envoyée, antérieure, solde suffisant. */
function conformingInvoice(overrides: Record<string, unknown> = {}) {
  return {
    clientId: "client-1",
    numero: "F-2026-0001",
    invoiceStatus: "ISSUED",
    paymentStatus: "UNPAID",
    dateEcheance: new Date("2026-07-15T00:00:00Z"),
    dateEmission: new Date("2026-06-01T00:00:00Z"),
    sentAt: new Date("2026-06-02T00:00:00Z"),
    balanceDue: 500,
    ...overrides,
  };
}

beforeEach(() => {
  invoiceRow = conformingInvoice();
  trustBalance = 1000;
  correctionTarget = { id: "ttx-original" };
  auditLogs.length = 0;
  txClient.trustTransaction.create.mockClear();
  txClient.trustAccount.update.mockClear();
});

/* ════════════════════════════════════════════════════════════════
   Le cas conforme doit passer — sinon les interdictions ne prouvent rien
   ════════════════════════════════════════════════════════════════ */

describe("CH-00 — le retrait conforme reste possible", () => {
  it("accepte un retrait d'honoraires sur une facture émise et envoyée", async () => {
    const { createTrustWithdrawal } = await import("../trust-transaction-service");

    const { transactionId } = await createTrustWithdrawal({
      ...base,
      montant: 400,
      motive: "HONORAIRES_DEBOURS_FACTURES",
      factureId: "inv1",
    });

    expect(transactionId).toBe("ttx-1");
    expect(txClient.trustTransaction.create).toHaveBeenCalledTimes(1);
  });

  it("accepte une remise au client sans facture", async () => {
    const { createTrustWithdrawal } = await import("../trust-transaction-service");

    await createTrustWithdrawal({
      ...base,
      montant: 400,
      motive: "REMISE_CLIENT_OU_TIERS",
    });

    expect(txClient.trustTransaction.create).toHaveBeenCalledTimes(1);
  });

  it("enregistre le motif sur la transaction (art. 38(2)f — l'objet du débours)", async () => {
    const { createTrustWithdrawal } = await import("../trust-transaction-service");

    await createTrustWithdrawal({
      ...base,
      montant: 100,
      motive: "TRANSFERT_AUTRE_FIDEICOMMIS",
    });

    const call = txClient.trustTransaction.create.mock.calls[0]![0];
    expect(call.data.withdrawalMotive).toBe("TRANSFERT_AUTRE_FIDEICOMMIS");
  });
});

/* ════════════════════════════════════════════════════════════════
   Interdictions — art. 56, 57, 59 B-1 r.5 / s. 9, 11 By-Law 9
   ════════════════════════════════════════════════════════════════ */

describe("CH-00 — interdictions de retrait", () => {
  it("REFUSE un retrait d'honoraires sur une facture au statut brouillon", async () => {
    // C'était la faille la plus grave de l'audit : le service ne lisait que
    // l'appartenance au client, jamais le statut. Art. 56(2) B-1 r.5.
    invoiceRow = conformingInvoice({ invoiceStatus: "DRAFT" });
    const { createTrustWithdrawal } = await import("../trust-transaction-service");

    await expect(
      createTrustWithdrawal({
        ...base,
        montant: 400,
        motive: "HONORAIRES_DEBOURS_FACTURES",
        factureId: "inv1",
      }),
    ).rejects.toMatchObject({ code: "INVOICE_NOT_ISSUED" });

    expect(txClient.trustTransaction.create).not.toHaveBeenCalled();
    // Un refus laisse une trace : l'inspecteur veut voir la tentative, pas son absence.
    expect(auditLogs.some((l) => l.reason === "INVOICE_NOT_ISSUED")).toBe(true);
  });

  it("REFUSE un retrait sur une facture jamais envoyée au client", async () => {
    // « la facturation a été envoyée » (art. 56(2)) / « a billing has been
    // delivered » (s. 9(1)3). Émise ne suffit pas.
    invoiceRow = conformingInvoice({ sentAt: null });
    const { createTrustWithdrawal } = await import("../trust-transaction-service");

    await expect(
      createTrustWithdrawal({
        ...base,
        montant: 400,
        motive: "HONORAIRES_DEBOURS_FACTURES",
        factureId: "inv1",
      }),
    ).rejects.toMatchObject({ code: "INVOICE_NOT_DELIVERED" });

    expect(txClient.trustTransaction.create).not.toHaveBeenCalled();
  });

  it("REFUSE un retrait supérieur au solde dû de la facture", async () => {
    invoiceRow = conformingInvoice({ balanceDue: 300 });
    const { createTrustWithdrawal } = await import("../trust-transaction-service");

    await expect(
      createTrustWithdrawal({
        ...base,
        montant: 400,
        motive: "HONORAIRES_DEBOURS_FACTURES",
        factureId: "inv1",
      }),
    ).rejects.toMatchObject({ code: "INVOICE_AMOUNT_EXCEEDED" });
  });

  it("REFUSE un retrait antérieur à l'émission de la facture", async () => {
    invoiceRow = conformingInvoice({ dateEmission: new Date("2026-07-01T00:00:00Z") });
    const { createTrustWithdrawal } = await import("../trust-transaction-service");

    await expect(
      createTrustWithdrawal({
        ...base,
        montant: 400,
        motive: "HONORAIRES_DEBOURS_FACTURES",
        factureId: "inv1",
      }),
    ).rejects.toMatchObject({ code: "INVOICE_DATED_AFTER_WITHDRAWAL" });
  });

  it("REFUSE d'appliquer le fidéicommis d'un client à la facture d'un autre", async () => {
    invoiceRow = conformingInvoice({ clientId: "un-autre-client" });
    const { createTrustWithdrawal } = await import("../trust-transaction-service");

    await expect(
      createTrustWithdrawal({
        ...base,
        montant: 400,
        motive: "HONORAIRES_DEBOURS_FACTURES",
        factureId: "inv1",
      }),
    ).rejects.toMatchObject({ code: "TRUST_CROSS_ALLOCATION_BLOCKED" });
  });

  it("REFUSE un retrait en espèces (art. 57 B-1 r.5 / s. 11 By-Law 9)", async () => {
    const { createTrustWithdrawal } = await import("../trust-transaction-service");

    await expect(
      createTrustWithdrawal({
        ...base,
        montant: 100,
        motive: "REMISE_CLIENT_OU_TIERS",
        modePaiement: "ESPECES" as never,
      }),
    ).rejects.toMatchObject({ code: "CASH_WITHDRAWAL_PROHIBITED" });

    expect(txClient.trustTransaction.create).not.toHaveBeenCalled();
    expect(auditLogs.some((l) => l.reason === "CASH_WITHDRAWAL_PROHIBITED")).toBe(true);
  });

  it("REFUSE un retrait sans motif réglementaire", async () => {
    const { createTrustWithdrawal } = await import("../trust-transaction-service");

    await expect(
      createTrustWithdrawal({
        ...base,
        montant: 100,
        motive: undefined as never,
      }),
    ).rejects.toMatchObject({ code: "WITHDRAWAL_MOTIVE_REQUIRED" });
  });

  it("REFUSE un motif « honoraires facturés » sans facture rattachée", async () => {
    const { createTrustWithdrawal } = await import("../trust-transaction-service");

    await expect(
      createTrustWithdrawal({
        ...base,
        montant: 100,
        motive: "HONORAIRES_DEBOURS_FACTURES",
      }),
    ).rejects.toMatchObject({ code: "WITHDRAWAL_MOTIVE_REQUIRES_INVOICE" });
  });

  it("REFUSE un retrait qui excède le solde du dossier (art. 59)", async () => {
    trustBalance = 50;
    const { createTrustWithdrawal } = await import("../trust-transaction-service");

    await expect(
      createTrustWithdrawal({ ...base, montant: 100, motive: "REMISE_CLIENT_OU_TIERS" }),
    ).rejects.toMatchObject({ code: "INSUFFICIENT_TRUST_BALANCE" });

    expect(txClient.trustTransaction.create).not.toHaveBeenCalled();
  });
});

/* ════════════════════════════════════════════════════════════════
   Correction — art. 59, 60 B-1 r.5 / s. 9(3), 14 By-Law 9
   ════════════════════════════════════════════════════════════════ */

describe("CH-00 — la correction ne peut pas créer de solde débiteur", () => {
  it("REFUSE une correction négative qui rendrait le dossier débiteur", async () => {
    trustBalance = 100;
    const { createTrustCorrection } = await import("../trust-transaction-service");

    await expect(
      createTrustCorrection({
        cabinetId: "cab1",
        clientId: "client-1",
        dossierId: "dossier-1",
        montant: -250,
        dateTransaction: WITHDRAWAL_DATE,
        correctionOfId: "ttx-original",
        description: "Correction de saisie",
      }),
    ).rejects.toMatchObject({ code: "CORRECTION_WOULD_CREATE_DEBIT_BALANCE" });

    expect(txClient.trustTransaction.create).not.toHaveBeenCalled();
  });

  it("accepte une correction négative qui laisse le solde positif", async () => {
    trustBalance = 300;
    const { createTrustCorrection } = await import("../trust-transaction-service");

    await createTrustCorrection({
      cabinetId: "cab1",
      clientId: "client-1",
      dossierId: "dossier-1",
      montant: -250,
      dateTransaction: WITHDRAWAL_DATE,
      correctionOfId: "ttx-original",
      description: "Correction de saisie",
    });

    expect(txClient.trustTransaction.create).toHaveBeenCalledTimes(1);
  });

  it("pose le verrou consultatif avant d'écrire la correction", async () => {
    // Sans verrou, deux corrections concurrentes lisent le même solde et le
    // dépassent toutes les deux — le garde-fou de non-négativité serait inopérant.
    trustBalance = 300;
    txClient.$executeRaw.mockClear();
    const { createTrustCorrection } = await import("../trust-transaction-service");

    await createTrustCorrection({
      cabinetId: "cab1",
      clientId: "client-1",
      dossierId: "dossier-1",
      montant: -50,
      dateTransaction: WITHDRAWAL_DATE,
      correctionOfId: "ttx-original",
      description: "Correction",
    });

    expect(txClient.$executeRaw).toHaveBeenCalled();
  });
});

/* ════════════════════════════════════════════════════════════════
   Dépôt — art. 38(1)h : le solde après chaque inscription doit être juste
   ════════════════════════════════════════════════════════════════ */

describe("CH-00 — le dépôt est sérialisé sous verrou", () => {
  it("pose le verrou et relit le solde dans la transaction", async () => {
    trustBalance = 500;
    txClient.$executeRaw.mockClear();
    txClient.trustTransaction.aggregate.mockClear();
    const { createTrustDeposit } = await import("../trust-transaction-service");

    await createTrustDeposit({
      cabinetId: "cab1",
      clientId: "client-1",
      dossierId: "dossier-1",
      montant: 200,
      dateTransaction: WITHDRAWAL_DATE,
      modePaiement: "VIREMENT",
    });

    expect(txClient.$executeRaw).toHaveBeenCalled();
    expect(txClient.trustTransaction.aggregate).toHaveBeenCalledTimes(1);
    // Le solde inscrit est celui relu sous verrou, pas une lecture antérieure.
    const call = txClient.trustTransaction.create.mock.calls[0]![0];
    expect(call.data.balanceAfter).toBe(700);
  });

  it("REFUSE un dépôt en espèces de 7 500 $ ou plus (art. 69 / s. 4(1))", async () => {
    const { createTrustDeposit } = await import("../trust-transaction-service");

    await expect(
      createTrustDeposit({
        cabinetId: "cab1",
        clientId: "client-1",
        dossierId: "dossier-1",
        montant: 7500,
        dateTransaction: WITHDRAWAL_DATE,
        modePaiement: "ESPECES",
      }),
    ).rejects.toMatchObject({ code: "CASH_DEPOSIT_LIMIT_EXCEEDED" });
  });
});

/* ════════════════════════════════════════════════════════════════
   Qualité des messages — PR-2 et PR-4
   ════════════════════════════════════════════════════════════════ */

describe("CH-00 — chaque refus cite son article et propose une porte de sortie", () => {
  it("cite l'article québécois pour un cabinet du Québec", async () => {
    invoiceRow = conformingInvoice({ invoiceStatus: "DRAFT" });
    const { createTrustWithdrawal } = await import("../trust-transaction-service");

    await expect(
      createTrustWithdrawal({
        ...base,
        montant: 100,
        motive: "HONORAIRES_DEBOURS_FACTURES",
        factureId: "inv1",
      }),
    ).rejects.toThrow(/B-1 r\.5, art\. 56/);
  });

  it("propose systématiquement une action de remplacement (PR-2)", async () => {
    const { createTrustWithdrawal } = await import("../trust-transaction-service");
    const { isTrustComplianceError } = await import("../errors");

    try {
      await createTrustWithdrawal({
        ...base,
        montant: 100,
        motive: "REMISE_CLIENT_OU_TIERS",
        modePaiement: "ESPECES" as never,
      });
      throw new Error("aurait dû lever");
    } catch (e) {
      expect(isTrustComplianceError(e)).toBe(true);
      if (isTrustComplianceError(e)) {
        expect(e.remedy.length).toBeGreaterThan(0);
        expect(e.toJSON().articleQC).toBe("art. 57");
      }
    }
  });
});
