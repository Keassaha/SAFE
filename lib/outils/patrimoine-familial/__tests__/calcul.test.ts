/**
 * Les cas viennent de `docs/research/CAS_DE_TEST_patrimoine_familial.md`.
 * Chacun porte sa source. Aucun cas inventé n'est traité comme une preuve.
 */
import { describe, it, expect } from "vitest";
import { calculerBien, calculerPartage, type Bien } from "../calcul";

const residence = (o: Partial<Bien> = {}): Bien => ({
  libelle: "Résidence",
  categorie: "residence_familiale",
  valeurBruteReference: null,
  detteReference: 0,
  valeurBrutePartage: 0,
  dettePartage: 0,
  ...o,
});

describe("C1 — résidence possédée au mariage (Éducaloi, exemple 2)", () => {
  const r = calculerBien(
    residence({
      valeurBruteReference: 100_000,
      detteReference: 40_000,
      valeurBrutePartage: 200_000,
      dettePartage: 25_000,
    }),
    "patrimoine_familial",
  );

  it("rend 55 000 $ de valeur partageable", () => {
    expect(r.valeurPartageable).toBe(55_000);
  });

  it("montre le chemin, avec l'article en regard de chaque étape", () => {
    expect(r.etapes.map((e) => e.montant)).toEqual([175_000, 60_000, 60_000, 55_000]);
    expect(r.etapes.every((e) => e.reference.length > 0)).toBe(true);
  });
});

describe("C2 — remploi (Lavallée et Samoisette, cas Lucille et Jean-Guy)", () => {
  // Le bien de remploi porte les déductions du bien d'origine, dans la proportion
  // « déductions du bien 1 ÷ prix d'achat du bien 2 ». On la modélise par un apport.
  const r = calculerBien(
    residence({
      libelle: "Maison Portland",
      valeurBruteReference: null, // acquise pendant le mariage
      valeurBrutePartage: 180_000,
      dettePartage: 60_000,
      apports: [
        // 60 000 $ = valeur nette au mariage du bien 1 (40 000) + sa plus-value (20 000)
        { montant: 60_000, valeurBruteAuMoment: 160_000, source: "succession_donation" },
      ],
    }),
    "patrimoine_familial",
  );

  it("rend 52 500 $ à partager, donc 26 250 $ par époux", () => {
    expect(r.valeurPartageable).toBe(52_500);
    expect((r.valeurPartageable ?? 0) / 2).toBe(26_250);
  });

  it("déduit 67 500 $ : l'apport de 60 000 $ plus 7 500 $ de plus-value proportionnelle", () => {
    const apport = r.etapes.find((e) => e.libelle.startsWith("Apport"));
    expect(apport?.montant).toBe(67_500);
  });
});

describe("moins-value : traitement symétrique, une seule formule", () => {
  const r = calculerBien(
    residence({
      valeurBruteReference: 100_000,
      detteReference: 40_000,
      valeurBrutePartage: 80_000, // le bien a perdu 20 000 $
      dettePartage: 25_000,
    }),
    "patrimoine_familial",
  );

  it("retranche la moins-value proportionnelle de la déduction au lieu de l'ignorer", () => {
    // proportion 0,6 ; moins-value 20 000 ; déduction 60 000 − 12 000 = 48 000
    expect(r.etapes[2].montant).toBe(-12_000);
    expect(r.valeurPartageable).toBe(55_000 - 48_000 + 0); // 55 000 net − 48 000
  });

  it("nomme l'étape pour ce qu'elle est", () => {
    expect(r.etapes[2].libelle).toMatch(/[Mm]oins-value/);
  });
});

describe("les garde-fous", () => {
  it("refuse de calculer si la valeur nette au mariage était négative", () => {
    const r = calculerBien(
      residence({
        valeurBruteReference: 100_000,
        detteReference: 140_000, // dettes supérieures à la valeur
        valeurBrutePartage: 200_000,
        dettePartage: 0,
      }),
      "patrimoine_familial",
    );
    expect(r.valeurPartageable).toBeNull();
    expect(r.reserves[0].code).toBe("valeur_nette_negative_reference");
    expect(r.reserves[0].message).not.toMatch(/erreur|invalide/i);
  });

  it("refuse une valeur brute de référence nulle plutôt que de diviser par zéro", () => {
    const r = calculerBien(
      residence({ valeurBruteReference: 0, detteReference: 0, valeurBrutePartage: 100_000 }),
      "patrimoine_familial",
    );
    expect(r.valeurPartageable).toBeNull();
    expect(Number.isFinite(r.etapes[0].montant)).toBe(true);
  });

  it("ramène un solde négatif à zéro, sans compensation entre biens", () => {
    const res = calculerPartage({
      regime: "patrimoine_familial",
      cause: "divorce",
      biens: [
        residence({ libelle: "A", valeurBruteReference: 100_000, detteReference: 0, valeurBrutePartage: 50_000 }),
        residence({ libelle: "B", valeurBrutePartage: 30_000 }),
      ],
    });
    const a = res.biens.find((b) => b.libelle === "A");
    expect(a?.valeurPartageable).toBe(0);
    // Le solde négatif de A ne vient pas réduire B.
    expect(res.valeurPartageableTotale).toBe(30_000);
  });
});

