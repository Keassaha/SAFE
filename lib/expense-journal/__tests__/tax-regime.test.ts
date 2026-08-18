/**
 * Le lot 0 bis : quelles catégories ne portent structurellement aucune taxe.
 *
 * Recherche : docs/research/RECHERCHE_categories_sans_taxe_2026-08-18.md
 *
 * Ce que ces tests protègent : le moteur d'estimation du lot 1 ne doit JAMAIS
 * fabriquer de taxe sur un salaire, une prime d'assurance ou un débours avancé. Une
 * régression ici ne casse rien à l'écran, elle gonfle une demande de remboursement de
 * taxes, et ça se découvre à la vérification.
 */

import { describe, it, expect } from "vitest";
import {
  regimeFor,
  peutEstimerTaxe,
  peutSaisirTaxe,
  TAX_REGIME_BY_CATEGORY,
  DEFAULT_TAX_REGIME,
} from "../tax-regime";
import { DEFAULT_EXPENSE_CATEGORIES } from "../constants";

describe("catégories sans taxe", () => {
  it("un salaire ne porte aucune taxe, ni estimée ni saisie", () => {
    // L'emploi n'est pas une fourniture (LTA 123(1)). Ce n'est pas une exonération
    // révocable, c'est une absence de champ : le régime doit être dur.
    expect(regimeFor("SALAIRES").regime).toBe("SANS_TAXE_DUR");
    expect(peutEstimerTaxe("SALAIRES")).toBe(false);
    expect(peutSaisirTaxe("SALAIRES")).toBe(false);
  });

  it("une prime d'assurance refuse aussi la saisie manuelle", () => {
    // Piège visé : la taxe sur les primes d'assurance existe et n'est PAS
    // récupérable. Autoriser la saisie la ferait entrer dans les récupérables.
    expect(peutEstimerTaxe("ASSURANCES")).toBe(false);
    expect(peutSaisirTaxe("ASSURANCES")).toBe(false);
  });

  it("les frais bancaires refusent l'estimation mais acceptent la pièce", () => {
    // L'ARC exonère « MOST services provided by financial institutions ». Une
    // location de coffret est taxable : on refuse d'estimer, on laisse lire.
    expect(peutEstimerTaxe("FRAIS_BANCAIRES")).toBe(false);
    expect(peutSaisirTaxe("FRAIS_BANCAIRES")).toBe(true);
  });

  it("un débours avancé sort du périmètre au lieu d'être mis à zéro", () => {
    // Zéro le compterait comme une dépense sans taxe. Hors périmètre dit la vérité :
    // sa taxe vit dans le module débours, sinon elle est captée deux fois.
    expect(regimeFor("DEBOURS_AVANCES").regime).toBe("HORS_PERIMETRE");
    expect(peutEstimerTaxe("DEBOURS_AVANCES")).toBe(false);
  });
});

describe("greffes et registres publics", () => {
  it.each(["TRIBUNAL", "REGISTRE_FONCIER"])(
    "%s refuse l'estimation : l'annexe V partie VI art. 20 les exonère",
    (code) => {
      expect(peutEstimerTaxe(code)).toBe(false);
    },
  );

  it.each(["TRIBUNAL", "REGISTRE_FONCIER"])(
    "%s accepte malgré tout une taxe lue sur la pièce",
    (code) => {
      // La catégorie du cabinet est plus large que la règle : un sténographe
      // judiciaire ou une recherche de titres privée atterrit ici et facture une
      // taxe réelle. Bloquer durement forcerait à recatégoriser pour rien.
      expect(peutSaisirTaxe(code)).toBe(true);
    },
  );

  it("un huissier reste taxable : ce n'est pas un organisme gouvernemental", () => {
    // L'art. 20 vise les gouvernements, municipalités et organismes qu'ils créent.
    // Un huissier facture un service professionnel. Ses débours de greffe, eux,
    // relèvent du module débours.
    expect(regimeFor("HUISSIER").regime).toBe("TAXABLE");
    expect(peutEstimerTaxe("HUISSIER")).toBe(true);
  });

  it("plus aucune catégorie ne reste marquée incertaine", () => {
    // Les trois zones d'incertitude du 2026-08-18 ont été tranchées sur le texte.
    // Si une nouvelle apparaît, ce test la rend visible plutôt que de la laisser
    // dormir dans le fichier.
    const incertaines = Object.entries(TAX_REGIME_BY_CATEGORY)
      .filter(([, r]) => r.incertain)
      .map(([code]) => code);
    expect(incertaines).toEqual([]);
  });
});

describe("régime général", () => {
  it("une catégorie inconnue tombe sur le régime général, jamais sur undefined", () => {
    expect(regimeFor("CATEGORIE_INVENTEE")).toEqual(DEFAULT_TAX_REGIME);
    expect(regimeFor(null).regime).toBe("TAXABLE");
    expect(regimeFor(undefined).regime).toBe("TAXABLE");
  });

  it("les catégories ordinaires restent estimables", () => {
    for (const code of ["LOYER", "LOGICIELS", "DEPLACEMENTS", "PUBLICITE", "HONORAIRES_EXT"]) {
      expect(peutEstimerTaxe(code)).toBe(true);
    }
  });
});

describe("cohérence avec le catalogue de catégories", () => {
  it("tout code classé existe réellement dans les catégories par défaut", () => {
    // Un régime posé sur un code fantôme ne s'appliquerait jamais, et personne ne
    // le verrait.
    const connus = new Set(DEFAULT_EXPENSE_CATEGORIES.map((c) => c.code));
    for (const code of Object.keys(TAX_REGIME_BY_CATEGORY)) {
      expect(connus.has(code), `code inconnu : ${code}`).toBe(true);
    }
  });

  it("chaque règle porte sa source et sa date de vérification", () => {
    // Les taux et seuils changent. Une règle sans date n'est pas revisitable.
    for (const [code, rule] of Object.entries(TAX_REGIME_BY_CATEGORY)) {
      expect(rule.source, code).toBeTruthy();
      expect(rule.verifieLe, code).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(rule.motif.length, code).toBeGreaterThan(20);
    }
  });

  it("aucun motif ne parle en code à l'utilisateur", () => {
    for (const [code, rule] of Object.entries(TAX_REGIME_BY_CATEGORY)) {
      expect(rule.motif, code).not.toMatch(/SANS_TAXE|HORS_PERIMETRE|TAXABLE/);
    }
  });
});
