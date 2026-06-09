/**
 * Pont catalogue -> navigation (ADR-009).
 *
 * Permet de faire dériver la whitelist de navigation (`activeNavIds` consommée
 * par components/layout/SidebarNav.tsx) du CATALOGUE plutôt que de la liste brute
 * `ongletsActifs`. C'est le point d'entrée concret de l'inversion dans le rendu.
 *
 * Garde-fou : piloté par le flag CATALOG_DRIVEN_NAV. Par défaut ÉTEINT.
 * Tant qu'il est éteint, le comportement de production est strictement inchangé.
 */

import type { Catalog } from "./types";
import { CATALOG_SAFE } from "./catalog-safe";
import { composeInterface } from "./compose-menu";

/** Le rendu doit-il être piloté par le catalogue ? (défaut : non) */
export const CATALOG_DRIVEN_NAV =
  process.env.CATALOG_DRIVEN_NAV === "1" ||
  process.env.CATALOG_DRIVEN_NAV === "true";

/**
 * Dérive la whitelist de navigation à partir d'un manifeste d'outils activés.
 *
 * On interprète `activatedToolIds` (aujourd'hui : le contenu de `ongletsActifs`)
 * comme le manifeste du cabinet, on le compose via le catalogue, et on renvoie
 * les ids de pages qui doivent apparaître dans le menu.
 *
 * Grâce à la parité catalog-safe <-> NAV_ITEMS, la sortie est identique à
 * l'entrée pour les outils standards. La valeur ajoutée apparaît dès qu'un outil
 * de domaine (ex: calculateur de patrimoine) entre dans le manifeste : il se
 * placera tout seul, sans toucher NAV_ITEMS.
 */
export function deriveActiveNavIds(
  activatedToolIds: string[],
  catalog: Catalog = CATALOG_SAFE,
): string[] {
  const { menu } = composeInterface(catalog, activatedToolIds);
  return menu.flatMap((group) => group.items.map((item) => item.id));
}
