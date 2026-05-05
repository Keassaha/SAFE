import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Prouve que `createDraftFromBillableItems` enveloppe la création de facture,
 * des invoiceLines, des updates TimeEntry/Expense et le recalcul des totaux
 * dans une seule transaction Prisma. Ceci empêche un état partiel où une
 * fiche de temps serait marquée IN_DRAFT_INVOICE sans facture associée
 * (ou inversement).
 */

interface CallLog {
  txOpened: number;
  /** ops effectuées avec le client `tx` reçu par le callback de $transaction */
  inTx: string[];
  /** ops effectuées avec le client racine `prisma` (hors transaction) */
  outsideTx: string[];
}

// On reconstruit un mock complet de `@/lib/db` avant l'import du service.
const log: CallLog = { txOpened: 0, inTx: [], outsideTx: [] };

function makeTxClient(tag: "tx" | "prisma") {
  const collect = (op: string) => {
    if (tag === "tx") log.inTx.push(op);
    else log.outsideTx.push(op);
  };
  return {
    invoice: {
      findUnique: vi.fn().mockImplementation(async () => {
        collect("invoice.findUnique");
        return {
          id: "inv-1",
          invoiceLines: [],
          invoiceItems: [],
          paymentAllocations: [],
          trustAppliedAmount: 0,
          trustApplied: 0,
          creditAppliedAmount: 0,
        };
      }),
      findFirst: vi.fn().mockImplementation(async () => {
        collect("invoice.findFirst");
        return null;
      }),
      create: vi.fn().mockImplementation(async () => {
        collect("invoice.create");
        return { id: "inv-1" };
      }),
      update: vi.fn().mockImplementation(async () => {
        collect("invoice.update");
        return { id: "inv-1" };
      }),
    },
    invoiceLine: {
      create: vi.fn().mockImplementation(async () => {
        collect("invoiceLine.create");
        return { id: "line-" + (log.inTx.filter((s) => s === "invoiceLine.create").length + 1) };
      }),
    },
    timeEntry: {
      findMany: vi.fn().mockImplementation(async () => {
        collect("timeEntry.findMany");
        return [
          {
            id: "te1",
            cabinetId: "cab1",
            clientId: "cli1",
            dossierId: null,
            description: "Conseil",
            date: new Date("2026-05-01"),
            dureeMinutes: 60,
            tauxHoraire: 200,
            durationHours: 1,
            hourlyRate: 200,
            feeAmount: 200,
            montant: 200,
            taxable: true,
            user: { id: "u1", nom: "Avocat" },
          },
        ];
      }),
      update: vi.fn().mockImplementation(async () => {
        collect("timeEntry.update");
        return { id: "te1" };
      }),
    },
    expense: {
      findMany: vi.fn().mockImplementation(async () => {
        collect("expense.findMany");
        return [];
      }),
      update: vi.fn().mockImplementation(async () => {
        collect("expense.update");
        return { id: "exp1" };
      }),
    },
  };
}

const txClient = makeTxClient("tx");
const rootClient = makeTxClient("prisma");

const prismaMock = {
  ...rootClient,
  $transaction: vi.fn(async (cb: (tx: typeof txClient) => Promise<unknown>) => {
    log.txOpened += 1;
    return cb(txClient);
  }),
};

vi.mock("@/lib/db", () => ({ prisma: prismaMock }));
vi.mock("@/lib/facturation/numero-facture", () => ({
  getNextInvoiceNumero: vi.fn().mockResolvedValue("F-2026-001"),
}));
vi.mock("@/lib/services/audit", () => ({
  createAuditLog: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("@/lib/services/journal/billing-journal", () => ({
  writeJournalForIssuedInvoice: vi.fn().mockResolvedValue({ created: true, journalId: "jge-1" }),
}));

beforeEach(() => {
  log.txOpened = 0;
  log.inTx.length = 0;
  log.outsideTx.length = 0;
  prismaMock.$transaction.mockClear();
});

describe("createDraftFromBillableItems — atomicité", () => {
  it("ouvre une transaction Prisma et y fait passer toutes les écritures critiques", async () => {
    const { createDraftFromBillableItems } = await import(
      "@/lib/services/billing/invoice-service"
    );

    await createDraftFromBillableItems({
      cabinetId: "cab1",
      clientId: "cli1",
      timeEntryIds: ["te1"],
      expenseIds: [],
      createdById: "u1",
    });

    expect(log.txOpened).toBe(1);
    expect(prismaMock.$transaction).toHaveBeenCalledTimes(1);

    // Toutes les opérations d'écriture critiques passent par `tx`
    expect(log.inTx).toContain("invoice.create");
    expect(log.inTx).toContain("invoiceLine.create");
    expect(log.inTx).toContain("timeEntry.update");
    // Le recalcul des totaux (findUnique + update) est aussi dans la tx
    expect(log.inTx).toContain("invoice.findUnique");
    expect(log.inTx).toContain("invoice.update");

    // Aucune écriture de facture/ligne/source n'est faite avec le client racine
    expect(log.outsideTx).not.toContain("invoice.create");
    expect(log.outsideTx).not.toContain("invoiceLine.create");
    expect(log.outsideTx).not.toContain("timeEntry.update");
    expect(log.outsideTx).not.toContain("invoice.update");
  });

  it("propage l'erreur si une écriture interne échoue (transaction rollback géré par Prisma)", async () => {
    // Préparer 2 timeEntries pour déclencher 2 invoiceLine.create.
    // findMany initial est lu via le client racine (hors tx).
    rootClient.timeEntry.findMany.mockResolvedValueOnce([
      {
        id: "te1",
        cabinetId: "cab1",
        clientId: "cli1",
        dossierId: null,
        description: "L1",
        date: new Date("2026-05-01"),
        dureeMinutes: 60,
        tauxHoraire: 200,
        durationHours: 1,
        hourlyRate: 200,
        feeAmount: 200,
        montant: 200,
        taxable: true,
        user: { id: "u1", nom: "A" },
      },
      {
        id: "te2",
        cabinetId: "cab1",
        clientId: "cli1",
        dossierId: null,
        description: "L2",
        date: new Date("2026-05-01"),
        dureeMinutes: 60,
        tauxHoraire: 200,
        durationHours: 1,
        hourlyRate: 200,
        feeAmount: 200,
        montant: 200,
        taxable: true,
        user: { id: "u1", nom: "A" },
      },
    ]);

    // Forcer une erreur sur la deuxième invoiceLine.create (échec partiel)
    txClient.invoiceLine.create
      .mockImplementationOnce(async () => {
        log.inTx.push("invoiceLine.create");
        return { id: "line-1" };
      })
      .mockImplementationOnce(async () => {
        log.inTx.push("invoiceLine.create-FAIL");
        throw new Error("simulated DB failure");
      });

    const { createDraftFromBillableItems } = await import(
      "@/lib/services/billing/invoice-service"
    );

    await expect(
      createDraftFromBillableItems({
        cabinetId: "cab1",
        clientId: "cli1",
        timeEntryIds: ["te1", "te2"],
        expenseIds: [],
        createdById: "u1",
      }),
    ).rejects.toThrow(/simulated DB failure/);

    // La transaction a bien été ouverte (Prisma annulera tout au rollback)
    expect(prismaMock.$transaction).toHaveBeenCalled();
  });
});
