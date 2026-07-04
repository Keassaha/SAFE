/**
 * Garde-fous du paiement de facture EN LIGNE (ADR-012).
 *
 * Deux invariants durs :
 *  1. Le fidéicommis ne passe JAMAIS par le processeur. Un paiement en ligne crée
 *     TOUJOURS un `Payment` en compte OPERATING, jamais `trust` (doctrine Barreau).
 *  2. Le bouton « Payer » n'apparaît que pour une facture réellement payable
 *     (solde dû > 0 et statut émis), et seulement si le cabinet a un compte Stripe
 *     Connect capable d'encaisser.
 *
 * Module PUR (hors le flag env) : testable sans Stripe ni base.
 */
import type { SourceAccountType } from "@prisma/client";

/** Flag de branchement. Défaut ÉTEINT : aucun bouton payer tant qu'il l'est. */
export const ONLINE_PAYMENTS_ENABLED =
  process.env.ONLINE_PAYMENTS_ENABLED === "1" ||
  process.env.ONLINE_PAYMENTS_ENABLED === "true";

/**
 * Compte crédité par un paiement en ligne : TOUJOURS `operating`. Jamais `trust`.
 * Constante centrale : toute création de Payment issue d'un encaissement en ligne
 * DOIT utiliser cette valeur. Verrouillé par test.
 */
export const ONLINE_PAYMENT_SOURCE_ACCOUNT: SourceAccountType = "operating";

/** Statuts de facturation pour lesquels un encaissement est pertinent. */
const PAYABLE_STATUSES = new Set(["ISSUED", "PARTIALLY_PAID", "OVERDUE"]);

/** Forme minimale de facture présentée nécessaire à la décision. */
export interface PayableInvoiceView {
  invoiceStatus?: string | null;
  totals: { balanceDue: number };
}

/**
 * La facture est-elle payable en ligne ? Solde dû strictement positif ET, si le
 * statut de facturation est connu, il doit être un statut payable. Une facture au
 * brouillon, annulée, déjà payée ou créditée n'est jamais payable.
 */
export function isInvoiceOnlinePayable(inv: PayableInvoiceView): boolean {
  if (!(inv.totals.balanceDue > 0)) return false;
  const status = (inv.invoiceStatus ?? "").trim();
  if (status && !PAYABLE_STATUSES.has(status)) return false;
  return true;
}

/**
 * Le bouton payer en ligne doit-il être offert ? Combine le flag, la capacité
 * Connect du cabinet, et la payabilité de la facture. Ne renvoie jamais true si
 * le flag est éteint.
 */
export function canOfferOnlinePayment(params: {
  connectChargesEnabled: boolean;
  invoice: PayableInvoiceView;
}): boolean {
  return (
    ONLINE_PAYMENTS_ENABLED &&
    params.connectChargesEnabled === true &&
    isInvoiceOnlinePayable(params.invoice)
  );
}
