/**
 * Tests des garde-fous purs de l'annulation.
 *
 * Doctrine: docs/accounting/DOCTRINE_ANNULATION_CORRECTION.md
 *
 * On teste la logique de DÉCISION (qu'est-ce qui est annulable, quel motif est
 * recevable, quelle contrepassation en sort), pas la couche Prisma : c'est là que
 * vivent les règles, et c'est là qu'une régression coûterait un solde faux.
 */

import { describe, it, expect } from "vitest";
import {
  assertAnnulable,
  buildContrepassation,
  validateMotif,
  MOTIF_TEXTE_MIN,
  type AnnulableEntry,
} from "../annulation";

function ecriture(over: Partial<AnnulableEntry> = {}): AnnulableEntry {
  return {
    id: "e1",
    sourceModule: "AJUSTEMENT_MANUEL",
    montantEntree: 1000,
    montantSortie: 0,
    annuleId: null,
    annuleParId: null,
    ...over,
  };
}

describe("assertAnnulable", () => {
  it("accepte une écriture manuelle vivante", () => {
    expect(assertAnnulable(ecriture()).ok).toBe(true);
  });

  it("refuse une écriture déjà annulée — sinon le montant serait retranché deux fois", () => {
    const verdict = assertAnnulable(ecriture({ annuleParId: "contrepassation-1" }));
    expect(verdict.ok).toBe(false);
    expect(verdict.refus).toBe("deja_annulee");
  });

  it("refuse d'annuler une annulation : c'est elle qui prouve la correction", () => {
    const verdict = assertAnnulable(ecriture({ annuleId: "e0" }));
    expect(verdict.ok).toBe(false);
    expect(verdict.refus).toBe("est_une_annulation");
  });

  it.each([
    "FACTURATION",
    "PAIEMENTS",
    "FIDEICOMMIS",
    "DEPENSES",
    "DEBOURS",
    "IMPORT_BANCAIRE",
  ] as const)(
    "refuse une écriture venue du module %s : elle s'annule dans son module",
    (sourceModule) => {
      const verdict = assertAnnulable(ecriture({ sourceModule }));
      expect(verdict.ok).toBe(false);
      expect(verdict.refus).toBe("module_metier");
      // Le message doit orienter, pas seulement bloquer.
      expect(verdict.message).toBeTruthy();
    },
  );

  it("refuse une écriture sans montant : il n'y a rien à contrepasser", () => {
    const verdict = assertAnnulable(ecriture({ montantEntree: 0, montantSortie: 0 }));
    expect(verdict.ok).toBe(false);
    expect(verdict.refus).toBe("montant_nul");
  });
});

describe("validateMotif", () => {
  it("accepte un motif de la liste sans texte", () => {
    expect(validateMotif({ code: "ERREUR_SAISIE" }).ok).toBe(true);
  });

  it("garde la précision facultative quand elle est fournie", () => {
    const v = validateMotif({ code: "DOUBLON", texte: "  saisi deux fois  " });
    expect(v.ok).toBe(true);
    expect(v.texte).toBe("saisi deux fois");
  });

  it("exige un texte réel sur AUTRE", () => {
    expect(validateMotif({ code: "AUTRE" }).ok).toBe(false);
    expect(validateMotif({ code: "AUTRE", texte: "oups" }).ok).toBe(false);
    expect(validateMotif({ code: "AUTRE", texte: "x".repeat(MOTIF_TEXTE_MIN) }).ok).toBe(true);
  });

  it("ne compte pas les espaces comme du motif", () => {
    expect(validateMotif({ code: "AUTRE", texte: "          " }).ok).toBe(false);
  });
});

describe("buildContrepassation", () => {
  it("inverse strictement les montants, sans recalcul", () => {
    const c = buildContrepassation(
      { montantEntree: 1234.56, montantSortie: 0, sourceModule: "AJUSTEMENT_MANUEL" },
      "Ajustement manuel du 2026-08-17",
      { code: "MAUVAIS_TYPE" },
    );
    expect(c.montantEntree).toBe(0);
    expect(c.montantSortie).toBe(1234.56);
  });

  it("inverse aussi dans l'autre sens", () => {
    const c = buildContrepassation(
      { montantEntree: 0, montantSortie: 800, sourceModule: "AJUSTEMENT_MANUEL" },
      "Sortie",
      { code: "ERREUR_SAISIE" },
    );
    expect(c.montantEntree).toBe(800);
    expect(c.montantSortie).toBe(0);
  });

  it("ramène l'effet net à zéro au centime près", () => {
    const origine = { montantEntree: 0, montantSortie: 19.99, sourceModule: "AJUSTEMENT_MANUEL" as const };
    const c = buildContrepassation(origine, "x", { code: "DOUBLON" });
    const net =
      origine.montantEntree - origine.montantSortie + (c.montantEntree - c.montantSortie);
    expect(net).toBe(0);
  });

  it("écrit toujours une CORRECTION, jamais le type d'origine", () => {
    const c = buildContrepassation(
      { montantEntree: 10, montantSortie: 0, sourceModule: "AJUSTEMENT_MANUEL" },
      "x",
      { code: "DOUBLON" },
    );
    expect(c.typeTransaction).toBe("CORRECTION");
    expect(c.sourceModule).toBe("CORRECTION_SYSTEME");
  });

  it("garde une correction de fidéicommis DANS le fidéicommis", () => {
    // Sinon `isTrustEntry` la classerait en cash du cabinet, et l'argent du client
    // viendrait gonfler le solde opérationnel. C'est la faute la plus grave possible.
    const c = buildContrepassation(
      { montantEntree: 0, montantSortie: 500, sourceModule: "FIDEICOMMIS" },
      "Dépôt",
      { code: "ERREUR_SAISIE" },
    );
    expect(c.sourceModule).toBe("FIDEICOMMIS");
  });

  it("inscrit le motif en clair dans la description", () => {
    const c = buildContrepassation(
      { montantEntree: 100, montantSortie: 0, sourceModule: "AJUSTEMENT_MANUEL" },
      "Ajustement manuel du 2026-08-17",
      { code: "MAUVAIS_TYPE", texte: "c'était un paiement" },
    );
    expect(c.description).toContain("Annulation");
    expect(c.description).toContain("Ajustement manuel du 2026-08-17");
    expect(c.description).toContain("Mauvais type d'écriture");
    expect(c.description).toContain("c'était un paiement");
  });

  it("tient dans la colonne description (500 caractères)", () => {
    const c = buildContrepassation(
      { montantEntree: 100, montantSortie: 0, sourceModule: "AJUSTEMENT_MANUEL" },
      "x".repeat(900),
      { code: "AUTRE", texte: "y".repeat(400) },
    );
    expect(c.description.length).toBeLessThanOrEqual(500);
  });
});
