import { describe, it, expect } from "vitest";
import {
  parseDossierTaxonomy,
  getSubjectByCode,
  submattersForSubject,
  subjectCodeToDossierType,
  localizedLabel,
  DEFAULT_NUMBERING,
  DERISIER_DOSSIER_TAXONOMY,
} from "@/lib/dossiers/taxonomy";

describe("parseDossierTaxonomy (défensif)", () => {
  it("retourne null pour config absente/malformée", () => {
    expect(parseDossierTaxonomy(null)).toBeNull();
    expect(parseDossierTaxonomy(undefined)).toBeNull();
    expect(parseDossierTaxonomy("nope")).toBeNull();
    expect(parseDossierTaxonomy({})).toBeNull();
    expect(parseDossierTaxonomy({ dossierTaxonomy: {} })).toBeNull();
  });

  it("retourne null si aucun sujet valide", () => {
    expect(
      parseDossierTaxonomy({ dossierTaxonomy: { subjects: [{ code: "X" }] } }),
    ).toBeNull(); // pas de prefix → sujet invalide
  });

  it("parse un sujet minimal et applique le fallback de libellés", () => {
    const tax = parseDossierTaxonomy({
      dossierTaxonomy: { subjects: [{ code: "IMM", prefix: "IMM" }] },
    });
    expect(tax).not.toBeNull();
    expect(tax!.subjects).toHaveLength(1);
    expect(tax!.subjects[0]).toEqual({
      code: "IMM",
      prefix: "IMM",
      labelFr: "IMM",
      labelEn: "IMM",
    });
  });

  it("applique la numérotation par défaut si absente", () => {
    const tax = parseDossierTaxonomy({
      dossierTaxonomy: { subjects: [{ code: "RE", prefix: "RE" }] },
    });
    expect(tax!.numbering).toEqual(DEFAULT_NUMBERING);
  });

  it("lit seqWidth et scope quand fournis", () => {
    const tax = parseDossierTaxonomy({
      dossierTaxonomy: {
        numbering: { seqWidth: 4, scope: "year" },
        subjects: [{ code: "RE", prefix: "RE" }],
      },
    });
    expect(tax!.numbering).toEqual({ seqWidth: 4, scope: "year" });
  });

  it("filtre les sous-matières invalides", () => {
    const tax = parseDossierTaxonomy({
      dossierTaxonomy: {
        subjects: [{ code: "IMM", prefix: "IMM" }],
        submatters: {
          IMM: [{ labelFr: "Parrainage", labelEn: "Sponsorship" }, { foo: "bar" }],
        },
      },
    });
    expect(tax!.submatters.IMM).toHaveLength(1);
    expect(tax!.submatters.IMM[0]).toEqual({ labelFr: "Parrainage", labelEn: "Sponsorship" });
  });
});

describe("helpers", () => {
  it("getSubjectByCode trouve / retourne null", () => {
    expect(getSubjectByCode(DERISIER_DOSSIER_TAXONOMY, "IMM")?.prefix).toBe("IMM");
    expect(getSubjectByCode(DERISIER_DOSSIER_TAXONOMY, "ZZZ")).toBeNull();
    expect(getSubjectByCode(DERISIER_DOSSIER_TAXONOMY, null)).toBeNull();
  });

  it("submattersForSubject retourne toujours un tableau", () => {
    expect(submattersForSubject(DERISIER_DOSSIER_TAXONOMY, "RE").length).toBeGreaterThan(0);
    expect(submattersForSubject(DERISIER_DOSSIER_TAXONOMY, "LAO")).toEqual([]);
    expect(submattersForSubject(DERISIER_DOSSIER_TAXONOMY, null)).toEqual([]);
  });

  it("subjectCodeToDossierType mappe les codes connus / défaut 'autre'", () => {
    expect(subjectCodeToDossierType("IMM")).toBe("immigration");
    expect(subjectCodeToDossierType("RE")).toBe("immobilier");
    expect(subjectCodeToDossierType("FA")).toBe("droit_famille");
    expect(subjectCodeToDossierType("BU")).toBe("corporate");
    // Codes sans équivalent enum direct → "autre".
    expect(subjectCodeToDossierType("LAO")).toBe("autre");
    expect(subjectCodeToDossierType("AS")).toBe("autre");
    expect(subjectCodeToDossierType("WE")).toBe("autre");
    // Robustesse : casse / espaces / null.
    expect(subjectCodeToDossierType(" imm ")).toBe("immigration");
    expect(subjectCodeToDossierType(null)).toBe("autre");
    expect(subjectCodeToDossierType(undefined)).toBe("autre");
  });

  it("localizedLabel suit la locale avec fallback FR", () => {
    const item = { labelFr: "Parrainage", labelEn: "Sponsorship" };
    expect(localizedLabel(item, "en")).toBe("Sponsorship");
    expect(localizedLabel(item, "en-CA")).toBe("Sponsorship");
    expect(localizedLabel(item, "fr")).toBe("Parrainage");
    expect(localizedLabel({ labelFr: "Seul FR", labelEn: "" }, "en")).toBe("Seul FR");
  });
});

describe("DERISIER_DOSSIER_TAXONOMY (catalogue email Aaliyah)", () => {
  it("contient les 9 sujets (8 email + AS décision Q1)", () => {
    expect(DERISIER_DOSSIER_TAXONOMY.subjects).toHaveLength(9);
    const codes = DERISIER_DOSSIER_TAXONOMY.subjects.map((s) => s.code);
    expect(codes).toEqual(["RE", "LAO", "IMM", "BS", "MIS", "WE", "FA", "BU", "AS"]);
  });

  it("numérotation par préfixe avec padding 5 (Q2)", () => {
    expect(DERISIER_DOSSIER_TAXONOMY.numbering).toEqual({ seqWidth: 5, scope: "prefix" });
  });

  it("a des sous-matières pour IMM, RE et AS", () => {
    expect(Object.keys(DERISIER_DOSSIER_TAXONOMY.submatters).sort()).toEqual(["AS", "IMM", "RE"]);
  });
});
