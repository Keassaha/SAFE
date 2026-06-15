import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Prouve qu'`allocateToInvoices` :
 *   1. acquiert un advisory lock Postgres `pg_advisory_xact_lock` AVANT toute
 *      écriture (sur le paiement et sur chaque facture cible),
 *   2. revalide les soldes SOUS verrou (re-lecture du paiement et des factures
 *      dans la même transaction) — empêche les races concurrentes,
 *   3. respecte les invariants métier (rejet sur-allocation, doublons).
 */

interface CallLog {
  txOpened: number;
  rawCalls: string[];
  txOps: string[];
}

const log: CallLog = { txOpened: 0, rawCalls: [], txOps: [] };

// Données mutables exposées aux mocks
let paymentRow = {
  id: "pay1",
  cabinetId: "cab1",
  montant: 100,
  allocationStatus: "UNALLOCATED" as string,
  paymentAllocations: [] as { allocatedAmount: number }[],
};

let invoiceRows = [{ id: "inv1", balanceDue: 100 }];

const txClient = {
  $executeRaw: vi.fn(async (..._args: unknown[]) => {
    // tagged template Prisma : 1er arg = TemplateStringsArray (Array<string>),
    // suivants = valeurs interpolées.
    const first = _args[0];
    const strings = Array.isArray(first)
      ? (first as string[])
      : ((first as { strings?: string[] })?.strings ?? []);
    log.rawCalls.push(strings.join("?"));
    log.txOps.push("$executeRaw");
    return 1;
  }),
  payment: {
    findFirst: vi.fn(async () => {
      log.txOps.push("payment.findFirst");
      return paymentRow;
    }),
    update: vi.fn(async () => {
      log.txOps.push("payment.update");
      return { id: "pay1" };
    }),
  },
  invoice: {
    findMany: vi.fn(async () => {
      log.txOps.push("invoice.findMany");
      return invoiceRows;
    }),
    findUnique: vi.fn(async () => {
      log.txOps.push("invoice.findUnique");
      return {
        id: "inv1",
        invoiceLines: [],
        invoiceItems: [],
        paymentAllocations: [],
        trustAppliedAmount: 0,
        trustApplied: 0,
        creditAppliedAmount: 0,
      };
    }),
    update: vi.fn(async () => {
      log.txOps.push("invoice.update");
      return { id: "inv1" };
    }),
  },
  paymentAllocation: {
    create: vi.fn(async () => {
      log.txOps.push("paymentAllocation.create");
      return { id: "alloc1" };
    }),
  },
  deboursDossier: {
    updateMany: vi.fn(async () => {
      log.txOps.push("deboursDossier.updateMany");
      return { count: 0 };
    }),
  },
};

const prismaMock = {
  payment: {
    findFirst: vi.fn(async () => paymentRow),
  },
  $transaction: vi.fn(async (cb: (tx: typeof txClient) => Promise<unknown>) => {
    log.txOpened += 1;
    return cb(txClient);
  }),
};

vi.mock("@/lib/db", () => ({ prisma: prismaMock }));
vi.mock("@/lib/services/audit", () => ({
  createAuditLog: vi.fn().mockResolvedValue(undefined),
}));

beforeEach(() => {
  log.txOpened = 0;
  log.rawCalls.length = 0;
  log.txOps.length = 0;
  paymentRow = {
    id: "pay1",
    cabinetId: "cab1",
    montant: 100,
    allocationStatus: "UNALLOCATED",
    paymentAllocations: [],
  };
  invoiceRows = [{ id: "inv1", balanceDue: 100 }];
  Object.values(txClient).forEach((mod) => {
    if (typeof mod === "object") {
      Object.values(mod).forEach((fn) => {
        if (typeof fn === "function" && "mockClear" in fn) (fn as ReturnType<typeof vi.fn>).mockClear();
      });
    }
  });
  txClient.$executeRaw.mockClear();
  prismaMock.$transaction.mockClear();
  prismaMock.payment.findFirst.mockClear();
});

