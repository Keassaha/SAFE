/**
 * Politique de saisie manuelle au journal général.
 *
 * Règle de séparation des flux (B-1 r.5 QC / By-Law 9 ON) : la saisie manuelle est
 * RÉSERVÉE aux AJUSTEMENTS et CORRECTIONS documentés. Les factures, paiements,
 * dépenses, débours et mouvements de fidéicommis DOIVENT passer par leur module
 * métier, sinon double comptage et flux mélangés au journal d'administration.
 *
 * Logique pure (aucune dépendance Prisma/UI) pour être testable directement.
 */

import type { JournalTransactionType } from "@prisma/client";

export const MANUAL_ALLOWED_TYPES: JournalTransactionType[] = [
  "AJUSTEMENT",
  "CORRECTION",
];

/** Vrai si ce type d'écriture peut être créé à la main au journal général. */
export function isManualEntryTypeAllowed(type: JournalTransactionType): boolean {
  return MANUAL_ALLOWED_TYPES.includes(type);
}
