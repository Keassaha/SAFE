/**
 * Positionnement d'un menu flottant.
 *
 * Extrait de `ClientQuickActions` pour servir tous les menus du produit : il
 * existait déjà, testé, et le registre clients était en train d'en réécrire un
 * second, plus faible. Un seul mécanisme de menu, une seule suite de tests.
 *
 * Le calcul est volontairement pur (aucun accès au DOM) : il se teste sans
 * navigateur. Voir `components/clients/registry/__tests__/computeMenuPosition.test.ts`.
 */

export const MENU_WIDTH_PX = 224; // équivalent w-56
export const VIEWPORT_MARGIN = 8;

export type MenuPosition = { left: number; top: number; placement: "below" | "above" };

export function computeMenuPosition(
  triggerRect: { top: number; bottom: number; left: number; right: number },
  menuHeight: number,
  viewport?: { width: number; height: number },
): MenuPosition {
  const viewportW = viewport?.width ?? (typeof window !== "undefined" ? window.innerWidth : 1024);
  const viewportH = viewport?.height ?? (typeof window !== "undefined" ? window.innerHeight : 768);

  // Aligné à droite du déclencheur par défaut : les actions vivent à droite.
  let left = triggerRect.right - MENU_WIDTH_PX;
  if (left < VIEWPORT_MARGIN) left = Math.max(VIEWPORT_MARGIN, triggerRect.left);
  if (left + MENU_WIDTH_PX > viewportW - VIEWPORT_MARGIN) {
    left = viewportW - MENU_WIDTH_PX - VIEWPORT_MARGIN;
  }

  let top = triggerRect.bottom + 8;
  let placement: MenuPosition["placement"] = "below";
  if (menuHeight > 0 && top + menuHeight > viewportH - VIEWPORT_MARGIN) {
    const flippedTop = triggerRect.top - menuHeight - 8;
    if (flippedTop > VIEWPORT_MARGIN) {
      top = flippedTop;
      placement = "above";
    } else {
      top = Math.max(VIEWPORT_MARGIN, viewportH - menuHeight - VIEWPORT_MARGIN);
    }
  }
  return { left, top, placement };
}
