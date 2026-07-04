import { describe, expect, it } from "vitest";
import { buildDossierListWhere } from "@/lib/dossiers/query";

/**
 * Vue active des dossiers : par défaut la LISTE masque les dossiers clôturés et
 * archivés (ils restent accessibles via le filtre de statut). Les statistiques,
 * elles, comptent tous les statuts (pas de flag). Ce test verrouille cette règle
 * et le fait qu'un filtre de statut explicite gagne toujours.
 */
describe("buildDossierListWhere — vue active / masquage des clôturés", () => {
  it("sans statut + excludeClosedByDefault → masque clôturés et archivés", () => {
    const where = buildDossierListWhere("cab_1", { excludeClosedByDefault: true });
    expect(where.statut).toEqual({ notIn: ["cloture", "archive"] });
  });

  it("sans statut ni flag (stats) → aucun filtre de statut (tous comptés)", () => {
    const where = buildDossierListWhere("cab_1", {});
    expect(where.statut).toBeUndefined();
  });

  it("filtre de statut explicite gagne, même avec le flag (voir les clôturés)", () => {
    const where = buildDossierListWhere("cab_1", {
      status: "cloture",
      excludeClosedByDefault: true,
    });
    expect(where.statut).toBe("cloture");
  });

  it("filtre statut « actif » explicite → statut actif", () => {
    const where = buildDossierListWhere("cab_1", { status: "actif", excludeClosedByDefault: true });
    expect(where.statut).toBe("actif");
  });

  it("le type « immobilier » est bien accepté par le filtre", () => {
    const where = buildDossierListWhere("cab_1", { type: "immobilier" });
    expect(where.type).toBe("immobilier");
  });

  it("porte toujours le cabinetId", () => {
    const where = buildDossierListWhere("cab_1", { excludeClosedByDefault: true });
    expect(where.cabinetId).toBe("cab_1");
  });
});
