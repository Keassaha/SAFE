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
  apports: [],
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

describe("les apports, saisis comme à l'écran", () => {
  /** Le cas C2, remploi de Lucille et Jean-Guy, tel qu'un utilisateur le remplirait. */
  const remploi: LigneSaisie = {
    ...vide,
    libelle: "Maison Portland",
    valeurBrutePartage: "180 000 $",
    dettePartage: "60 000 $",
    apports: [
      { montant: "60 000", valeurBruteAuMoment: "160 000", source: "remploi" },
    ],
  };

  it("rend enfin le cas C2 atteignable : 52 500 $ à partager, 26 250 $ chacun", () => {
    const r = calculerPartage({
      regime: "patrimoine_familial",
      cause: "divorce",
      biens: lignesVersBiens([remploi]),
    });
    expect(r.valeurPartageableTotale).toBe(52_500);
    expect(r.partParConjoint).toBe(26_250);
  });

  it("ignore un apport à moitié rempli plutôt que de diviser par zéro", () => {
    const b = lignesVersBiens([
      {
        ...vide,
        libelle: "Maison",
        valeurBrutePartage: "200 000",
        apports: [
          { montant: "50 000", valeurBruteAuMoment: "", source: "succession_donation" },
          { montant: "", valeurBruteAuMoment: "100 000", source: "succession_donation" },
        ],
      },
    ])[0];
    expect(b.apports).toHaveLength(0);
  });
});

describe("toutes les provenances ne se déduisent pas, et les deux régimes diffèrent", () => {
  const avecSource = (source: LigneSaisie["apports"][number]["source"]): LigneSaisie => ({
    ...vide,
    libelle: "Maison",
    valeurBrutePartage: "200 000",
    apports: [{ montant: "50 000", valeurBruteAuMoment: "150 000", source }],
  });

  const partage = (source: Parameters<typeof avecSource>[0], regime: "patrimoine_familial" | "union_parentale") =>
    calculerPartage({ regime, cause: "divorce", biens: lignesVersBiens([avecSource(source)]) });

  it("au mariage, une épargne d'avant l'union n'ouvre AUCUNE déduction", () => {
    const r = partage("biens_avant_union", "patrimoine_familial");
    expect(r.valeurPartageableTotale).toBe(200_000);
    expect(r.biens[0].etapes.some((e) => /écarté/.test(e.libelle))).toBe(true);
  });

  it("en union parentale, la MÊME somme se déduit (art. 521.36 al. 2)", () => {
    const r = partage("biens_avant_union", "union_parentale");
    expect(r.valeurPartageableTotale).toBeLessThan(200_000);
  });

  it("un héritage se déduit dans les deux régimes", () => {
    expect(partage("succession_donation", "patrimoine_familial").valeurPartageableTotale)
      .toBeLessThan(200_000);
    expect(partage("succession_donation", "union_parentale").valeurPartageableTotale)
      .toBeLessThan(200_000);
  });

  it("« autre provenance » est écartée partout, et le calcul le dit au lieu de l'ignorer", () => {
    for (const regime of ["patrimoine_familial", "union_parentale"] as const) {
      const r = partage("autre", regime);
      expect(r.valeurPartageableTotale).toBe(200_000);
      const ecart = r.biens[0].etapes.find((e) => /écarté/.test(e.libelle));
      expect(ecart?.reference).toMatch(/C\.c\.Q\./);
    }
  });
});
