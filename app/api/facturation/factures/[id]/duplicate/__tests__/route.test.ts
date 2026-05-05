import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Prouve que la route POST /api/facturation/factures/[id]/duplicate :
 *   - ouvre une transaction Prisma ;
 *   - délègue le numéro à `getNextInvoiceNumero(cabinetId, tx)` ;
 *   - fait passer `invoice.create`, `invoiceItem.create` et
 *     `recalculateInvoiceTotals` par le tx ;
 *   - n'exécute aucune écriture critique sur le client racine ;
 *   - renvoie `{ id }` quand la duplication réussit.
 */

const { log, txClient, prismaMock, getNextInvoiceNumeroMock, recalculateInvoiceTotalsMock } =
  vi.hoisted(() => {
    const logRef = {
      txOpened: 0,
      inTx: [] as string[],
      outsideTx: [] as string[],
      numeroCalls: [] as { cabinetId: string; clientType: "tx" | "prisma" | "unknown" }[],
      recalcCalls: [] as { invoiceId: string; clientType: "tx" | "prisma" | "unknown" }[],
    };

    const txClientObj = {
      invoice: {
        create: vi.fn(async () => {
          logRef.inTx.push("invoice.create");
          return { id: "inv-new-1" };
        }),
        // findUnique/update sont utilisés par `recalculateInvoiceTotals`
        // mais on mock celui-ci entièrement, donc inutiles ici.
      },
      invoiceItem: {
        create: vi.fn(async () => {
          logRef.inTx.push("invoiceItem.create");
          return { id: `item-${logRef.inTx.filter((s) => s === "invoiceItem.create").length}` };
        }),
      },
    };

    const rootClient = {
      invoice: {
        findFirst: vi.fn(async () => ({
          id: "inv-source-1",
          clientId: "cli1",
          dossierId: null,
          cabinetId: "cab1",
        })),
        create: vi.fn(async () => {
          logRef.outsideTx.push("invoice.create");
          return { id: "inv-out-1" };
        }),
      },
      invoiceItem: {
        create: vi.fn(async () => {
          logRef.outsideTx.push("invoiceItem.create");
          return { id: "item-out" };
        }),
      },
    };

    return {
      log: logRef,
      txClient: txClientObj,
      prismaMock: {
        ...rootClient,
        $transaction: vi.fn(async (cb: (tx: typeof txClientObj) => Promise<unknown>) => {
          logRef.txOpened += 1;
          return cb(txClientObj);
        }),
      },
      getNextInvoiceNumeroMock: vi.fn(async (cabinetId: string, client?: unknown) => {
        const clientType: "tx" | "prisma" | "unknown" =
          client === txClientObj ? "tx" : client == null ? "prisma" : "unknown";
        logRef.numeroCalls.push({ cabinetId, clientType });
        return "F-2026-007";
      }),
      recalculateInvoiceTotalsMock: vi.fn(async (invoiceId: string, client?: unknown) => {
        const clientType: "tx" | "prisma" | "unknown" =
          client === txClientObj ? "tx" : client == null ? "prisma" : "unknown";
        logRef.recalcCalls.push({ invoiceId, clientType });
      }),
    };
  });

vi.mock("@/lib/db", () => ({ prisma: prismaMock }));
vi.mock("@/lib/auth", () => ({ authOptions: {} }));
vi.mock("next-auth", () => ({
  getServerSession: vi.fn(async () => ({
    user: { cabinetId: "cab1", role: "ADMIN" },
  })),
}));
vi.mock("@/lib/auth/permissions", () => ({
  canManageInvoices: () => true,
}));
vi.mock("@/lib/facturation/numero-facture", () => ({
  getNextInvoiceNumero: getNextInvoiceNumeroMock,
}));
vi.mock("@/lib/services/billing/invoice-service", () => ({
  recalculateInvoiceTotals: recalculateInvoiceTotalsMock,
}));