describe("allocateToInvoices — verrou advisory et revalidation sous tx", () => {
  it("acquiert un advisory lock pour le paiement ET chaque facture cible", async () => {
    const { allocateToInvoices } = await import(
      "@/lib/services/billing/payment-allocation-service"
    );

    await allocateToInvoices({
      paymentId: "pay1",
      allocations: [{ invoiceId: "inv1", allocatedAmount: 50 }],
    });

    expect(log.txOpened).toBe(1);
    // Au moins 2 appels $executeRaw (1 pour le paiement, 1 par facture cible)
    expect(txClient.$executeRaw).toHaveBeenCalled();
    const lockCalls = txClient.$executeRaw.mock.calls;
    expect(lockCalls.length).toBeGreaterThanOrEqual(2);

    // Le SQL contient bien "pg_advisory_xact_lock" et les clés "payment:" / "invoice:"
    const allRawText = log.rawCalls.join(" | ");
    expect(allRawText).toContain("pg_advisory_xact_lock");

    // Les arguments interpolés contiennent bien payment:pay1 et invoice:inv1
    const allInterpolated = lockCalls
      .flatMap((c) => c.slice(1) as unknown[])
      .map((v) => String(v))
      .join(" | ");
    expect(allInterpolated).toContain("payment:pay1");
    expect(allInterpolated).toContain("invoice:inv1");
  });

  it("le lock est acquis AVANT la création des allocations", async () => {
    const { allocateToInvoices } = await import(
      "@/lib/services/billing/payment-allocation-service"
    );

    await allocateToInvoices({
      paymentId: "pay1",
      allocations: [{ invoiceId: "inv1", allocatedAmount: 50 }],
    });

    // L'ordre dans txOps : $executeRaw (lock) doit précéder paymentAllocation.create
    const firstLockIdx = log.txOps.indexOf("$executeRaw");
    const firstAllocCreateIdx = log.txOps.indexOf("paymentAllocation.create");
    expect(firstLockIdx).toBeGreaterThanOrEqual(0);
    expect(firstAllocCreateIdx).toBeGreaterThanOrEqual(0);
    expect(firstLockIdx).toBeLessThan(firstAllocCreateIdx);
  });

  it("revalide le solde de la facture SOUS verrou (re-lecture dans la tx)", async () => {
    const { allocateToInvoices } = await import(
      "@/lib/services/billing/payment-allocation-service"
    );

    await allocateToInvoices({
      paymentId: "pay1",
      allocations: [{ invoiceId: "inv1", allocatedAmount: 50 }],
    });

    // payment.findFirst dans la tx + invoice.findMany dans la tx (revalidation)
    expect(txClient.payment.findFirst).toHaveBeenCalledTimes(1);
    expect(txClient.invoice.findMany).toHaveBeenCalledTimes(1);
  });

  it("rejette une allocation qui dépasse le solde dû SOUS verrou", async () => {
    invoiceRows = [{ id: "inv1", balanceDue: 30 }]; // solde post-lock = 30

    const { allocateToInvoices } = await import(
      "@/lib/services/billing/payment-allocation-service"
    );

    await expect(
      allocateToInvoices({
        paymentId: "pay1",
        allocations: [{ invoiceId: "inv1", allocatedAmount: 50 }],
      }),
    ).rejects.toThrow(/excède son solde dû/);

    // Aucune allocation ni mise à jour n'est créée (transaction rollback)
    expect(txClient.paymentAllocation.create).not.toHaveBeenCalled();
    expect(txClient.payment.update).not.toHaveBeenCalled();
  });

  it("rejette si une allocation existante depuis ce paiement épuise déjà le montant", async () => {
    // Sous verrou, on découvre que le paiement de 100 est déjà alloué à 100.
    paymentRow = {
      id: "pay1",
      cabinetId: "cab1",
      montant: 100,
      allocationStatus: "ALLOCATED",
      paymentAllocations: [{ allocatedAmount: 100 }],
    };

    const { allocateToInvoices } = await import(
      "@/lib/services/billing/payment-allocation-service"
    );

    await expect(
      allocateToInvoices({
        paymentId: "pay1",
        allocations: [{ invoiceId: "inv1", allocatedAmount: 50 }],
      }),
    ).rejects.toThrow(/dépasse le solde non alloué du paiement/);

    expect(txClient.paymentAllocation.create).not.toHaveBeenCalled();
  });

  it("recalcule les totaux des factures impactées dans la même transaction", async () => {
    const { allocateToInvoices } = await import(
      "@/lib/services/billing/payment-allocation-service"
    );

    await allocateToInvoices({
      paymentId: "pay1",
      allocations: [{ invoiceId: "inv1", allocatedAmount: 50 }],
    });

    // recalculateInvoiceTotals utilise findUnique + update sous le tx
    expect(txClient.invoice.findUnique).toHaveBeenCalled();
    expect(txClient.invoice.update).toHaveBeenCalled();
  });

  it("verrouille les factures dans un ordre alphabétique déterministe (anti-deadlock)", async () => {
    // Mock multi-factures pour ce test
    paymentRow = {
      id: "pay1",
      cabinetId: "cab1",
      montant: 1000,
      allocationStatus: "UNALLOCATED",
      paymentAllocations: [],
    };
    invoiceRows = [
      { id: "inv-a", balanceDue: 500 },
      { id: "inv-m", balanceDue: 500 },
      { id: "inv-z", balanceDue: 500 },
    ];

    const { allocateToInvoices } = await import(
      "@/lib/services/billing/payment-allocation-service"
    );

    // On envoie les allocations dans un ordre désordonné
    await allocateToInvoices({
      paymentId: "pay1",
      allocations: [
        { invoiceId: "inv-z", allocatedAmount: 100 },
        { invoiceId: "inv-a", allocatedAmount: 100 },
        { invoiceId: "inv-m", allocatedAmount: 100 },
      ],
    });

    // Capture les valeurs interpolées dans l'ordre des appels $executeRaw
    const lockedKeys: string[] = [];
    for (const call of txClient.$executeRaw.mock.calls) {
      const interpolated = call.slice(1).map((v) => String(v));
      for (const v of interpolated) {
        if (v.startsWith("payment:") || v.startsWith("invoice:")) {
          lockedKeys.push(v);
        }
      }
    }

    // Le payment doit être verrouillé en premier
    expect(lockedKeys[0]).toBe("payment:pay1");

    // Les factures doivent suivre dans l'ordre TRIÉ (a, m, z), peu importe
    // l'ordre d'arrivée dans la requête.
    const invoiceLockOrder = lockedKeys.filter((k) => k.startsWith("invoice:"));
    expect(invoiceLockOrder).toEqual(["invoice:inv-a", "invoice:inv-m", "invoice:inv-z"]);
  });

  it("conserve l'ordre trié quel que soit l'ordre des allocations (idempotence d'ordre)", async () => {
    paymentRow = {
      id: "pay1",
      cabinetId: "cab1",
      montant: 1000,
      allocationStatus: "UNALLOCATED",
      paymentAllocations: [],
    };
    invoiceRows = [
      { id: "inv-a", balanceDue: 500 },
      { id: "inv-b", balanceDue: 500 },
    ];

    const { allocateToInvoices } = await import(
      "@/lib/services/billing/payment-allocation-service"
    );

    // Variante 1 : a puis b
    await allocateToInvoices({
      paymentId: "pay1",
      allocations: [
        { invoiceId: "inv-a", allocatedAmount: 100 },
        { invoiceId: "inv-b", allocatedAmount: 100 },
      ],
    });
    const order1 = txClient.$executeRaw.mock.calls
      .flatMap((c) => c.slice(1).map(String))
      .filter((v) => v.startsWith("invoice:"));

    // Reset et variante 2 : b puis a
    txClient.$executeRaw.mockClear();
    log.rawCalls.length = 0;
    log.txOps.length = 0;
    paymentRow.paymentAllocations = []; // remettre à zéro
    invoiceRows = [
      { id: "inv-a", balanceDue: 500 },
      { id: "inv-b", balanceDue: 500 },
    ];

    await allocateToInvoices({
      paymentId: "pay1",
      allocations: [
        { invoiceId: "inv-b", allocatedAmount: 100 },
        { invoiceId: "inv-a", allocatedAmount: 100 },
      ],
    });
    const order2 = txClient.$executeRaw.mock.calls
      .flatMap((c) => c.slice(1).map(String))
      .filter((v) => v.startsWith("invoice:"));

    // Les deux variantes verrouillent dans le même ordre alphabétique
    expect(order1).toEqual(order2);
    expect(order1).toEqual(["invoice:inv-a", "invoice:inv-b"]);
  });
});
