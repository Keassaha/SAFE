import { describe, it, expect } from "vitest";
import {
  maxSequence,
  maxSequenceAnyPrefix,
  buildNumeroDossier,
} from "@/lib/dossiers/numero";

describe("maxSequence (par préfixe)", () => {
  it("retourne 0 quand aucun numéro ne matche", () => {
    expect(maxSequence([], 2026, "IMM")).toBe(0);
    expect(maxSequence(["2026-RE-00001"], 2026, "IMM")).toBe(0);
    expect(maxSequence(["2025-IMM-00009"], 2026, "IMM")).toBe(0);
  });

  it("extrait la plus grande séquence du même préfixe/année", () => {
    expect(
      maxSequence(["2026-IMM-00001", "2026-IMM-00007", "2026-IMM-00003"], 2026, "IMM"),
    ).toBe(7);
  });

  it("ignore les préfixes différents", () => {
    expect(maxSequence(["2026-IMM-00005", "2026-RE-00009"], 2026, "IMM")).toBe(5);
  });

  it("tolère null/undefined/espaces", () => {
    expect(
      maxSequence([null, undefined, "  2026-IMM-00004  ", ""], 2026, "IMM"),
    ).toBe(4);
  });

  it("mode legacy (sans préfixe) capture ^year-(\\d+)$", () => {
    expect(maxSequence(["2026-001", "2026-012", "2026-IMM-00099"], 2026)).toBe(12);
  });
});

describe("maxSequenceAnyPrefix (scope year)", () => {
  it("capture la séquence quel que soit le préfixe", () => {
    expect(
      maxSequenceAnyPrefix(["2026-IMM-00003", "2026-RE-00008", "2026-005"], 2026),
    ).toBe(8);
  });

  it("respecte l'année", () => {
    expect(maxSequenceAnyPrefix(["2025-IMM-00099", "2026-RE-00002"], 2026)).toBe(2);
  });
});

describe("buildNumeroDossier", () => {
  it("génère le format préfixé avec padding 5 par défaut", () => {
    expect(
      buildNumeroDossier({ year: 2026, existingNumeros: [], prefix: "IMM" }),
    ).toBe("2026-IMM-00001");
  });

  it("incrémente à partir du max existant (anti-réemploi)", () => {
    expect(
      buildNumeroDossier({
        year: 2026,
        existingNumeros: ["2026-IMM-00001", "2026-IMM-00002"],
        prefix: "IMM",
      }),
    ).toBe("2026-IMM-00003");
  });

  it("ne réutilise pas un numéro supprimé (max parsé, pas count)", () => {
    // 00002 supprimé : il reste 00001 et 00003 → suivant = 00004
    expect(
      buildNumeroDossier({
        year: 2026,
        existingNumeros: ["2026-IMM-00001", "2026-IMM-00003"],
        prefix: "IMM",
      }),
    ).toBe("2026-IMM-00004");
  });

  it("respecte un seqWidth personnalisé", () => {
    expect(
      buildNumeroDossier({ year: 2026, existingNumeros: [], prefix: "RE", seqWidth: 3 }),
    ).toBe("2026-RE-001");
  });

  it("format legacy AAAA-NNN sans préfixe (padding 3)", () => {
    expect(
      buildNumeroDossier({ year: 2026, existingNumeros: ["2026-001"] }),
    ).toBe("2026-002");
  });

  it("compteurs indépendants par préfixe en parallèle", () => {
    const existing = ["2026-IMM-00001", "2026-IMM-00002", "2026-RE-00001"];
    expect(buildNumeroDossier({ year: 2026, existingNumeros: existing, prefix: "IMM" })).toBe(
      "2026-IMM-00003",
    );
    expect(buildNumeroDossier({ year: 2026, existingNumeros: existing, prefix: "RE" })).toBe(
      "2026-RE-00002",
    );
  });
});
