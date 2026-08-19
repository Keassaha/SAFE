/**
 * SAFE — Le lien de collecte des pièces.
 *
 * Spec : docs/product/SPEC_COLLECTE_PIECES_CLIENT.md
 *
 * Le client dépose ses pièces sans créer de compte. Le patron du lien signé existe
 * déjà deux fois en production : on le reprend, on n'en invente pas un troisième.
 *
 * CE QUE LE LIEN DONNE, ET CE QU'IL NE DONNE PAS
 *
 * Il ouvre UNE page : la liste des pièces attendues de ce dossier, et le dépôt. Il ne
 * donne accès à rien d'autre. Le client ne voit jamais les notes internes, la
 * stratégie, la rentabilité, ni les autres dossiers. Le cloisonnement n'est pas une
 * option d'affichage, il est dans la requête : la page ne lit que `ExpectedDocument`
 * et le strict nécessaire du dossier.
 */

import { randomBytes } from "node:crypto";

/** Durée de validité par défaut. Alignée sur le lien de facture. */
export const COLLECTE_EXPIRATION_JOURS = 30;

/**
 * Un jeton de 32 octets, comme le lien de facture et l'accès d'inspection.
 *
 * `base64url` plutôt que `hex` : même entropie, URL plus courte, et rien à échapper
 * quand le client le reçoit par courriel ou par message.
 */
export function genererCollecteToken(): string {
  return randomBytes(32).toString("base64url");
}

export function calculerExpiration(depuis: Date, jours = COLLECTE_EXPIRATION_JOURS): Date {
  const d = new Date(depuis);
  d.setDate(d.getDate() + jours);
  return d;
}

export type VerdictLien =
  | { valide: true }
  | { valide: false; motif: "inexistant" | "expire" | "revoque" };

/**
 * Décide si un lien donne accès. Fonction PURE, pour que la règle soit testable sans
 * base et qu'elle ne puisse pas diverger entre la page et l'API de dépôt.
 *
 * L'ordre des refus compte : un lien révoqué et expiré est d'abord **révoqué**, parce
 * que c'est une décision du cabinet et non le simple passage du temps.
 */
export function verifierLien(
  dossier: { collecteToken: string | null; collecteTokenExpiresAt: Date | null } | null,
  maintenant: Date,
): VerdictLien {
  if (!dossier) return { valide: false, motif: "inexistant" };
  if (!dossier.collecteToken) return { valide: false, motif: "revoque" };
  if (!dossier.collecteTokenExpiresAt) return { valide: false, motif: "revoque" };
  if (dossier.collecteTokenExpiresAt <= maintenant) return { valide: false, motif: "expire" };
  return { valide: true };
}

/** Clés du namespace `collecte`. Le module ne rend jamais de phrase toute faite. */
export type CleCollecte =
  | "lienExpire"
  | "lienInactif"
  | "formatRefuse"
  | "fichierVide"
  | "fichierTropLourd";

/**
 * Ce que le client lit quand son lien ne fonctionne plus. Jamais un code.
 *
 * La fonction rend une CLÉ, pas une phrase : le client peut être anglophone, et la
 * langue se décide au bord, d'après la fiche du client. Un module de sécurité qui
 * fabrique du français impose sa langue à tout le monde.
 */
export function cleRefus(motif: "inexistant" | "expire" | "revoque"): CleCollecte {
  switch (motif) {
    case "expire":
      return "lienExpire";
    case "revoque":
      return "lienInactif";
    default:
      // On ne dit pas « dossier introuvable » : cela confirmerait au visiteur qu'un
      // autre jeton pourrait exister. Même clé que pour un lien révoqué.
      return "lienInactif";
  }
}

/** Types de fichiers acceptés au dépôt. */
export const TYPES_ACCEPTES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/heic",
] as const;

/** 25 Mo. Au-delà, un scan de relevés bancaires devient ingérable des deux côtés. */
export const TAILLE_MAX_OCTETS = 25 * 1024 * 1024;

export type VerdictFichier = { ok: true } | { ok: false; cle: CleCollecte };

/**
 * Contrôles à l'entrée. Volontairement peu nombreux et tous explicables au client.
 *
 * Ce ne sont PAS les contrôles de la spec §10 (qualité de scan, pages manquantes,
 * OCR). Ceux-là supposent de lire le contenu, et ils viendront. Ici on refuse
 * seulement ce qui ne peut pas être traité du tout, et on le dit en clair.
 */
export function verifierFichier(f: { type: string; size: number }): VerdictFichier {
  if (!TYPES_ACCEPTES.includes(f.type as (typeof TYPES_ACCEPTES)[number])) {
    return { ok: false, cle: "formatRefuse" };
  }
  if (f.size <= 0) {
    return { ok: false, cle: "fichierVide" };
  }
  if (f.size > TAILLE_MAX_OCTETS) {
    return { ok: false, cle: "fichierTropLourd" };
  }
  return { ok: true };
}
