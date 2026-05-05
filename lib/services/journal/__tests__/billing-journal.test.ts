import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Invoice, Payment, PrismaClient } from "@prisma/client";
import {
  INVOICE_JOURNAL_SOURCE_MODULE,
  PAYMENT_JOURNAL_SOURCE_MODULE,
  writeJournalForIssuedInvoice,
  writeJournalForPayment,
} from "../billing-journal";

interface MockJgeStore {
  existing?: { id: string } | null;
  createCalls: Array<Record<string, unknown>>;
  findFirstCalls: Array<Record<string, unknown>>;
}

function buildMockClient(store: MockJgeStore): PrismaClient {
  const findFirst = vi.fn().mockImplementation(async (args) => {
    store.findFirstCalls.push(args);
    const where = (args?.where ?? {}) as Record<string, unknown>;
    if ("sourceId" in where && "sourceModule" in where) {
      return store.existing ?? null;
    }
    return { solde: 0 };
  });
  const create = vi.fn().mockImplementation(async (args) => {
    store.createCalls.push(args);
    return { id: `jge-${store.createCalls.length}` };
  });
  return {
    $executeRaw: vi.fn().mockResolvedValue(undefined),
    journalGeneralEntry: { findFirst, create },
  } as unknown as PrismaClient;
}

function buildInvoice(over: Partial<Invoice> = {}): Invoice {
  return {
    id: "inv_1",
    cabinetId: "cab_1",
    clientId: "cli_1",
    dossierId: "dos_1",
    numero: "F-2026-001",
    dateEmission: new Date("2026-05-01"),
    dateEcheance: new Date("2026-05-01"),
    statut: "envoyee",
    invoiceStatus: "ISSUED",
    montantTotal: 114.98,
    montantPaye: 0,
    subtotalTaxable: 100,
    tps: 5,
    tvq: 9.98,
    deboursNonTaxableTotal: 0,
    trustApplied: 0,
    balanceDue: 114.98,
    tauxInteret: null,
    dateLimiteInterets: null,
    lastReminderDay: null,
    lastInterestAppliedAt: null,
    validatedAt: null,
    validatedById: null,
    currency: "CAD",
    subtotalFees: 100,
    subtotalExpenses: 0,
    subtotalAdjustments: 0,
    subtotalInterest: 0,
    subtotalBeforeTax: 100,
    taxGst: 5,
    taxQst: 9.98,
    taxTotal: 14.98,
    trustAppliedAmount: 0,
    creditAppliedAmount: 0,
    totalInvoiceAmount: 114.98,
    totalPaidAmount: 0,
    interestAccrued: 0,
    paymentStatus: "UNPAID",
    issueMethod: "generated_from_billing",
    billingGroupKey: null,
    clientNote: null,
    internalNote: null,
    sentAt: new Date("2026-05-02"),
    approvedAt: null,
    approvedById: null,
    cancelledAt: null,
    cancelReason: null,
    createdById: "user_1",
    shareToken: null,
    shareTokenExpiresAt: null,
    createdAt: new Date("2026-05-01"),
    updatedAt: new Date("2026-05-01"),
    ...over,
  } as Invoice;
}

function buildPayment(over: Partial<Payment> = {}): Payment {
  return {
    id: "pay_1",
    cabinetId: "cab_1",
    clientId: "cli_1",
    invoiceId: "inv_1",
    montant: 50,
    datePaiement: new Date("2026-05-03"),
    mode: "e_transfer",
    method: "autre",
    reference: "REF-1",
    paymentMethod: "e_transfer",
    referenceNumber: "REF-1",
    sourceAccountType: "operating",
    allocationStatus: "UNALLOCATED",
    note: null,
    receivedById: "user_1",
    createdAt: new Date("2026-05-03"),
    updatedAt: new Date("2026-05-03"),
    ...over,
  } as Payment;
}

let store: MockJgeStore;
let client: PrismaClient;

beforeEach(() => {
  store = { createCalls: [], findFirstCalls: [] };
  client = buildMockClient(store);
});

describe("writeJournalForIssuedInvoice", () => {
  it("crée une écriture FACTURE en entrée avec la facture comme source idempotente", async () => {
    const result = await writeJournalForIssuedInvoice(
      {
        ...buildInvoice(),
        client: { raisonSociale: "Client Alpha", prenom: null, nom: null },
      },
      { client, utilisateurId: "user_1" },
    );

    expect(result).toEqual({ created: true, journalId: "jge-1" });
    const data = store.createCalls[0]!.data as Record<string, unknown>;
    expect(data.typeTransaction).toBe("FACTURE");
    expect(data.montantEntree).toBe(114.98);
    expect(data.montantSortie).toBe(0);
    expect(data.sourceModule).toBe(INVOICE_JOURNAL_SOURCE_MODULE);
    expect(data.sourceId).toBe("inv_1");
    expect(data.reference).toBe("F-2026-001");
    expect(data.description).toBe("Facture F-2026-001 — Client Alpha");
  });

  it("ne recrée pas l'écriture si elle existe déjà", async () => {
    store.existing = { id: "jge-existing" };

    const result = await writeJournalForIssuedInvoice(buildInvoice(), { client });

    expect(result).toEqual({
      created: false,
      journalId: "jge-existing",
      reason: "already_journalized",
    });
    expect(store.createCalls).toHaveLength(0);
  });
});

describe("writeJournalForPayment", () => {
  it("crée une écriture PAIEMENT en entrée avec le paiement comme source idempotente", async () => {
    const result = await writeJournalForPayment(
      {
        ...buildPayment(),
        client: { raisonSociale: "Client Alpha", prenom: null, nom: null },
        invoice: { numero: "F-2026-001", dossierId: "dos_1" },
      },
      { client },
    );

    expect(result).toEqual({ created: true, journalId: "jge-1" });
    const data = store.createCalls[0]!.data as Record<string, unknown>;
    expect(data.typeTransaction).toBe("PAIEMENT");
    expect(data.montantEntree).toBe(50);
    expect(data.montantSortie).toBe(0);
    expect(data.sourceModule).toBe(PAYMENT_JOURNAL_SOURCE_MODULE);
    expect(data.sourceId).toBe("pay_1");
    expect(data.reference).toBe("REF-1");
    expect(data.clientId).toBe("cli_1");
    expect(data.dossierId).toBe("dos_1");
    expect(data.description).toBe("Paiement reçu — facture F-2026-001 — Client Alpha");
  });
});