describe("le régime et la cause de dissolution changent le patrimoine", () => {
  const gains: Bien = {
    libelle: "Gains RRQ",
    categorie: "gains_rrq",
    valeurBruteReference: null,
    detteReference: 0,
    valeurBrutePartage: 40_000,
    dettePartage: 0,
  };

  it("au divorce, les gains du Régime de rentes entrent", () => {
    const r = calculerPartage({ regime: "patrimoine_familial", cause: "divorce", biens: [gains] });
    expect(r.valeurPartageableTotale).toBe(40_000);
  });

  it("au décès, ils en sortent (art. 415 al. 3)", () => {
    const r = calculerPartage({ regime: "patrimoine_familial", cause: "deces", biens: [gains] });
    expect(r.valeurPartageableTotale).toBe(0);
    expect(r.biens).toHaveLength(0);
  });

  it("l'union parentale nomme sa propre date de référence", () => {
    const r = calculerBien(
      residence({ valeurBruteReference: 100_000, detteReference: 0, valeurBrutePartage: 120_000 }),
      "union_parentale",
    );
    expect(r.etapes[1].libelle).toMatch(/inclusion au patrimoine/);
    expect(r.etapes[1].reference).toMatch(/521\.36/);
  });
});

describe("ce que le calcul refuse de trancher, il le dit", () => {
  it("pose la question du partage en nature AVANT celle de l'impôt latent", () => {
    const r = calculerBien(
      {
        libelle: "REER",
        categorie: "regime_retraite",
        valeurBruteReference: null,
        detteReference: 0,
        valeurBrutePartage: 100_000,
        dettePartage: 0,
      },
      "patrimoine_familial",
    );
    const impot = r.reserves.find((x) => x.code === "impot_latent");
    expect(impot).toBeDefined();
    // L'intention du test n'est pas le vocabulaire, c'est l'ORDRE : la question qui
    // peut faire disparaître la question difficile se pose en premier.
    expect(impot!.message.indexOf("partager en nature")).toBeLessThan(
      impot!.message.indexOf("charge fiscale"),
    );
  });

  it("se tait sur l'impôt latent quand le bien se partage en nature", () => {
    const r = calculerBien(
      {
        libelle: "REER",
        categorie: "regime_retraite",
        valeurBruteReference: null,
        detteReference: 0,
        valeurBrutePartage: 100_000,
        dettePartage: 0,
        partageableEnNature: true,
      },
      "patrimoine_familial",
    );
    expect(r.reserves.find((x) => x.code === "impot_latent")).toBeUndefined();
  });

  it("nomme le critère de l'art. 422 et cite l'arrêt qui l'établit", () => {
    const r = calculerPartage({ regime: "patrimoine_familial", cause: "divorce", biens: [] });
    const art422 = r.reserves.find((x) => x.code === "partage_inegal_422");
    expect(art422?.message).toMatch(/ÉCONOMIQUE/);
    expect(art422?.reference).toMatch(/2008 CSC 50/);
  });
});

describe("les trois disciplines de la réserve", () => {
  const reer = (o: Partial<Bien> = {}): Bien => ({
    libelle: "REER",
    categorie: "regime_retraite",
    valeurBruteReference: null,
    detteReference: 0,
    valeurBrutePartage: 100_000,
    dettePartage: 0,
    ...o,
  });

  it("chaque réserve porte sa date de vérification et ce qui la lèverait", () => {
    const r = calculerPartage({
      regime: "patrimoine_familial",
      cause: "divorce",
      biens: [
        reer(),
        residence({
          libelle: "Négative",
          valeurBruteReference: 100_000,
          detteReference: 140_000,
          valeurBrutePartage: 200_000,
        }),
      ],
    });
    expect(r.reserves.length).toBeGreaterThan(0);
    for (const res of r.reserves) {
      expect(res.verifieLe).toBe("2026-08-19");
      expect(res.leveePar.length).toBeGreaterThan(20);
    }
  });

  it("dit franchement que l'art. 422 ne se lèvera jamais par une recherche", () => {
    const r = calculerPartage({ regime: "patrimoine_familial", cause: "divorce", biens: [] });
    const a422 = r.reserves.find((x) => x.code === "partage_inegal_422");
    expect(a422?.leveePar).toMatch(/^Rien\./);
  });

  it("rend DEUX montants quand la charge fiscale est chiffrée, sans en retenir un", () => {
    const r = calculerPartage({
      regime: "patrimoine_familial",
      cause: "divorce",
      biens: [reer({ chargeFiscaleLatente: 40_000 })],
    });
    expect(r.valeurPartageableTotale).toBe(100_000);
    expect(r.valeurPartageableTotaleApresImpotLatent).toBe(60_000);
    expect(r.partParConjoint).toBe(50_000);
    expect(r.partParConjointApresImpotLatent).toBe(30_000);
  });

  it("ne calcule aucune charge fiscale lui-même : sans montant fourni, une seule branche", () => {
    const r = calculerPartage({
      regime: "patrimoine_familial",
      cause: "divorce",
      biens: [reer()],
    });
    expect(r.valeurPartageableTotaleApresImpotLatent).toBeNull();
    expect(r.reserves.find((x) => x.code === "impot_latent")?.message).toMatch(
      /chiffrez la charge fiscale/,
    );
  });

  it("se tait entièrement si le bien se partage en nature, même avec une charge chiffrée", () => {
    const r = calculerPartage({
      regime: "patrimoine_familial",
      cause: "divorce",
      biens: [reer({ chargeFiscaleLatente: 40_000, partageableEnNature: true })],
    });
    expect(r.reserves.find((x) => x.code === "impot_latent")).toBeUndefined();
    expect(r.valeurPartageableTotaleApresImpotLatent).toBeNull();
  });
});
