import { describe, expect, it } from "vitest";
import {
  isInvoiceDraft,
  isInvoiceIssued,
  isInvoicePaid,
  isInvoicePartiallyPaid,
  isInvoiceOverdue,
  isInvoiceCancelled,
  isInvoiceCredited,
  getInvoiceLifecycleCategory,
  deriveLegacyStatut,
  whereInvoiceDraft,
  whereInvoiceIssuedActive,
  whereInvoiceOverdue,
  whereInvoicePaid,
  whereInvoicePartiallyPaid,
  whereInvoiceForReports,
  legacyStatutToInvoiceWhere,
} from "@/lib/billing/invoice-status";
import type { InvoiceStateView } from "@/lib/billing/invoice-status";

const NOW = new Date("2026-04-29T12:00:00Z");
const PAST = new Date("2026-04-01T00:00:00Z");
const FUTURE = new Date("2026-05-30T00:00:00Z");

function inv(over: Partial<InvoiceStateView> = {}): InvoiceStateView {
  return {
    invoiceStatus: "ISSUED",
    paymentStatus: "UNPAID",
    dateEcheance: FUTURE,
    ...over,
  };
}

/* ───────── Classifieurs ───────── */

describe("Classifieurs purs", () => {
  it("DRAFT et READY_TO_ISSUE → draft", () => {
    expect(isInvoiceDraft(inv({ invoiceStatus: "DRAFT" }))).toBe(true);
    expect(isInvoiceDraft(inv({ invoiceStatus: "READY_TO_ISSUE" }))).toBe(true);
    expect(isInvoiceDraft(inv({ invoiceStatus: "ISSUED" }))).toBe(false);
  });

  it("ISSUED/PARTIALLY_PAID/PAID/OVERDUE → issued", () => {
    expect(isInvoiceIssued(inv({ invoiceStatus: "ISSUED" }))).toBe(true);
    expect(isInvoiceIssued(inv({ invoiceStatus: "PARTIALLY_PAID" }))).toBe(true);
    expect(isInvoiceIssued(inv({ invoiceStatus: "PAID" }))).toBe(true);
    expect(isInvoiceIssued(inv({ invoiceStatus: "OVERDUE" }))).toBe(true);
    expect(isInvoiceIssued(inv({ invoiceStatus: "DRAFT" }))).toBe(false);
    expect(isInvoiceIssued(inv({ invoiceStatus: "CANCELLED" }))).toBe(false);
  });

  it("PAID et OVERPAID → paid", () => {
    expect(isInvoicePaid(inv({ paymentStatus: "PAID" }))).toBe(true);
    expect(isInvoicePaid(inv({ paymentStatus: "OVERPAID" }))).toBe(true);
    expect(isInvoicePaid(inv({ paymentStatus: "PARTIAL" }))).toBe(false);
    expect(isInvoicePaid(inv({ paymentStatus: "UNPAID" }))).toBe(false);
  });

  it("partiallyPaid = issued + PARTIAL", () => {
    expect(
      isInvoicePartiallyPaid(inv({ invoiceStatus: "ISSUED", paymentStatus: "PARTIAL" })),
    ).toBe(true);
    expect(
      isInvoicePartiallyPaid(inv({ invoiceStatus: "DRAFT", paymentStatus: "PARTIAL" })),
    ).toBe(false);
  });

  it("overdue = issued + non payée + échéance passée", () => {
    expect(
      isInvoiceOverdue(
        inv({ invoiceStatus: "ISSUED", paymentStatus: "UNPAID", dateEcheance: PAST }),
        NOW,
      ),
    ).toBe(true);
    expect(
      isInvoiceOverdue(
        inv({ invoiceStatus: "ISSUED", paymentStatus: "PARTIAL", dateEcheance: PAST }),
        NOW,
      ),
    ).toBe(true);
    // Payée → jamais en retard
    expect(
      isInvoiceOverdue(
        inv({ invoiceStatus: "ISSUED", paymentStatus: "PAID", dateEcheance: PAST }),
        NOW,
      ),
    ).toBe(false);
    // Échéance future → pas en retard
    expect(
      isInvoiceOverdue(
        inv({ invoiceStatus: "ISSUED", paymentStatus: "UNPAID", dateEcheance: FUTURE }),
        NOW,
      ),
    ).toBe(false);
    // Brouillon → jamais en retard
    expect(
      isInvoiceOverdue(
        inv({ invoiceStatus: "DRAFT", paymentStatus: "UNPAID", dateEcheance: PAST }),
        NOW,
      ),
    ).toBe(false);
  });

  it("cancelled / credited", () => {
    expect(isInvoiceCancelled(inv({ invoiceStatus: "CANCELLED" }))).toBe(true);
    expect(isInvoiceCredited(inv({ invoiceStatus: "CREDITED" }))).toBe(true);
  });
});

