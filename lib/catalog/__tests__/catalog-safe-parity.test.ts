import { describe, it, expect } from "vitest";
import { CATALOG_SAFE } from "../catalog-safe";
import { composeInterface } from "../compose-menu";

/**
 * Contrat de parité : le catalogue grounded doit reproduire EXACTEMENT le menu
 * de production actuel (components/layout/SidebarNav.tsx, NAV_ITEMS), groupe par
 * groupe et dans le bon ordre. Si quelqu'un modifie NAV_ITEMS sans mettre à jour
 * le catalogue (ou l'inverse), ce test casse.
 */
const EXPECTED_MENU: Record<string, string[]> = {
  aujourdhui: ["aujourdhui"],
  dashboard: ["dashboard"],
  gestion: ["clients", "dossiers", "file-assistante", "employees", "mes-heures"],
  finances: ["facturation", "comptabilite", "comptes", "temps"],
  outils: ["edition", "rapports", "safe-import"],
  parametres: ["parametres"],
};

describe("catalog-safe parité avec NAV_ITEMS", () => {
  it("compose exactement les mêmes groupes et items, dans l'ordre", () => {
    const allIds = CATALOG_SAFE.map((t) => t.id);
    const { menu } = composeInterface(CATALOG_SAFE, allIds);

    const composedByGroup = Object.fromEntries(
      menu.map((g) => [g.id, g.items.map((i) => i.id)]),
    );

    expect(composedByGroup).toEqual(EXPECTED_MENU);
  });

  it("toutes les pages du catalogue portent une route", () => {
    for (const tool of CATALOG_SAFE) {
      if (tool.placement.kind === "page") {
        expect(tool.route, `${tool.id} doit avoir une route`).toBeTruthy();
      }
    }
  });

  it("aucune dépendance manquante dans le catalogue complet", () => {
    const allIds = CATALOG_SAFE.map((t) => t.id);
    const { missingDependencies } = composeInterface(CATALOG_SAFE, allIds);
    expect(missingDependencies).toEqual([]);
  });
});
