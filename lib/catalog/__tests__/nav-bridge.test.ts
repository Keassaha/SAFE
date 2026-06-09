import { describe, it, expect } from "vitest";
import { deriveActiveNavIds } from "../nav-bridge";
import { CATALOG_SAFE } from "../catalog-safe";
import type { Catalog } from "../types";

describe("deriveActiveNavIds", () => {
  it("est un pass-through pour les outils standards (parité)", () => {
    const ids = CATALOG_SAFE.map((t) => t.id);
    const derived = deriveActiveNavIds(ids);
    expect(new Set(derived)).toEqual(new Set(ids));
  });

  it("ignore les ids inconnus du catalogue", () => {
    const derived = deriveActiveNavIds(["clients", "id-inexistant"]);
    expect(derived).toContain("clients");
    expect(derived).not.toContain("id-inexistant");
  });

  it("place un outil de domaine sans toucher au reste", () => {
    // Catalogue augmenté d'un outil de domaine dans le groupe outils.
    const augmented: Catalog = [
      ...CATALOG_SAFE,
      {
        id: "calc-patrimoine-familial",
        label: "Calculateur de patrimoine familial",
        description: "test",
        domains: ["famille"],
        placement: { kind: "page", group: "outils", order: 10 },
        route: "/outils/patrimoine-familial",
        status: "ga",
      },
    ];
    const derived = deriveActiveNavIds(
      ["clients", "edition", "calc-patrimoine-familial"],
      augmented,
    );
    expect(derived).toContain("calc-patrimoine-familial");
    expect(derived).toContain("clients");
  });
});
