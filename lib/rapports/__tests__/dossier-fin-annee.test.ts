/**
 * Lot 4 — le dossier de fin d'année.
 *
 * Spec : docs/accounting/SPEC_DEPENSES_ET_PREPARATION_FISCALE.md §3.
 *
 * Ce que ces tests verrouillent, par ordre de ce qu'une régression coûterait :
 *   1. le net à remettre déduit la taxe payée, sinon le cabinet remet trop ;
 *   2. seule la taxe réclamable y entre, jamais l'estimée ni le demi-crédit refusé ;
 *   3. le dossier DÉCLARE ses zones d'ombre au lieu d'inventer un chiffre.
 */

import { describe, it, expect } from "vitest";
import { construireDossierFinAnnee, type DepenseFinAnnee } from "../dossier-fin-annee";

const dep = (over: Partial<DepenseFinAnnee> = {}): DepenseFinAnnee => ({
  id: "d1",
  categoryCode: "LOGICIELS",
  categoryName: "Logiciels / abonnements",
  montant: 114.98,
  montantHt: 100,
  tps: 5,
  tvq: 9.98,
  taxOrigin: "DECLAREE",
  piecePresente: true,
  ...over,
});

const base = {
  annee: 2026,
  revenus: { factureHt: 100000, encaisse: 90000 },
  taxesCollectees: 14975,
  deboursRefactures: 1200,
};

describe("le net à remettre, le chiffre qui manquait", () => {
  it("déduit la taxe payée réclamable de la taxe collectée", () => {
    // Sans cette soustraction, le cabinet remet la taxe collectée en entier, tous
    // les trimestres, sans jamais le voir.
    const d = construireDossierFinAnnee({ ...base, depenses: [dep()] });
    expect(d.taxes.collectee).toBe(14975);
    expect(d.taxes.payeeReclamable).toBe(14.98);
    expect(d.taxes.netARemettre).toBe(14960.02);
  });

  it("une taxe estimée n'entre pas dans le net à remettre", () => {
    const d = construireDossierFinAnnee({ ...base, depenses: [dep({ taxOrigin: "ESTIMEE" })] });
    expect(d.taxes.payeeReclamable).toBe(0);
    expect(d.taxes.netARemettre).toBe(14975);
  });

  it("un repas ne rend que la moitié de son crédit", () => {
    const d = construireDossierFinAnnee({
      ...base,
      depenses: [dep({ categoryCode: "REPAS_REPRESENTATION", categoryName: "Repas / représentation" })],
    });
    expect(d.taxes.payeeReclamable).toBe(7.49);
  });
});

describe("dépenses par catégorie", () => {
  it("regroupe, totalise et trie par montant décroissant", () => {
    const d = construireDossierFinAnnee({
      ...base,
      depenses: [
        dep({ id: "a", montantHt: 100 }),
        dep({ id: "b", montantHt: 200, montant: 229.95, tps: 10, tvq: 19.95 }),
        dep({ id: "c", categoryCode: "LOYER", categoryName: "Loyer / bureau", montantHt: 1500, montant: 1724.63, tps: 75, tvq: 149.63 }),
      ],
    });
    expect(d.depensesParCategorie[0].code).toBe("LOYER");
    expect(d.depensesParCategorie[1].nombre).toBe(2);
    expect(d.depensesParCategorie[1].montantHt).toBe(300);
    expect(d.totaux.montantHt).toBe(1800);
  });

  it("une dépense jamais reprise compte son montant entier en HT", () => {
    // Sinon le total des dépenses serait faux, ce qui est pire qu'une taxe absente.
    const d = construireDossierFinAnnee({
      ...base,
      depenses: [dep({ montantHt: null, tps: null, tvq: null, taxOrigin: null, montant: 500 })],
    });
    expect(d.totaux.montantHt).toBe(500);
  });

  it("le taux déductible suit la catégorie, sans montant calculé par ligne", () => {
    const d = construireDossierFinAnnee({
      ...base,
      depenses: [dep({ categoryCode: "REPAS_REPRESENTATION" })],
    });
    const l = d.depensesParCategorie[0];
    expect(l.tauxDeductible).toBe(0.5);
    expect(l.plafondApplicable).toBe(true);
    // Le plafond dépend du chiffre d'affaires et s'applique au cumul : aucun
    // montant déductible n'est produit ici.
    expect(l).not.toHaveProperty("montantDeductible");
  });
});

