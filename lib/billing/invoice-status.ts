/**
 * SAFE — Source de vérité pour l'état d'une facture.
 *
 * Doctrine: docs/accounting/INVOICE_STATUS_NORMALIZATION.md
 *
 * Les classifieurs et les where builders de ce module sont **les seuls** points
 * d'accès autorisés à l'état d'une facture. Plus aucune page ou service ne doit
 * filtrer Prisma par `statut: "envoyee"` ou équivalent en dur.
 *
 * Les fonctions sont :
 *   - pures côté classifieurs (zéro accès Prisma)
 *   - composables côté where builders (renvoient des `Prisma.InvoiceWhereInput`)
 *   - rétro-compatibles : `legacyStatutToInvoiceWhere` traduit le filtre URL FR.
 */

import type { Prisma, Invoice, InvoiceStatut, InvoiceStatusBilling, PaymentStatus } from "@prisma/client";

/* ───────── Catégories canoniques ───────── */

export type LifecycleCategory =
  | "draft"
  | "issued_active"
  | "partially_paid"
  | "overdue"
  | "paid"
  | "cancelled"
  | "credited";

/**
 * Vue minimale d'une facture suffisant à classifier son état.
 * Permet de tester sans devoir construire un objet Prisma complet.
 */
export interface InvoiceStateView {
  invoiceStatus: InvoiceStatusBilling | null;
  paymentStatus: PaymentStatus | null;
  dateEcheance: Date;
}

/* ───────── Classifieurs purs ───────── */

export function isInvoiceCancelled(inv: InvoiceStateView): boolean {
  return inv.invoiceStatus === "CANCELLED";
}

export function isInvoiceCredited(inv: InvoiceStateView): boolean {
  return inv.invoiceStatus === "CREDITED";
}

export function isInvoiceDraft(inv: InvoiceStateView): boolean {
  return inv.invoiceStatus === "DRAFT" || inv.invoiceStatus === "READY_TO_ISSUE";
}

export function isInvoiceIssued(inv: InvoiceStateView): boolean {
  // Toute facture émise (ISSUED, PARTIALLY_PAID, PAID, OVERDUE) — état documentaire.
  return (
    inv.invoiceStatus === "ISSUED" ||
    inv.invoiceStatus === "PARTIALLY_PAID" ||
    inv.invoiceStatus === "PAID" ||
    inv.invoiceStatus === "OVERDUE"
  );
}

export function isInvoicePaid(inv: InvoiceStateView): boolean {
  return inv.paymentStatus === "PAID" || inv.paymentStatus === "OVERPAID";
}

export function isInvoicePartiallyPaid(inv: InvoiceStateView): boolean {
  return isInvoiceIssued(inv) && inv.paymentStatus === "PARTIAL";
}

/**
 * « En retard » est dérivé : pas un état stocké.
 * Une facture émise non entièrement payée dont l'échéance est dépassée.
 */
export function isInvoiceOverdue(inv: InvoiceStateView, now: Date = new Date()): boolean {
  if (!isInvoiceIssued(inv)) return false;
  if (isInvoicePaid(inv)) return false;
  return inv.dateEcheance.getTime() < now.getTime();
}

export function getInvoiceLifecycleCategory(
  inv: InvoiceStateView,
  now: Date = new Date(),
): LifecycleCategory {
  if (isInvoiceCancelled(inv)) return "cancelled";
  if (isInvoiceCredited(inv)) return "credited";
  if (isInvoiceDraft(inv)) return "draft";
  if (isInvoicePaid(inv)) return "paid";
  if (isInvoiceOverdue(inv, now)) return "overdue";
  if (isInvoicePartiallyPaid(inv)) return "partially_paid";
  return "issued_active";
}

/* ───────── Mapper legacy ───────── */

/**
 * Dérive la valeur legacy `InvoiceStatut` à partir des sources de vérité canoniques.
 *
 * Ordre de priorité (le 1er match gagne) :
 *   1. cancelled/credited → "brouillon" (l'enum legacy n'a pas ces valeurs)
 *   2. paid → "payee"
 *   3. overdue → "en_retard"
 *   4. issued + partial → "partiellement_payee"
 *   5. issued → "envoyee"
 *   6. sinon → "brouillon"
 */
