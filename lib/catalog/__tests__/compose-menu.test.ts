import { describe, it, expect } from "vitest";
import { CATALOG } from "../catalog";
import {
  composeInterface,
  suggestToolsForDomains,
} from "../compose-menu";

describe("composeInterface", () => {
  it("place le calculateur de patrimoine dans le groupe outils quand il est activé", () => {
    const ids = suggestToolsForDomains(CATALOG, ["famille"]);
    const { menu } = composeInterface(CATALOG, ids);
    const outils = menu.find((g) => g.id === "outils");
    expect(outils?.items.map((i) => i.id)).toContain("calc-patrimoine-familial");
  });

  it("n'affiche pas l'outil famille pour un cabinet immobilier", () => {
    const ids = suggestToolsForDomains(CATALOG, ["immobilier"]);
    expect(ids).not.toContain("calc-patrimoine-familial");
    expect(ids).toContain("calc-droits-mutation");
  });

  it("inclut toujours les outils cœur (domains vides)", () => {
    const ids = suggestToolsForDomains(CATALOG, ["immigration"]);
    expect(ids).toContain("clients");
    expect(ids).toContain("facturation");
  });

  it("retire les groupes de menu vides", () => {
    const { menu } = composeInterface(CATALOG, ["clients"]);
    expect(menu.every((g) => g.items.length > 0)).toBe(true);
    expect(menu.find((g) => g.id === "finances")).toBeUndefined();
  });

  it("trie les pages d'un groupe par order", () => {
    const { menu } = composeInterface(
      CATALOG,
      suggestToolsForDomains(CATALOG, ["famille", "immobilier", "immigration"]),
    );
    const outils = menu.find((g) => g.id === "outils");
    const orders = outils?.items.map((i) => i.id) ?? [];
    expect(orders.indexOf("calc-patrimoine-familial")).toBeLessThan(
      orders.indexOf("calc-droits-mutation"),
    );
  });

  it("signale une dépendance manquante", () => {
    // patrimoine requiert "dossiers" : on l'active sans la dépendance.
    const { missingDependencies } = composeInterface(CATALOG, [
      "calc-patrimoine-familial",
    ]);
    const entry = missingDependencies.find(
      (d) => d.toolId === "calc-patrimoine-familial",
    );
    expect(entry?.missing).toContain("dossiers");
  });

  it("range widgets et actions hors menu, sur leur hôte", () => {
    const { injections } = composeInterface(CATALOG, [
      "widget-echeances-famille",
      "action-checklist-cloture-immo",
    ]);
    expect(injections).toHaveLength(2);
    expect(injections.find((i) => i.kind === "widget")?.host).toBe("dashboard");
    expect(injections.find((i) => i.kind === "action")?.host).toBe(
      "dossier-detail",
    );
  });
});