describe("le dossier déclare ses zones d'ombre", () => {
  it("signale les taxes estimées avec leur montant", () => {
    const d = construireDossierFinAnnee({
      ...base,
      depenses: [dep({ taxOrigin: "ESTIMEE" }), dep({ id: "d2", taxOrigin: "ESTIMEE" })],
    });
    const i = d.incertitudes.find((x) => x.code === "TAXES_ESTIMEES")!;
    expect(i.nombre).toBe(2);
    expect(i.montant).toBe(29.96);
  });

  it("signale la catégorie Autres, qui empêche d'établir la déductibilité", () => {
    const d = construireDossierFinAnnee({
      ...base,
      depenses: [dep({ categoryCode: "AUTRES", categoryName: "Autres", montantHt: 800 })],
    });
    expect(d.incertitudes.some((x) => x.code === "CATEGORIE_AUTRES")).toBe(true);
  });

  it("signale un prorata véhicule absent, et exclut la dépense plutôt que de deviner", () => {
    const d = construireDossierFinAnnee({
      ...base,
      depenses: [dep({ categoryCode: "VEHICULE", categoryName: "Véhicule" })],
    });
    expect(d.taxes.payeeReclamable).toBe(0);
    expect(d.incertitudes.some((x) => x.code === "PRORATA_VEHICULE_ABSENT")).toBe(true);
    expect(d.depensesParCategorie[0].tauxDeductible).toBeNull();
  });

  it("un prorata renseigné fait disparaître l'incertitude", () => {
    const d = construireDossierFinAnnee({
      ...base,
      depenses: [dep({ categoryCode: "VEHICULE" })],
      prorataVehicule: 0.6,
    });
    expect(d.incertitudes.some((x) => x.code === "PRORATA_VEHICULE_ABSENT")).toBe(false);
    expect(d.taxes.payeeReclamable).toBe(8.99);
  });

  it("déclare le plafond québécois au lieu de l'inventer", () => {
    // Ses paliers sont A_CONFIRMER depuis le 2026-08-17. Produire un montant
    // « calculé » ferait croire au comptable qu'il est final.
    const d = construireDossierFinAnnee({
      ...base,
      depenses: [dep({ categoryCode: "REPAS_REPRESENTATION" })],
    });
    const i = d.incertitudes.find((x) => x.code === "PLAFOND_QC_NON_CALCULE")!;
    expect(i.message).toContain("maximum");
  });

  it("liste les dépenses sans pièce, la seule sur laquelle on agit", () => {
    const d = construireDossierFinAnnee({
      ...base,
      depenses: [dep({ id: "x", piecePresente: false, montant: 250 }), dep({ id: "y" })],
    });
    expect(d.sansPiece.nombre).toBe(1);
    expect(d.sansPiece.montant).toBe(250);
    expect(d.sansPiece.ids).toEqual(["x"]);
  });

  it("signale les périodes non verrouillées", () => {
    const d = construireDossierFinAnnee({
      ...base,
      depenses: [dep()],
      moisNonVerrouilles: ["2026-07", "2026-08"],
    });
    const i = d.incertitudes.find((x) => x.code === "PERIODE_NON_VERROUILLEE")!;
    expect(i.message).toContain("2026-07");
  });

  it("un dossier propre n'affiche aucune incertitude", () => {
    const d = construireDossierFinAnnee({ ...base, depenses: [dep()] });
    expect(d.incertitudes).toEqual([]);
  });
});

describe("revenus, débours, cas vide", () => {
  it("l'écart entre facturé et encaissé est calculé", () => {
    const d = construireDossierFinAnnee({ ...base, depenses: [] });
    expect(d.revenus.ecart).toBe(10000);
    expect(d.deboursRefactures).toBe(1200);
  });

  it("un exercice vide ne casse pas", () => {
    const d = construireDossierFinAnnee({
      annee: 2026,
      revenus: { factureHt: 0, encaisse: 0 },
      taxesCollectees: 0,
      deboursRefactures: 0,
      depenses: [],
    });
    expect(d.taxes.netARemettre).toBe(0);
    expect(d.depensesParCategorie).toEqual([]);
    expect(d.incertitudes).toEqual([]);
  });
});
