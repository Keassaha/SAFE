/**
 * Le chemin complet : ce que l'utilisateur TAPE, jusqu'au montant affiché.
 * Ce test remplace ce qu'un navigateur au premier plan aurait montré.
 */
import { describe, it, expect } from "vitest";
import { nombre, lignesVersBiens, type LigneSaisie } from "../saisie";
import { calculerPartage } from "../calcul";

const vide: LigneSaisie = {
  libelle: "",
  categorie: "residence_familiale",
  possedeAvant: false,
  valeurBruteReference: "",
  detteReference: "",
  valeurBrutePartage: "",
  dettePartage: "",
  partageableEnNature: false,
  chargeFiscaleLatente: "",
};

describe("lire un montant tapé par un cabinet québécois", () => {
  it.each([
    ["200000", 200_000],
    ["200 000", 200_000],
    ["200 000 $", 200_000],
    ["1 250,50", 1250.5],
    ["1250.5", 1250.5],
    ["", 0],
  ])("%s donne %s", (saisie, attendu) => {
    expect(nombre(saisie)).toBe(attendu);
  });

  it("ne laisse jamais passer un NaN, qui traverserait tous les garde-fous", () => {
    for (const s of ["abc", "--", "$", "1,2,3"]) {
      expect(Number.isFinite(nombre(s))).toBe(true);
    }
  });
});

describe("ce que la case à cocher change vraiment", () => {
  it("non cochée : valeur de référence NULLE, pas zéro", () => {
    const b = lignesVersBiens([{ ...vide, libelle: "Chalet", valeurBrutePartage: "80 000" }])[0];
    expect(b.valeurBruteReference).toBeNull();
  });

  it("cochée : la valeur de référence est lue", () => {
    const b = lignesVersBiens([
      { ...vide, libelle: "Maison", valeurBrutePartage: "200 000", possedeAvant: true, valeurBruteReference: "100 000", detteReference: "40 000" },
    ])[0];
    expect(b.valeurBruteReference).toBe(100_000);
    expect(b.detteReference).toBe(40_000);
  });

  it("charge fiscale vide reste indéfinie, jamais zéro", () => {
    const [sans, avec] = lignesVersBiens([
      { ...vide, libelle: "REER", categorie: "regime_retraite", valeurBrutePartage: "100 000" },
      { ...vide, libelle: "REER 2", categorie: "regime_retraite", valeurBrutePartage: "100 000", chargeFiscaleLatente: "40 000" },
    ]);
    expect(sans.chargeFiscaleLatente).toBeUndefined();
    expect(avec.chargeFiscaleLatente).toBe(40_000);
  });

  it("ignore les lignes qu'on n'a pas commencé à remplir", () => {
    expect(lignesVersBiens([vide, { ...vide, libelle: "Réel" }])).toHaveLength(1);
  });
});

describe("de la frappe au montant : le cas Éducaloi, tel qu'on le saisirait", () => {
  const lignes: LigneSaisie[] = [
    {
      ...vide,
      libelle: "Résidence de Longueuil",
      valeurBrutePartage: "200 000 $",
      dettePartage: "25 000 $",
      possedeAvant: true,
      valeurBruteReference: "100 000 $",
      detteReference: "40 000 $",
    },
  ];

  const r = calculerPartage({
    regime: "patrimoine_familial",
    cause: "divorce",
    biens: lignesVersBiens(lignes),
  });

  it("affiche 55 000 $ à partager et 27 500 $ par conjoint", () => {
    expect(r.valeurPartageableTotale).toBe(55_000);
    expect(r.partParConjoint).toBe(27_500);
  });

  it("montre quatre étapes, chacune avec son article", () => {
    const etapes = r.biens[0].etapes;
    expect(etapes).toHaveLength(4);
    expect(etapes.map((e) => e.reference)).toEqual([
      "C.c.Q. art. 417",
      "C.c.Q. art. 418",
      "C.c.Q. art. 418 al. 2",
      "C.c.Q. art. 416",
    ]);
  });

  it("ne propose pas de seconde branche : aucune charge fiscale ici", () => {
    expect(r.partParConjointApresImpotLatent).toBeNull();
  });

  it("nomme quand même le critère de l'article 422", () => {
    expect(r.reserves.map((x) => x.code)).toContain("partage_inegal_422");
  });
});
