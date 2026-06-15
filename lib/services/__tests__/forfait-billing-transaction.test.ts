import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Prouve que `createInvoiceFromDossier` et `createFreeformInvoice` enveloppent
 * la création de la facture, des invoiceLines, les updates RegistreTache /
 * DeboursDossier et le recalcul des totaux dans une seule transaction Prisma.
 *
 * Approche : mock complet de `@/lib/db` + helpers ; on capture quelles ops
 * passent par le client racine (`prisma`) et lesquelles par le `tx` du
 * `$transaction`. Aucune écriture critique ne doit fuir hors `tx`.
 */

interface CallLog {
  txOpened: number;
  inTx: string[];
  outsideTx: string[];
}

const log: CallLog = { txOpened: 0, inTx: [], outsideTx: [] };

function makeClient(tag: "tx" | "prisma") {
  const collect = (op: string) => {
    if (tag === "tx") log.inTx.push(op);
    else log.outsideTx.push(op);
  };
  return {
    invoice: {
      findFirst: vi.fn(async () => {
        collect("invoice.findFirst");
        return { clientId: "cli1", intitule: "Dossier 1", numeroDossier: "D1" };
      }),
      findUnique: vi.fn(async () => {
        collect("invoice.findUnique");
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
      findUniqueOrThrow: vi.fn(async () => {
        collect("invoice.findUniqueOrThrow");
        return {
          id: "inv1",
          numero: "F-2026-001",
          montantTotal: 1500,
          totalInvoiceAmount: 1500,
        };
      }),
      create: vi.fn(async () => {
        collect("invoice.create");
        return { id: "inv1" };
      }),
      update: vi.fn(async () => {
        collect("invoice.update");
        return { id: "inv1" };
      }),
      count: vi.fn(async () => {
        collect("invoice.count");
        return 0;
      }),
    },
    invoiceLine: {
      create: vi.fn(async () => {
        collect("invoiceLine.create");
        return { id: `line-${log.inTx.filter((s) => s === "invoiceLine.create").length + 1}` };
      }),
    },
    registreTache: {
      findMany: vi.fn(async () => {
        collect("registreTache.findMany");
        return [
          {
            id: "rt1",
            cabinetId: "cab1",
            dossierId: "d1",
            description: "Mandat A",
            montantBase: 1500,
            ajustement: 0,
            rabais: 0,
            rabaisRaison: null,
            montantFinal: 1500,
            taxable: true,
            statut: "complete",
            date: new Date("2026-05-01"),
            invoiceLineId: null,
          },
        ];
      }),
      update: vi.fn(async () => {
        collect("registreTache.update");
        return { id: "rt1" };
      }),
    },
    dossier: {
      findFirst: vi.fn(async () => {
        collect("dossier.findFirst");
        return { clientId: "cli1", intitule: "Dossier 1", numeroDossier: "D1" };
      }),
    },
    deboursDossier: {
      findMany: vi.fn(async () => {
        collect("deboursDossier.findMany");
        return [];
      }),
      update: vi.fn(async () => {
        collect("deboursDossier.update");
        return { id: "dd1" };
      }),
      updateMany: vi.fn(async () => {
        collect("deboursDossier.updateMany");
        return { count: 0 };
      }),
    },
  };
}

const txClient = makeClient("tx");
const rootClient = makeClient("prisma");

const prismaMock = {
  ...rootClient,
  $transaction: vi.fn(async (cb: (tx: typeof txClient) => Promise<unknown>) => {
    log.txOpened += 1;
    return cb(txClient);
  }),
};

vi.mock("@/lib/db", () => ({ prisma: prismaMock }));
vi.mock("@/lib/facturation/numero-facture", () => ({
  makeProvisionalInvoiceNumero: vi.fn(() => "BROUILLON-test"),
}));
vi.mock("@/lib/services/audit", () => ({
  createAuditLog: vi.fn().mockResolvedValue(undefined),
}));

function clearAllMocks(client: typeof txClient | typeof rootClient) {
  for (const mod of Object.values(client)) {
    for (const fn of Object.values(mod)) {
      if (typeof fn === "function" && "mockClear" in fn) {
        (fn as ReturnType<typeof vi.fn>).mockClear();
      }
    }
  }
}

beforeEach(() => {
  log.txOpened = 0;
  log.inTx.length = 0;
  log.outsideTx.length = 0;
  prismaMock.$transaction.mockClear();
  clearAllMocks(txClient);
  clearAllMocks(rootClient);
});

describe("createInvoiceFromDossier — atomicité", () => {
  it("ouvre une transaction et y fait passer toutes les écritures critiques", async () => {
    const { createInvoiceFromDossier } = await import(
      "@/lib/services/forfait-billing-service"
    );

    await createInvoiceFromDossier({
      dossierId: "d1",
      cabinetId: "cab1",
      userId: "u1",
    });

    expect(log.txOpened).toBe(1);
    expect(prismaMock.$transaction).toHaveBeenCalledTimes(1);

    // Écritures critiques dans tx
    expect(log.inTx).toContain("invoice.create");
    expect(log.inTx).toContain("invoiceLine.create");
    expect(log.inTx).toContain("registreTache.update");
    // Recalcul des totaux dans la même tx (findUnique + update)
    expect(log.inTx).toContain("invoice.findUnique");
    expect(log.inTx).toContain("invoice.update");

    // Aucune écriture critique sur le client racine
    expect(log.outsideTx).not.toContain("invoice.create");
    expect(log.outsideTx).not.toContain("invoiceLine.create");
    expect(log.outsideTx).not.toContain("registreTache.update");
    expect(log.outsideTx).not.toContain("invoice.update");
  });

  it("propage l'erreur si une écriture interne échoue (rollback géré par Prisma)", async () => {
    txClient.invoiceLine.create
      .mockImplementationOnce(async () => {
        log.inTx.push("invoiceLine.create-FAIL");
        throw new Error("simulated DB failure on line creation");
      });

    const { createInvoiceFromDossier } = await import(
      "@/lib/services/forfait-billing-service"
    );

    await expect(
      createInvoiceFromDossier({
        dossierId: "d1",
        cabinetId: "cab1",
        userId: "u1",
      }),
    ).rejects.toThrow(/simulated DB failure/);

    expect(prismaMock.$transaction).toHaveBeenCalledTimes(1);
  });

  it("revalide les sources SOUS tx — registreTache.findMany se fait via le tx, pas le client racine", async () => {
    const { createInvoiceFromDossier } = await import(
      "@/lib/services/forfait-billing-service"
    );

    await createInvoiceFromDossier({
      dossierId: "d1",
      cabinetId: "cab1",
      userId: "u1",
    });

    // Re-lecture des tâches dans la tx (pour voir l'état actuel sous verrou implicite)
    expect(log.inTx).toContain("registreTache.findMany");
    // Plus aucun findMany n'est fait sur le client racine (hors tx)
    expect(log.outsideTx).not.toContain("registreTache.findMany");

    // Le filtre exigé : invoiceLineId: null (sources réellement libres)
    const findManyCalls = txClient.registreTache.findMany.mock.calls as unknown as unknown[][];
    expect(findManyCalls.length).toBeGreaterThan(0);
    const firstCall = findManyCalls[0];
    expect(firstCall).toBeDefined();
    const where = (firstCall![0] as { where: Record<string, unknown> }).where;
    expect(where.invoiceLineId).toBeNull();
    expect(where.statut).toBe("complete");
  });

  it("rejette si une source RegistreTache est rattachée entre-temps (revalidation sous tx)", async () => {
    // Sous tx, aucune tâche libre n'est trouvée — un autre processus a tout pris.
    txClient.registreTache.findMany.mockImplementationOnce(async () => {
      log.inTx.push("registreTache.findMany");
      return [];
    });
    // Pas de débours, pas de lignes manuelles non plus
    txClient.deboursDossier.findMany.mockImplementationOnce(async () => {
      log.inTx.push("deboursDossier.findMany");
      return [];
    });

    const { createInvoiceFromDossier } = await import(
      "@/lib/services/forfait-billing-service"
    );

    await expect(
      createInvoiceFromDossier({
        dossierId: "d1",
        cabinetId: "cab1",
        userId: "u1",
        // Pas de lignes manuelles non plus
      }),
    ).rejects.toThrow(/billed concurrently|No unbilled tasks/);

    // Aucune facture ni ligne créée
    expect(txClient.invoice.create).not.toHaveBeenCalled();
    expect(txClient.invoiceLine.create).not.toHaveBeenCalled();
  });
});

describe("createFreeformInvoice — atomicité", () => {
  it("ouvre une transaction et y fait passer création + lignes + recalcul", async () => {
    const { createFreeformInvoice } = await import(
      "@/lib/services/forfait-billing-service"
    );

    await createFreeformInvoice({
      cabinetId: "cab1",
      clientId: "cli1",
      userId: "u1",
      lignes: [
        { description: "Conseil", montant: 500, taxable: true },
        { description: "Recherche", montant: 200, taxable: true },
      ],
    });

    expect(log.txOpened).toBe(1);
    expect(prismaMock.$transaction).toHaveBeenCalledTimes(1);

    expect(log.inTx).toContain("invoice.create");
    expect(log.inTx.filter((s) => s === "invoiceLine.create").length).toBeGreaterThanOrEqual(2);
    // Recalcul totaux dans la tx
    expect(log.inTx).toContain("invoice.findUnique");
    expect(log.inTx).toContain("invoice.update");

    expect(log.outsideTx).not.toContain("invoice.create");
    expect(log.outsideTx).not.toContain("invoiceLine.create");
    expect(log.outsideTx).not.toContain("invoice.update");
  });

  it("rejette si la liste de lignes est vide (avant d'ouvrir une transaction)", async () => {
    const { createFreeformInvoice } = await import(
      "@/lib/services/forfait-billing-service"
    );

    await expect(
      createFreeformInvoice({
        cabinetId: "cab1",
        clientId: "cli1",
        userId: "u1",
        lignes: [],
      }),
    ).rejects.toThrow(/At least one line is required/);

    // Aucune transaction ouverte si la pré-validation échoue
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });
});
