import { describe, expect, it } from "vitest";
import { deriveTaxonomyOptions } from "@/lib/dossiers/cabinet-dossier-taxonomy";
import type { DossierTaxonomy } from "@/lib/dossiers/taxonomy";

/**
 * Source unique des options de taxonomie affichées dans les formulaires de
 * dossier (page complète ET modal de création). Ce test verrouille l'invariant
 * qui a causé le bug « le modal montrait des types génériques » : la dérivation
 * doit produire les sujets configurés du cabinet, localisés, avec le code en value.
 */

const TAXONOMY: DossierTaxonomy = {
  numbering: { seqWidth: 5, scope: "prefix" },
  subjects: [
    { code: "RE", prefix: "RE", labelFr: "Immobilier", labelEn: "Real Estate" },
    { code: "IMM", prefix: "IMM", labelFr: "Immigration", labelEn: "Immigration" },
  ],
  submatters: {
    RE: [{ labelFr: "Achat résidentiel", labelEn: "Purchase Residential" }],
    IMM: [{ labelFr: "Entrée express", labelEn: "Express Entry" }],
  },
};

describe("deriveTaxonomyOptions — options de taxonomie pour les formulaires", () => {
  it("sans taxonomie → aucune option (legacy : types génériques)", () => {
    expect(deriveTaxonomyOptions(null, "fr")).toEqual({});
  });

  it("value du sujet = code (pilote préfixe + type dérivé côté serveur)", () => {
    const { subjectOptions } = deriveTaxonomyOptions(TAXONOMY, "fr");
    expect(subjectOptions?.map((o) => o.value)).toEqual(["RE", "IMM"]);
  });

  it("locale FR → libellés français", () => {
    const opts = deriveTaxonomyOptions(TAXONOMY, "fr");
    expect(opts.subjectOptions?.map((o) => o.label)).toEqual(["Immobilier", "Immigration"]);
    expect(opts.submatterOptions?.RE?.[0]?.label).toBe("Achat résidentiel");
  });

  it("locale EN → libellés anglais", () => {
    const opts = deriveTaxonomyOptions(TAXONOMY, "en");
    expect(opts.subjectOptions?.map((o) => o.label)).toEqual(["Real Estate", "Immigration"]);
    expect(opts.submatterOptions?.IMM?.[0]?.label).toBe("Express Entry");
  });

  it("les sous-matières sont indexées par code de sujet", () => {
    const { submatterOptions } = deriveTaxonomyOptions(TAXONOMY, "fr");
    expect(Object.keys(submatterOptions ?? {})).toEqual(["RE", "IMM"]);
  });
});
