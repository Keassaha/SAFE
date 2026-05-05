/**
 * SAFE — Dérivation canonique du `paymentStatus` d'une facture à partir de
 * son solde et du total déjà alloué.
 *
 * Centralisé pour pouvoir tester l'invariant indépendamment de Prisma et
 * éviter qu'il se duplique dans plusieurs services.
 *
 * Doctrine: voir docs/accounting/INVOICE_STATUS_NORMALIZATION.md
 */

import type { PaymentStatus } from "@prisma/client";

/**
 * Règle:
 *   - balanceDue ≤ 0           → PAID         (intégralement encaissé ou plus)
 *   - balanceDue > 0 et paid>0 → PARTIAL      (paiement(s) reçu(s) mais reste un solde)
 *   - balanceDue > 0 et paid=0 → UNPAID
 */
export function derivePaymentStatus(
  balanceDue: number,
  totalPaid: number,
): PaymentStatus {
  if (balanceDue <= 0) return "PAID";
  if (totalPaid > 0) return "PARTIAL";
  return "UNPAID";
}