export function deriveLegacyStatut(
  inv: InvoiceStateView,
  now: Date = new Date(),
): InvoiceStatut {
  if (isInvoiceCancelled(inv) || isInvoiceCredited(inv)) return "brouillon";
  if (isInvoicePaid(inv)) return "payee";
  if (isInvoiceOverdue(inv, now)) return "en_retard";
  if (isInvoicePartiallyPaid(inv)) return "partiellement_payee";
  if (isInvoiceIssued(inv)) return "envoyee";
  return "brouillon";
}

/* ───────── Where builders Prisma ───────── */

/** Brouillons + prêts à émettre (workflow de validation). */
export function whereInvoiceDraft(): Prisma.InvoiceWhereInput {
  return { invoiceStatus: { in: ["DRAFT", "READY_TO_ISSUE"] } };
}

/**
 * Factures émises, encore actives (UNPAID ou PARTIAL), **non en retard**.
 * Correspond au bucket UI "envoyee".
 */
export function whereInvoiceIssuedActive(now: Date = new Date()): Prisma.InvoiceWhereInput {
  return {
    invoiceStatus: { in: ["ISSUED", "PARTIALLY_PAID", "OVERDUE"] },
    paymentStatus: { in: ["UNPAID", "PARTIAL"] },
    dateEcheance: { gte: now },
  };
}

/** Factures émises et partiellement payées. */
export function whereInvoicePartiallyPaid(): Prisma.InvoiceWhereInput {
  return {
    invoiceStatus: { in: ["ISSUED", "PARTIALLY_PAID", "OVERDUE"] },
    paymentStatus: "PARTIAL",
  };
}

/**
 * Factures en retard : émises, pas entièrement payées, échéance dépassée.
 * Calcul dynamique — l'enum `OVERDUE` n'est pas stocké en base.
 */
export function whereInvoiceOverdue(now: Date = new Date()): Prisma.InvoiceWhereInput {
  return {
    invoiceStatus: { in: ["ISSUED", "PARTIALLY_PAID", "OVERDUE"] },
    paymentStatus: { in: ["UNPAID", "PARTIAL"] },
    dateEcheance: { lt: now },
  };
}

/** Factures payées (intégralement ou en surplus). */
export function whereInvoicePaid(): Prisma.InvoiceWhereInput {
  return {
    paymentStatus: { in: ["PAID", "OVERPAID"] },
  };
}

/**
 * Bucket "factures émises pour rapports" : tout ce qui a été présenté au client.
 * Inclut PAID, PARTIAL, UNPAID + en retard. Exclut DRAFT, CANCELLED, CREDITED.
 */
export function whereInvoiceForReports(): Prisma.InvoiceWhereInput {
  return {
    invoiceStatus: { in: ["ISSUED", "PARTIALLY_PAID", "PAID", "OVERDUE"] },
  };
}

/* ───────── Filtre URL legacy → where canonique ───────── */

/**
 * Traduit un filtre URL `?statut=...` (compatible avec l'historique de l'app)
 * en `Prisma.InvoiceWhereInput`. Garde la rétro-compatibilité de l'UX.
 *
 * Toute valeur inconnue → `null` (ne filtre pas, équivaut à "tous").
 */
export function legacyStatutToInvoiceWhere(
  statut: string | null | undefined,
  now: Date = new Date(),
): Prisma.InvoiceWhereInput | null {
  if (!statut) return null;
  switch (statut) {
    case "brouillon":
      return whereInvoiceDraft();
    case "envoyee":
      return whereInvoiceIssuedActive(now);
    case "partiellement_payee":
      return whereInvoicePartiallyPaid();
    case "payee":
      return whereInvoicePaid();
    case "en_retard":
      return whereInvoiceOverdue(now);
    default:
      return null;
  }
}

/* ───────── Adapter pour Invoice complète ───────── */

/**
 * Adaptateur pratique : prend une `Invoice` complète (toutes les colonnes Prisma)
 * et retourne la vue minimale acceptée par les classifieurs.
 */
export function toInvoiceStateView(inv: Pick<Invoice, "invoiceStatus" | "paymentStatus" | "dateEcheance">): InvoiceStateView {
  return {
    invoiceStatus: inv.invoiceStatus,
    paymentStatus: inv.paymentStatus,
    dateEcheance: inv.dateEcheance,
  };
}
