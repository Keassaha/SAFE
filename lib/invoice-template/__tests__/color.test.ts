import { describe, it, expect } from "vitest";
import {
  normalizeHex,
  hexToRgb,
  mixWithWhite,
  relativeLuminance,
  contrastWithWhite,
  isAccentDarkEnough,
  derivePalette,
  DEFAULT_ACCENT,
} from "../color";

describe("normalizeHex", () => {
  it("normalise diverses saisies en #rrggbb minuscule", () => {
    expect(normalizeHex("#7A3B2E")).toBe("#7a3b2e");
    expect(normalizeHex("7a3b2e")).toBe("#7a3b2e");
    expect(normalizeHex("#abc")).toBe("#aabbcc");
    expect(normalizeHex("  #FFF  ")).toBe("#ffffff");
  });
  it("rejette les saisies invalides", () => {
    expect(normalizeHex("")).toBeNull();
    expect(normalizeHex(null)).toBeNull();
    expect(normalizeHex("#12")).toBeNull();
    expect(normalizeHex("xyz123")).toBeNull();
    expect(normalizeHex("#1234567")).toBeNull();
  });
});

describe("hexToRgb", () => {
  it("convertit correctement", () => {
    expect(hexToRgb("#000000")).toEqual({ r: 0, g: 0, b: 0 });
    expect(hexToRgb("#ffffff")).toEqual({ r: 255, g: 255, b: 255 });
    expect(hexToRgb("#7a3b2e")).toEqual({ r: 122, g: 59, b: 46 });
  });
  it("retourne null si invalide", () => {
    expect(hexToRgb("nope")).toBeNull();
  });
});

describe("mixWithWhite", () => {
  it("0 = couleur pure, 1 = blanc", () => {
    expect(mixWithWhite("#7a3b2e", 0)).toBe("#7a3b2e");
    expect(mixWithWhite("#7a3b2e", 1)).toBe("#ffffff");
  });
  it("produit une teinte plus claire entre les deux", () => {
    const soft = mixWithWhite("#7a3b2e", 0.92);
    expect(relativeLuminance(soft)).toBeGreaterThan(relativeLuminance("#7a3b2e"));
  });
});

describe("contraste / luminance", () => {
  it("le blanc a la luminance max, le noir la min", () => {
    expect(relativeLuminance("#ffffff")).toBeCloseTo(1, 5);
    expect(relativeLuminance("#000000")).toBeCloseTo(0, 5);
  });
  it("contraste blanc/noir ≈ 21", () => {
    expect(contrastWithWhite("#000000")).toBeCloseTo(21, 0);
  });
});

describe("isAccentDarkEnough", () => {
  it("accepte des accents foncés usuels", () => {
    expect(isAccentDarkEnough("#7a3b2e")).toBe(true); // marron Derisier
    expect(isAccentDarkEnough("#1e3a5f")).toBe(true); // marine
    expect(isAccentDarkEnough("#14532d")).toBe(true); // sapin
    expect(isAccentDarkEnough("#000000")).toBe(true);
  });
  it("refuse les couleurs trop claires (texte blanc illisible)", () => {
    expect(isAccentDarkEnough("#ffd700")).toBe(false); // jaune or
    expect(isAccentDarkEnough("#ffffff")).toBe(false);
    expect(isAccentDarkEnough("#e6f2ea")).toBe(false); // vert très pâle
  });
  it("refuse une saisie invalide", () => {
    expect(isAccentDarkEnough("pas-un-hex")).toBe(false);
  });
});

describe("derivePalette", () => {
  it("dérive accentSoft et onBand plus clairs que l'accent", () => {
    const p = derivePalette("#7a3b2e");
    expect(p.accent).toBe("#7a3b2e");
    expect(relativeLuminance(p.accentSoft)).toBeGreaterThan(relativeLuminance(p.accent));
    expect(relativeLuminance(p.onBand)).toBeGreaterThan(relativeLuminance(p.accent));
  });
  it("retombe sur l'accent par défaut si trop clair ou invalide", () => {
    expect(derivePalette("#ffd700").accent).toBe(DEFAULT_ACCENT);
    expect(derivePalette("nope").accent).toBe(DEFAULT_ACCENT);
    expect(derivePalette(null).accent).toBe(DEFAULT_ACCENT);
  });
  it("normalise un accent foncé valide saisi en majuscules sans dièse", () => {
    expect(derivePalette("1E3A5F").accent).toBe("#1e3a5f");
  });
});
