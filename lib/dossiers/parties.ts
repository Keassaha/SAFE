/**
 * Plusieurs personnes sur un dossier : types + parsing partagés (client + serveur).
 * PAS d'import prisma ici (fichier importable depuis un composant client).
 * Doctrine : docs/product/SPEC_MULTI_CLIENTS_PARTIES_DOSSIER.md
 */

export type PartieExterneRole = "partie_adverse" | "tiers";

/**
 * Une personne AJOUTÉE à un dossier au-delà du client principal.
 * Le mandant principal reste piloté par `Dossier.clientId`, hors de cette liste.
 */
export type PartieDraft =
  | { nature: "co_client"; clientId: string }
  | { nature: "partie_externe"; nomAffiche: string; role: PartieExterneRole };

export const MAX_PARTIES_PAR_DOSSIER = 50;

const EXTERNE_ROLES: PartieExterneRole[] = ["partie_adverse", "tiers"];

/**
 * Parse le champ caché `partiesJson` du formulaire en liste sûre.
 * Tolérant : ignore silencieusement toute entrée mal formée, ne jette jamais.
 */
export function parsePartiesDrafts(json: string | null | undefined): PartieDraft[] {
  if (!json || !json.trim()) return [];
  let raw: unknown;
  try {
    raw = JSON.parse(json);
  } catch {
    return [];
  }
  if (!Array.isArray(raw)) return [];

  const out: PartieDraft[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const rec = item as Record<string, unknown>;
    if (rec.nature === "co_client") {
      const clientId = typeof rec.clientId === "string" ? rec.clientId.trim() : "";
      if (clientId) out.push({ nature: "co_client", clientId });
    } else if (rec.nature === "partie_externe") {
      const nomAffiche = typeof rec.nomAffiche === "string" ? rec.nomAffiche.trim() : "";
      const role = EXTERNE_ROLES.includes(rec.role as PartieExterneRole)
        ? (rec.role as PartieExterneRole)
        : "partie_adverse";
      if (nomAffiche) out.push({ nature: "partie_externe", nomAffiche, role });
    }
    if (out.length >= MAX_PARTIES_PAR_DOSSIER) break;
  }
  return out;
}
