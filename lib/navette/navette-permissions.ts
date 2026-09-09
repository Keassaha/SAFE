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

/* ═══════════════════ Décider, résoudre, voir ═══════════════════
 *
 * Ajouté le 2026-09-05. Jusque-là, l'écran seul décidait qui pouvait
 * approuver : les actions serveur ne vérifiaient que la session et le
 * cabinet. Un avocat pouvait approuver un dossier sans qu'aucune demande
 * existe, et n'importe quel participant pouvait résoudre le message d'un
 * autre en connaissant son identifiant.
 *
 * Ces trois helpers sont PURS : ils prennent l'instantané du message déjà
 * lu en base et rendent un verdict. Le service les appelle, l'écran les
 * appelle aussi pour n'afficher que ce qui aboutira.
 */

/** Le seul rôle qui supplée un destinataire. Explicite, jamais déduit du métier. */
export function hasNavetteAdminOverride(role: string): boolean {
  return role === "admin_cabinet";
}

/** Instantané d'un message, tel qu'il est lu en base. */
export interface NavetteMessageSnapshot {
  type: NavetteMessageType;
  recipientId: string | null;
  resolvedAt: Date | null;
  confidentiel: boolean;
}

export type NavetteGuardReason =
  | "forbidden"
  | "already_resolved"
  | "not_a_request";

export type NavetteGuard = { ok: true } | { ok: false; reason: NavetteGuardReason };

/** Un message est-il lisible par ce rôle ? (cloison du confidentiel) */
export function canViewNavetteMessage(
  role: string,
  message: { confidentiel: boolean },
): boolean {
  if (!isNavetteParticipant(role)) return false;
  return !message.confidentiel || canSeeConfidential(role);
}

/** Les types qui portent une DEMANDE, c'est-à-dire qui peuvent rester à traiter. */
export const NAVETTE_REQUEST_TYPES: NavetteMessageType[] = [
  "ready_for_review",
  "sent_back",
  "question",
  "document_ready",
  "invoice_ready",
  "acte_urgent",
];

export function isNavetteRequestType(type: NavetteMessageType): boolean {
  return NAVETTE_REQUEST_TYPES.includes(type);
}

/**
 * Approuver ou demander une correction VISE une demande de révision précise.
 *
 * Trois conditions cumulatives, dans l'ordre où elles se lisent :
 *   1. la demande est bien une demande de révision (`ready_for_review`) ;
 *   2. elle est encore ouverte — une décision ne se prend pas deux fois ;
 *   3. elle vise cette personne, ou cette personne a la suppléance admin.
 *
 * Limite assumée : une demande sans destinataire (dossier sans avocate
 * responsable) n'est décidable que par l'admin du cabinet. C'est le prix de
 * la règle « jamais approuver parce qu'on est avocat ».
 */
export function checkNavetteDecision(args: {
  role: string;
  userId: string;
  decision: "approve" | "send_back";
  request: NavetteMessageSnapshot;
}): NavetteGuard {
  const { role, userId, decision, request } = args;
  if (!canViewNavetteMessage(role, request)) return { ok: false, reason: "forbidden" };
  if (request.type !== "ready_for_review") return { ok: false, reason: "not_a_request" };
  if (request.resolvedAt) return { ok: false, reason: "already_resolved" };

  const emitted: NavetteMessageType = decision === "approve" ? "approved" : "sent_back";
  if (!canSendNavetteType(role, emitted)) return { ok: false, reason: "forbidden" };

  const cible = request.recipientId !== null && request.recipientId === userId;
  if (!cible && !hasNavetteAdminOverride(role)) return { ok: false, reason: "forbidden" };
  return { ok: true };
}

/** Marquer traité : réservé au destinataire du message, ou à l'admin. */
export function checkNavetteResolve(args: {
  role: string;
  userId: string;
  message: NavetteMessageSnapshot;
}): NavetteGuard {
  const { role, userId, message } = args;
  if (!canViewNavetteMessage(role, message)) return { ok: false, reason: "forbidden" };
  if (!isNavetteRequestType(message.type)) return { ok: false, reason: "not_a_request" };
  if (message.resolvedAt) return { ok: false, reason: "already_resolved" };
  const cible = message.recipientId !== null && message.recipientId === userId;
  if (!cible && !hasNavetteAdminOverride(role)) return { ok: false, reason: "forbidden" };
  return { ok: true };
}