/* ───────── Catégorie canonique ───────── */

describe("getInvoiceLifecycleCategory", () => {
  it("cancelled prime sur tout", () => {
    expect(
      getInvoiceLifecycleCategory(
        inv({ invoiceStatus: "CANCELLED", paymentStatus: "PAID" }),
        NOW,
      ),
    ).toBe("cancelled");
  });

  it("credited", () => {
    expect(getInvoiceLifecycleCategory(inv({ invoiceStatus: "CREDITED" }), NOW)).toBe("credited");
  });

  it("paid prime sur overdue", () => {
    expect(
      getInvoiceLifecycleCategory(
        inv({ invoiceStatus: "ISSUED", paymentStatus: "PAID", dateEcheance: PAST }),
        NOW,
      ),
    ).toBe("paid");
  });

  it("overdue prime sur partial", () => {
    expect(
      getInvoiceLifecycleCategory(
        inv({ invoiceStatus: "ISSUED", paymentStatus: "PARTIAL", dateEcheance: PAST }),
        NOW,
      ),
    ).toBe("overdue");
  });

  it("partial → partially_paid", () => {
    expect(
      getInvoiceLifecycleCategory(
        inv({ invoiceStatus: "ISSUED", paymentStatus: "PARTIAL", dateEcheance: FUTURE }),
        NOW,
      ),
    ).toBe("partially_paid");
  });

  it("issued + UNPAID + future → issued_active", () => {
    expect(
      getInvoiceLifecycleCategory(
        inv({ invoiceStatus: "ISSUED", paymentStatus: "UNPAID", dateEcheance: FUTURE }),
        NOW,
      ),
    ).toBe("issued_active");
  });

  it("draft", () => {
    expect(getInvoiceLifecycleCategory(inv({ invoiceStatus: "DRAFT" }), NOW)).toBe("draft");
    expect(getInvoiceLifecycleCategory(inv({ invoiceStatus: "READY_TO_ISSUE" }), NOW)).toBe("draft");
  });
});

/* ───────── Mapper legacy ───────── */

describe("deriveLegacyStatut — couvre les 8 cas du cycle", () => {
  it("DRAFT → brouillon", () => {
    expect(deriveLegacyStatut(inv({ invoiceStatus: "DRAFT" }), NOW)).toBe("brouillon");
  });
  it("READY_TO_ISSUE → brouillon", () => {
    expect(deriveLegacyStatut(inv({ invoiceStatus: "READY_TO_ISSUE" }), NOW)).toBe("brouillon");
  });
  it("ISSUED + UNPAID + future → envoyee", () => {
    expect(
      deriveLegacyStatut(
        inv({ invoiceStatus: "ISSUED", paymentStatus: "UNPAID", dateEcheance: FUTURE }),
        NOW,
      ),
    ).toBe("envoyee");
  });
  it("ISSUED + PARTIAL + future → partiellement_payee", () => {
    expect(
      deriveLegacyStatut(
        inv({ invoiceStatus: "ISSUED", paymentStatus: "PARTIAL", dateEcheance: FUTURE }),
        NOW,
      ),
    ).toBe("partiellement_payee");
  });
  it("ISSUED + UNPAID + dateEcheance passée → en_retard", () => {
    expect(
      deriveLegacyStatut(
        inv({ invoiceStatus: "ISSUED", paymentStatus: "UNPAID", dateEcheance: PAST }),
        NOW,
      ),
    ).toBe("en_retard");
  });
  it("PAID → payee, peu importe le reste", () => {
    expect(
      deriveLegacyStatut(
        inv({ invoiceStatus: "ISSUED", paymentStatus: "PAID", dateEcheance: PAST }),
        NOW,
      ),
    ).toBe("payee");
  });
  it("OVERPAID → payee", () => {
    expect(
      deriveLegacyStatut(inv({ invoiceStatus: "ISSUED", paymentStatus: "OVERPAID" }), NOW),
    ).toBe("payee");
  });
  it("CANCELLED → brouillon (legacy n'a pas de cancelled)", () => {
    expect(deriveLegacyStatut(inv({ invoiceStatus: "CANCELLED" }), NOW)).toBe("brouillon");
  });
});

