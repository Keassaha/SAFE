/**
 * SAFE — Helpers purs pour le signal "dossier prêt pour revue avocat".
 *
 * Doctrine: docs/product/READY_FOR_REVIEW_SIGNAL.md
 *
 * Toute la logique de transition / dédup-key vit ici, sans accès Prisma.
 * Le service `lib/services/ready-for-review-service.ts` consomme ces helpers.
 */

import type { PreparationState } from "./preparation-status";

/**
 * Détermine si une transition d'état doit déclencher un signal.
 *
 * Règle V1 (cf. doctrine §2) :
 *   - `before !== "pret_pour_revue"` ET `after === "pret_pour_revue"` → émettre.
 *   - Tous les autres cas (régression, état inchangé, transition vers autre état) → non.
 *
 * `before` peut être `null` quand on n'a pas l'état précédent (ex: première
 * évaluation après création). Dans ce cas, on n'émet PAS — un dossier neuf
 * n'est jamais légitimement prêt à la création.
 */
export function shouldEmitReadyForReviewSignal(
  before: PreparationState | null,
  after: PreparationState,
): boolean {
  if (before === null) return false;
  if (after !== "pret_pour_revue") return false;
  return before !== "pret_pour_revue";
}

/**
 * Construit la clé de déduplication canonique pour un dossier + son avocat
 * responsable. Stable, sans timestamp, utilisée par l'index unique partiel
 * `WHERE "readAt" IS NULL` côté base.
 *
 * Cas avocat absent : on utilise le sentinel `"no_avocat"` pour pouvoir
 * dédoublonner même quand le dossier n'a pas encore d'avocat assigné. Si plus
 * tard un avocat est assigné, la clé change → un nouveau signal peut naître,
 * ciblé cette fois.
 *
 * @example
 *   buildDedupeKey("dos_42", "user_avocat_1") // "dos_42:user_avocat_1"
 *   buildDedupeKey("dos_42", null)            // "dos_42:no_avocat"
 */
export function buildDedupeKey(
  dossierId: string,
  avocatResponsableId: string | null | undefined,
): string {
  return `${dossierId}:${avocatResponsableId ?? "no_avocat"}`;
}

/**
 * Décrit la raison d'émission d'un signal en V1.
 * Volontairement simple — le snapshot suffit à comprendre.
 */
export const READY_FOR_REVIEW_REASON = "preparation_complete" as const;
