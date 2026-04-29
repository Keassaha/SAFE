/**
 * SAFE — Doctrine dépenses / débours : helpers de classification.
 *
 * Source de vérité : docs/accounting/EXPENSES_AND_DISBURSEMENTS_DOCTRINE.md
 *
 * Le test décisif :
 *   « Est-ce qu'on va le refacturer à un client précis ? »
 *     - Oui  → DeboursDossier
 *     - Non  → CabinetExpense
 *     - "?"  → CabinetExpense + flag refacturable
 *
 * Ces helpers ne touchent à aucune persistance. Ils servent à :
 *   - le pipeline d'import bancaire (orientation auto)
 *   - les conversions manuelles dans l'UI (proposition par défaut)
 *   - les garde-fous des actions serveur (refus si incohérence)
 */

import type {
  ExpenseCategory,
  ExpenseClassificationInput,
} from "./types";

/**
 * Classifie un mouvement de trésorerie sortant.
 *
 * Règles :
 *  - Si l'objet est déjà un `DeboursDossier` (`isDeboursDossier=true`) → "client_disbursement".
 *  - Sinon, si `dossierId` est fourni ET `refacturable=true` → "client_disbursement".
 *  - Sinon, si la catégorie ressemble à des frais gouvernementaux ET `dossierId` fourni → "client_disbursement".
 *  - Sinon, si `refacturable=true` mais sans dossier → "ambiguous".
 *  - Sinon → "cabinet_expense".
 */
export function classifyExpense(input: ExpenseClassificationInput): ExpenseCategory {
  if (input.isDeboursDossier) return "client_disbursement";

  const hasDossier = Boolean(input.dossierId);
  const refacturable = Boolean(input.refacturable);
  const categoryName = (input.categoryName ?? "").toLowerCase();

  // Indices forts : catégorie "frais gouvernementaux" ou équivalent.
  const isGovFee = /\bgouvern|government|ircc|barreau|registry|registre|cour\s|court fee|filing fee\b/.test(categoryName);

  if (hasDossier && refacturable) return "client_disbursement";
  if (hasDossier && isGovFee) return "client_disbursement";
  if (refacturable && !hasDossier) return "ambiguous";
  return "cabinet_expense";
}

/** Raccourci : la dépense est-elle un coût du cabinet ? */
export function isCabinetExpense(input: ExpenseClassificationInput): boolean {
  return classifyExpense(input) === "cabinet_expense";
}

/** Raccourci : la dépense est-elle un débours pour un dossier ? */
export function isClientDisbursement(input: ExpenseClassificationInput): boolean {
  return classifyExpense(input) === "client_disbursement";
}

/**
 * Le coût peut-il être refacturé ? (réponse stricte).
 * Réponse `true` uniquement si on a déjà identifié un dossier ET un drapeau explicite.
 */
export function isRebillable(input: ExpenseClassificationInput): boolean {
  if (input.isDeboursDossier) return true;
  return Boolean(input.dossierId) && Boolean(input.refacturable);
}

/**
 * Garde-fou : refuse une combinaison incohérente avant écriture.
 *
 * Exemples bloqués :
 *  - `isDeboursDossier=true` mais aucun `dossierId` → impossible.
 *  - `refacturable=true` ET aucun `dossierId` ET aucun `clientId` mais marqué comme client_disbursement.
 *
 * Retourne `null` si tout est cohérent, sinon un message explicite.
 */
export function validateExpenseConsistency(input: ExpenseClassificationInput): string | null {
  if (input.isDeboursDossier && !input.dossierId) {
    return "Un débours dossier doit obligatoirement être rattaché à un dossierId.";
  }
  return null;
}