function buildRequest(body: unknown): Request {
  return new Request("http://localhost/api/facturation/factures/inv-source-1/duplicate", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

beforeEach(() => {
  log.txOpened = 0;
  log.inTx.length = 0;
  log.outsideTx.length = 0;
  log.numeroCalls.length = 0;
  log.recalcCalls.length = 0;
  prismaMock.$transaction.mockClear();
  prismaMock.invoice.findFirst.mockClear();
  prismaMock.invoice.create.mockClear();
  prismaMock.invoiceItem.create.mockClear();
  txClient.invoice.create.mockClear();
  txClient.invoiceItem.create.mockClear();
  getNextInvoiceNumeroMock.mockClear();
  recalculateInvoiceTotalsMock.mockClear();
});

describe("POST /api/facturation/factures/[id]/duplicate — transactionnalité", () => {
  it("ouvre une transaction et y fait passer toutes les écritures critiques", async () => {
    const { POST } = await import("@/app/api/facturation/factures/[id]/duplicate/route");

    const res = await POST(
      buildRequest({
        items: [
          {
            description: "Conseil",
            date: "2026-05-01",
            type: "honoraires",
            amount: 200,
            hours: 1,
            rate: 200,
          },
          {
            description: "Recherche",
            date: "2026-05-01",
            type: "honoraires",
            amount: 100,
          },
        ],
      }),
      { params: Promise.resolve({ id: "inv-source-1" }) },
    );

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual({ id: "inv-new-1" });

    expect(log.txOpened).toBe(1);
    expect(prismaMock.$transaction).toHaveBeenCalledTimes(1);

    // Toutes les écritures critiques passent par tx, pas par le client racine
    expect(log.inTx).toContain("invoice.create");
    expect(log.inTx.filter((s) => s === "invoiceItem.create").length).toBe(2);
    expect(log.outsideTx).not.toContain("invoice.create");
    expect(log.outsideTx).not.toContain("invoiceItem.create");
  });

  it("appelle getNextInvoiceNumero avec le tx (advisory lock dans la même transaction)", async () => {
    const { POST } = await import("@/app/api/facturation/factures/[id]/duplicate/route");

    await POST(
      buildRequest({
        items: [
          { description: "X", date: "2026-05-01", type: "honoraires", amount: 100 },
        ],
      }),
      { params: Promise.resolve({ id: "inv-source-1" }) },
    );

    expect(getNextInvoiceNumeroMock).toHaveBeenCalledTimes(1);
    expect(log.numeroCalls).toHaveLength(1);
    expect(log.numeroCalls[0]).toEqual({ cabinetId: "cab1", clientType: "tx" });
  });

  it("appelle recalculateInvoiceTotals avec le tx (recalcul dans la même transaction)", async () => {
    const { POST } = await import("@/app/api/facturation/factures/[id]/duplicate/route");

    await POST(
      buildRequest({
        items: [
          { description: "X", date: "2026-05-01", type: "honoraires", amount: 100 },
        ],
      }),
      { params: Promise.resolve({ id: "inv-source-1" }) },
    );

    expect(recalculateInvoiceTotalsMock).toHaveBeenCalledTimes(1);
    expect(log.recalcCalls).toHaveLength(1);
    expect(log.recalcCalls[0]).toEqual({ invoiceId: "inv-new-1", clientType: "tx" });
  });

  it("rejette si items est vide (avant d'ouvrir une transaction)", async () => {
    const { POST } = await import("@/app/api/facturation/factures/[id]/duplicate/route");

    const res = await POST(
      buildRequest({ items: [] }),
      { params: Promise.resolve({ id: "inv-source-1" }) },
    );

    expect(res.status).toBe(400);
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
    expect(getNextInvoiceNumeroMock).not.toHaveBeenCalled();
  });

  it("rejette 404 si la facture source est introuvable", async () => {
    (prismaMock.invoice.findFirst as ReturnType<typeof vi.fn>).mockResolvedValueOnce(null);

    const { POST } = await import("@/app/api/facturation/factures/[id]/duplicate/route");

    const res = await POST(
      buildRequest({
        items: [{ description: "X", date: "2026-05-01", type: "honoraires", amount: 100 }],
      }),
      { params: Promise.resolve({ id: "missing" }) },
    );

    expect(res.status).toBe(404);
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });

  it("préserve la résolution parentItemId via oldIdToNewId", async () => {
    // L'item enfant référence un parent par son id source ; le mock crée des
    // ids "item-1", "item-2" séquentiels — on vérifie que le 2e create reçoit
    // le NOUVEL id du parent (pas l'ancien "src-1").
    const createSpy = txClient.invoiceItem.create as ReturnType<typeof vi.fn>;
    createSpy.mockImplementation((async (args: unknown) => {
      const seq = createSpy.mock.calls.length;
      log.inTx.push("invoiceItem.create");
      return { id: `item-${seq}` };
    }) as never);

    const { POST } = await import("@/app/api/facturation/factures/[id]/duplicate/route");

    await POST(
      buildRequest({
        items: [
          { id: "src-1", description: "Parent", date: "2026-05-01", type: "honoraires", amount: 100 },
          { id: "src-2", description: "Child", date: "2026-05-01", type: "rabais", amount: 10, parentItemId: "src-1" },
        ],
      }),
      { params: Promise.resolve({ id: "inv-source-1" }) },
    );

    // Inspection des appels : 2e create reçoit parentItemId = "item-1"
    const calls = createSpy.mock.calls;
    expect(calls.length).toBe(2);
    const secondCallData = (calls[1]?.[0] as { data: { parentItemId?: unknown } }).data;
    expect(secondCallData.parentItemId).toBe("item-1");
  });
});
