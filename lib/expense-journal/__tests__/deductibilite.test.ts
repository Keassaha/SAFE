/**
 * Lot 2 — la part déductible, portée par la catégorie.
 *
 * Recherche : docs/research/RECHERCHE_deductibilite_et_taxes_depenses_QC_ON_2026-08-17.md
 *
 * Ce que ces tests verrouillent :
 *   1. la limite de 50 % s'applique AUSSI au crédit de taxe, pas seulement au revenu ;
 *   2. un prorata véhicule absent ne se déduit ni à zéro ni à cent, il reste inconnu ;
 *   3. aucun montant déductible n'est jamais calculé par ligne.
 */

import { describe, it, expect } from "vitest";
import {
  deductibiliteFor,
  tauxTaxeReclamable,
  deductibiliteIndeterminee,
  DEDUCTIBILITE_PAR_CATEGORIE,
  DEDUCTIBILITE_PLEINE,
} from "../deductibilite";
import { taxeReclamable } from "../tax-decomposition";
import { DEFAULT_EXPENSE_CATEGORIES } from "../constants";

describe("les deux catégories à règle spéciale existent enfin", () => {
  it.each(["REPAS_REPRESENTATION", "VEHICULE"])("%s est dans le catalogue", (code) => {
    // Absentes, elles tombaient dans « Autres » et se déduisaient en plein.
    expect(DEFAULT_EXPENSE_CATEGORIES.some((c) => c.code === code)).toBe(true);
  });
});

describe("deux taux, pas un", () => {
  it("les repas limitent le revenu ET le crédit de taxe à 50 %", () => {
    // Le piège : ne limiter que le revenu ferait réclamer le double de CTI permis.
    const r = deductibiliteFor("REPAS_REPRESENTATION");
    expect(r.tauxRevenu).toBe(0.5);
    expect(r.tauxTaxe).toBe(0.5);
  });

  it("un plafond de fin d'exercice est signalé, jamais calculé à la ligne", () => {
    const r = deductibiliteFor("REPAS_REPRESENTATION");
    expect(r.plafond).toBe("QC_REPRESENTATION");
    // La règle ne porte aucun montant : le plafond dépend du chiffre d'affaires
    // annuel et s'applique au cumul, pas à la dépense.
    expect(Object.keys(r)).not.toContain("montantDeductible");
  });

  it("une catégorie ordinaire se déduit en entier", () => {
    expect(deductibiliteFor("LOGICIELS")).toEqual(DEDUCTIBILITE_PLEINE);
    expect(deductibiliteFor(null).tauxRevenu).toBe(1);
  });
});

describe("le véhicule sans prorata reste inconnu", () => {
  it("ni zéro ni cent : null", () => {
    // Zéro ferait croire que rien n'est déductible, ce qui est faux. Cent
    // réclamerait un usage personnel. Inconnu est la seule réponse honnête.
    expect(tauxTaxeReclamable("VEHICULE", null)).toBeNull();
    expect(tauxTaxeReclamable("VEHICULE", undefined)).toBeNull();
    expect(deductibiliteIndeterminee("VEHICULE", null)).toBe(true);
  });

  it("un prorata déclaré devient le taux", () => {
    expect(tauxTaxeReclamable("VEHICULE", 0.6)).toBe(0.6);
    expect(deductibiliteIndeterminee("VEHICULE", 0.6)).toBe(false);
  });

  it("un prorata aberrant est refusé plutôt qu'appliqué", () => {
    expect(tauxTaxeReclamable("VEHICULE", 1.5)).toBeNull();
    expect(tauxTaxeReclamable("VEHICULE", -0.2)).toBeNull();
  });

  it("le prorata ne contamine pas les autres catégories", () => {
    expect(tauxTaxeReclamable("LOGICIELS", 0.6)).toBe(1);
  });
});

describe("taxeReclamable applique le taux de la catégorie", () => {
  it("un repas ne rend que la moitié de sa taxe", () => {
    const r = taxeReclamable([
      { tps: 5, tvq: 9.98, origine: "DECLAREE", categoryCode: "REPAS_REPRESENTATION" },
    ]);
    expect(r.reclamable).toBe(7.49);
  });

  it("une dépense ordinaire rend sa taxe entière", () => {
    const r = taxeReclamable([
      { tps: 5, tvq: 9.98, origine: "DECLAREE", categoryCode: "LOGICIELS" },
    ]);
    expect(r.reclamable).toBe(14.98);
  });

  it("un véhicule sans prorata est mis à part, ni réclamé ni perdu", () => {
    const r = taxeReclamable([
      { tps: 10, tvq: 19.95, origine: "DECLAREE", categoryCode: "VEHICULE" },
    ]);
    expect(r.reclamable).toBe(0);
    expect(r.estimee).toBe(0);
    expect(r.indetermine).toBe(29.95);
  });

  it("un véhicule avec prorata entre dans le réclamable au bon taux", () => {
    const r = taxeReclamable(
      [{ tps: 10, tvq: 19.95, origine: "DECLAREE", categoryCode: "VEHICULE" }],
      0.6,
    );
    expect(r.reclamable).toBe(17.97);
    expect(r.indetermine).toBe(0);
  });

  it("une taxe estimée reste non réclamable, même à taux plein", () => {
    const r = taxeReclamable([
      { tps: 5, tvq: 9.98, origine: "ESTIMEE", categoryCode: "LOGICIELS" },
    ]);
    expect(r.reclamable).toBe(0);
    expect(r.estimee).toBe(14.98);
  });
});

describe("tenue des règles", () => {
  it("tout code visé existe dans le catalogue", () => {
    const connus = new Set(DEFAULT_EXPENSE_CATEGORIES.map((c) => c.code));
    for (const code of Object.keys(DEDUCTIBILITE_PAR_CATEGORIE)) {
      expect(connus.has(code), `code inconnu : ${code}`).toBe(true);
    }
  });

  it("chaque règle porte sa source, sa date et un motif lisible", () => {
    for (const [code, r] of Object.entries(DEDUCTIBILITE_PAR_CATEGORIE)) {
      expect(r.source, code).toBeTruthy();
      expect(r.verifieLe, code).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(r.motif.length, code).toBeGreaterThan(30);
      expect(r.motif, code).not.toMatch(/tauxRevenu|tauxTaxe|null/);
    }
  });
});