/* ───────── Where builders ───────── */

describe("Where builders Prisma", () => {
  it("whereInvoiceDraft cible DRAFT et READY_TO_ISSUE", () => {
    expect(whereInvoiceDraft()).toEqual({
      invoiceStatus: { in: ["DRAFT", "READY_TO_ISSUE"] },
    });
  });

  it("whereInvoiceIssuedActive: ISSUED + UNPAID/PARTIAL + dateEcheance >= now", () => {
    const w = whereInvoiceIssuedActive(NOW);
    expect(w.invoiceStatus).toEqual({ in: ["ISSUED", "PARTIALLY_PAID", "OVERDUE"] });
    expect(w.paymentStatus).toEqual({ in: ["UNPAID", "PARTIAL"] });
    expect(w.dateEcheance).toEqual({ gte: NOW });
  });

  it("whereInvoiceOverdue: ISSUED + UNPAID/PARTIAL + dateEcheance < now", () => {
    const w = whereInvoiceOverdue(NOW);
    expect(w.dateEcheance).toEqual({ lt: NOW });
    expect(w.paymentStatus).toEqual({ in: ["UNPAID", "PARTIAL"] });
  });

  it("whereInvoicePaid: paymentStatus PAID/OVERPAID", () => {
    expect(whereInvoicePaid()).toEqual({
      paymentStatus: { in: ["PAID", "OVERPAID"] },
    });
  });

  it("whereInvoicePartiallyPaid: invoiceStatus issued + paymentStatus PARTIAL", () => {
    const w = whereInvoicePartiallyPaid();
    expect(w.paymentStatus).toBe("PARTIAL");
  });

  it("whereInvoiceForReports: tout sauf DRAFT, CANCELLED, CREDITED", () => {
    expect(whereInvoiceForReports()).toEqual({
      invoiceStatus: { in: ["ISSUED", "PARTIALLY_PAID", "PAID", "OVERDUE"] },
    });
  });
});

/* ───────── Mapper URL legacy ───────── */

describe("legacyStatutToInvoiceWhere — compat URL", () => {
  it("brouillon → whereInvoiceDraft", () => {
    expect(legacyStatutToInvoiceWhere("brouillon", NOW)).toEqual(whereInvoiceDraft());
  });

  it("envoyee → whereInvoiceIssuedActive", () => {
    expect(legacyStatutToInvoiceWhere("envoyee", NOW)).toEqual(whereInvoiceIssuedActive(NOW));
  });

  it("partiellement_payee → whereInvoicePartiallyPaid", () => {
    expect(legacyStatutToInvoiceWhere("partiellement_payee", NOW)).toEqual(
      whereInvoicePartiallyPaid(),
    );
  });

  it("payee → whereInvoicePaid", () => {
    expect(legacyStatutToInvoiceWhere("payee", NOW)).toEqual(whereInvoicePaid());
  });

  it("en_retard → whereInvoiceOverdue", () => {
    expect(legacyStatutToInvoiceWhere("en_retard", NOW)).toEqual(whereInvoiceOverdue(NOW));
  });

  it("null/undefined/inconnu → null (ne filtre pas)", () => {
    expect(legacyStatutToInvoiceWhere(null)).toBeNull();
    expect(legacyStatutToInvoiceWhere(undefined)).toBeNull();
    expect(legacyStatutToInvoiceWhere("")).toBeNull();
    expect(legacyStatutToInvoiceWhere("inconnu")).toBeNull();
  });
});
