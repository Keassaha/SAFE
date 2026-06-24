/**
 * SAFE — Navette : règles de permission PURES (testables sans I/O).
 *
 * Frontière doctrinale (docs/product/SPEC_aaliyah_home_navette.md) :
 *   - l'assistante PRÉPARE  → peut marquer « prêt pour revue » (ready_for_review)
 *   - l'avocate DÉCIDE      → peut « renvoyer » (sent_back) et « approuver » (approved)
 *   - question / info / reply : tout rôle interne
 *
 * `comptabilite` n'est pas un participant de la Navette (hors périmètre).
 */

import type { NavetteMessageType } from "@prisma/client";

export type NavetteRole = "admin_cabinet" | "avocat" | "assistante" | "comptabilite";

/** Rôles qui participent à la Navette. */
export const NAVETTE_INTERNAL_ROLES: NavetteRole[] = ["admin_cabinet", "avocat", "assistante"];

export function isNavetteParticipant(role: string): boolean {
  return (NAVETTE_INTERNAL_ROLES as string[]).includes(role);
}

function isLawyerOrAdmin(role: string): boolean {
  return role === "avocat" || role === "admin_cabinet";
}

function isAssistantOrAdmin(role: string): boolean {
  return role === "assistante" || role === "admin_cabinet";
}

/**
 * Qui peut ÉMETTRE un message de ce type ?
 * (l'admin du cabinet peut suppléer les deux rôles.)
 */
export function canSendNavetteType(role: string, type: NavetteMessageType): boolean {
  if (!isNavetteParticipant(role)) return false;
  switch (type) {
    case "sent_back":
    case "approved":
    case "invoice_ready":
      return isLawyerOrAdmin(role); // l'avocate décide / valide la facture
    case "ready_for_review":
      return isAssistantOrAdmin(role); // l'assistante prépare
    case "question":
    case "info":
    case "reply":
    case "document_ready": // une partie publie un document prêt
    case "acte_urgent": // signal dérivé (scan d'échéances), émis au nom d'une partie
      return true; // tout participant
    default:
      return false;
  }
}

/** Un message confidentiel n'est visible que par l'avocate / l'admin. */
export function canSeeConfidential(role: string): boolean {
  return isLawyerOrAdmin(role);
}
