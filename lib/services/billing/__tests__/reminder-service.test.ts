import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * Tests du service de relances.
 *
 * Doctrine: docs/accounting/INVOICE_STATUS_NORMALIZATION.md
 *
 * Le filtre "en retard" doit être strictement dérivé via `whereInvoiceOverdue(now)`:
 *   - invoiceStatus dans {ISSUED, PARTIALLY_PAID, OVERDUE}
 *   - paymentStatus dans {UNPAID, PARTIAL}
 *   - dateEcheance < now
 *   - balanceDue > 0 (garde-fou)
 *
 * On mocke `prisma.invoice.findMany` pour vérifier la **forme exacte** du where envoyé.
 */

const findManyMock = vi.fn();
const auditCreateMock = vi.fn();

vi.mock("@/lib/db", () => ({
  prisma: {
    invoice: {
      findMany: (...args: unknown[]) => findManyMock(...args),
    },
    invoiceReminder: { create: vi.fn() },
  },
}));
vi.mock("@/lib/services/audit", () => ({
  createAuditLog: (...args: unknown[]) => auditCreateMock(...args),
}));

beforeEach(() => {
  findManyMock.mockReset();
  auditCreateMock.mockReset();
  findManyMock.mockResolvedValue([]);
});

describe("listOverdueInvoices — where canonique", () => {
  it("filtre par invoiceStatus émis + paymentStatus non payé + dateEcheance < now + balanceDue > 0", async () => {
    const { listOverdueInvoices } = await import("@/lib/services/billing/reminder-service");
    await listOverdueInvoices("cab_1");

    expect(findManyMock).toHaveBeenCalledTimes(1);
    const args = findManyMock.mock.calls[0]![0];
    expect(args.where.cabinetId).toBe("cab_1");

    expect(args.where.invoiceStatus).toEqual({
      in: ["ISSUED", "PARTIALLY_PAID", "OVERDUE"],
    });
    expect(args.where.paymentStatus).toEqual({
      in: ["UNPAID", "PARTIAL"],
    });
    expect(args.where.balanceDue).toEqual({ gt: 0 });

    // dateEcheance: { lt: <Date proche de maintenant> }
    expect(args.where.dateEcheance.lt).toBeInstanceOf(Date);
    const ecartMs = Math.abs(Date.now() - args.where.dateEcheance.lt.getTime());
    expect(ecartMs).toBeLessThan(2000);
  });

  it("inclut un filtre clientId quand fourni", async () => {
    const { listOverdueInvoices } = await import("@/lib/services/billing/reminder-service");
    await listOverdueInvoices("cab_1", { clientId: "cli_42" });

    const args = findManyMock.mock.calls[0]![0];
    expect(args.where.clientId).toBe("cli_42");
  });

  it("aucun filtre clientId si non fourni", async () => {
    const { listOverdueInvoices } = await import("@/lib/services/billing/reminder-service");
    await listOverdueInvoices("cab_1");

    const args = findManyMock.mock.calls[0]![0];
    expect("clientId" in args.where).toBe(false);
  });

  it("limit par défaut = 100, override possible", async () => {
    const { listOverdueInvoices } = await import("@/lib/services/billing/reminder-service");
    await listOverdueInvoices("cab_1");
    expect(findManyMock.mock.calls[0]![0].take).toBe(100);

    findManyMock.mockClear();
    await listOverdueInvoices("cab_1", { limit: 25 });
    expect(findManyMock.mock.calls[0]![0].take).toBe(25);
  });

  it("orderBy: dateEcheance ascendant (les plus anciens en premier)", async () => {
    const { listOverdueInvoices } = await import("@/lib/services/billing/reminder-service");
    await listOverdueInvoices("cab_1");
    expect(findManyMock.mock.calls[0]![0].orderBy).toEqual({ dateEcheance: "asc" });
  });

  it("inclut client + dossier pour l'UI de relance", async () => {
    const { listOverdueInvoices } = await import("@/lib/services/billing/reminder-service");
    await listOverdueInvoices("cab_1");
    const args = findManyMock.mock.calls[0]![0];
    expect(args.include.client).toBeDefined();
    expect(args.include.dossier).toBeDefined();
  });

  it("aucun post-filter — le where Prisma est suffisant (pas de over-fetch)", async () => {
    // Le service ne doit PAS appeler `.filter(...)` sur le résultat.
    // Si Prisma retourne 3 lignes, on en récupère 3 — peu importe leur balanceDue
    // (puisque le where l'a déjà imposé).
    findManyMock.mockResolvedValueOnce([
      { id: "inv_1", balanceDue: 100 },
      { id: "inv_2", balanceDue: 0 },   // hypothétique : ne devrait pas se produire avec le where, on s'assure que c'est passé tel quel
      { id: "inv_3", balanceDue: 50 },
    ]);
    const { listOverdueInvoices } = await import("@/lib/services/billing/reminder-service");
    const result = await listOverdueInvoices("cab_1");
    expect(result).toHaveLength(3);
    expect(result.map((i) => i.id)).toEqual(["inv_1", "inv_2", "inv_3"]);
  });

  it("ne lit plus l'enum OVERDUE comme un état exclusif (l'overdue est dérivé)", async () => {
    const { listOverdueInvoices } = await import("@/lib/services/billing/reminder-service");
    await listOverdueInvoices("cab_1");
    const args = findManyMock.mock.calls[0]![0];
    // Garde-fou : on ne doit pas filtrer "invoiceStatus = OVERDUE" tout seul,
    // mais bien la combinaison avec ISSUED/PARTIALLY_PAID.
    expect(args.where.invoiceStatus.in).toContain("ISSUED");
    expect(args.where.invoiceStatus.in).toContain("PARTIALLY_PAID");
  });
});
