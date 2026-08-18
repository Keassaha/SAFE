/**
 * Le modèle de liste de pièces, divorce Québec.
 *
 * Recherche : docs/research/RECHERCHE_divulgation_famille_QC_2026-08-18.md
 *
 * Ce que ces tests verrouillent :
 *   1. les pièces d'appui ne portent JAMAIS de référence légale ;
 *   2. les pièces nommées par le droit en portent toujours une ;
 *   3. la pièce due par la partie adverse est marquée comme telle.
 */

import { describe, it, expect } from "vitest";
import { MODELE_DIVORCE_QC } from "../pieces-attendues-service";

const legales = MODELE_DIVORCE_QC.filter((m) => m.referenceLegale !== null);
const appui = MODELE_DIVORCE_QC.filter((m) => m.referenceLegale === null);

describe("les deux natures de pièces ne se confondent pas", () => {
  it("les pièces d'appui ne portent aucune référence légale", () => {
    // Afficher un délai légal sur une piece d'appui donnerait une fausse assurance :
    // elles ne figurent dans aucun règlement, elles servent à remplir les autres.
    expect(appui.length).toBeGreaterThan(0);
    for (const m of appui) {
      expect(m.referenceLegale, m.libelle).toBeNull();
      expect(m.echeanceDepuis, m.libelle).toBeUndefined();
    }
  });

  it("les pièces nommées par le droit citent leur article et savent d'où compter", () => {
    expect(legales.length).toBe(6);
    for (const m of legales) {
      expect(m.referenceLegale, m.libelle).toMatch(/C\.p\.c\.|Règl\./);
      expect(m.echeanceDepuis, m.libelle).toBeTruthy();
      expect(m.decalageJours, m.libelle).toBeTypeOf("number");
    }
  });
});

describe("les délais du modèle correspondent au droit", () => {
  it.each([
    ["C.p.c. art. 413 al. 2", "presentation", -10],
    ["C.p.c. art. 413 al. 1", "protocole", 0],
    ["Règl. Cour sup. fam. art. 27", "signification", 180],
  ])("%s compte depuis %s, décalage %i", (ref, depuis, decalage) => {
    const m = legales.find((x) => x.referenceLegale === ref)!;
    expect(m.echeanceDepuis).toBe(depuis);
    expect(m.decalageJours).toBe(decalage);
  });

  it("les pièces liées à l'instruction sont dues 10 jours avant", () => {
    for (const m of legales.filter((x) => x.echeanceDepuis === "instruction")) {
      expect(m.decalageJours, m.libelle).toBe(-10);
    }
  });
});

describe("la partie adverse est nommée, pas rangée dans « tiers »", () => {
  it("l'état financier de l'autre partie vient d'elle", () => {
    const m = MODELE_DIVORCE_QC.find((x) => x.fournisseur === "PARTIE_ADVERSE")!;
    expect(m).toBeTruthy();
    expect(m.libelle).toMatch(/partie adverse/i);
  });

  it("tout le reste vient du client", () => {
    const autres = MODELE_DIVORCE_QC.filter((m) => m.fournisseur !== "PARTIE_ADVERSE");
    expect(autres.every((m) => m.fournisseur === "CLIENT")).toBe(true);
  });
});

describe("ce que le client lit", () => {
  it("chaque pièce dit POURQUOI elle est demandée, en une phrase", () => {
    // Le client ne doit jamais lire « documents financiers ».
    for (const m of MODELE_DIVORCE_QC) {
      expect(m.raison.length, m.libelle).toBeGreaterThan(25);
      expect(m.raison, m.libelle).not.toMatch(/C\.p\.c\.|art\./);
    }
  });

  it("aucun libellé n'est générique", () => {
    for (const m of MODELE_DIVORCE_QC) {
      expect(m.libelle.length, m.libelle).toBeGreaterThan(15);
      expect(m.libelle, m.libelle).not.toMatch(/^documents?$/i);
    }
  });

  it("la conséquence du délai le plus grave est dite au client", () => {
    const m = legales.find((x) => x.referenceLegale === "C.p.c. art. 413 al. 2")!;
    expect(m.raison).toMatch(/ne peut pas être décidée/);
  });

  it("les trois solutions de rechange au formulaire de patrimoine sont annoncées", () => {
    // L'art. 27 les admet. Sans ça, SAFE réclamerait un formulaire qui n'est pas dû.
    const m = legales.find((x) => x.referenceLegale === "Règl. Cour sup. fam. art. 27")!;
    expect(m.raison).toMatch(/renonciation/);
    expect(m.raison).toMatch(/n'est pas contesté/);
  });
});

describe("conditionnelles", () => {
  it("ce qui dépend des enfants est conditionnel, pas obligatoire", () => {
    const enfants = MODELE_DIVORCE_QC.filter((m) => /enfants/i.test(m.libelle));
    expect(enfants.length).toBe(2);
    expect(enfants.every((m) => m.obligation === "CONDITIONNELLE")).toBe(true);
  });
});
