import { describe, it, expect } from "vitest";
import { resoudreTauxHoraire } from "../taux-horaire";

describe("resoudreTauxHoraire", () => {
  it("prend le taux du dossier quand il existe", () => {
    expect(resoudreTauxHoraire({ dossier: 300, avocat: 250, cabinet: 150 })).toEqual({
      taux: 300,
      source: "dossier",
    });
  });

  it("retombe sur l'avocat quand le dossier n'a pas de taux", () => {
    expect(resoudreTauxHoraire({ dossier: null, avocat: 250, cabinet: 150 })).toEqual({
      taux: 250,
      source: "avocat",
    });
  });

  it("retombe sur le cabinet quand ni le dossier ni l'avocat n'en ont", () => {
    expect(resoudreTauxHoraire({ avocat: null, cabinet: 150 })).toEqual({
      taux: 150,
      source: "cabinet",
    });
  });

  it("rend zéro et le dit quand rien n'est réglé nulle part", () => {
    expect(resoudreTauxHoraire({})).toEqual({ taux: 0, source: "aucune" });
  });

  it("ne prend pas un zéro pour un taux : zéro veut dire « pas de taux »", () => {
    // Un dossier au forfait porte `tauxHoraire: 0` ou null ; le laisser gagner
    // écraserait le taux de l'avocat par un zéro.
    expect(resoudreTauxHoraire({ dossier: 0, avocat: 250 })).toEqual({
      taux: 250,
      source: "avocat",
    });
  });

  it("écarte un taux négatif", () => {
    expect(resoudreTauxHoraire({ dossier: -50, cabinet: 150 })).toEqual({
      taux: 150,
      source: "cabinet",
    });
  });

  it("écarte NaN, qu'un Number(\"\") mal placé produit sans prévenir", () => {
    expect(resoudreTauxHoraire({ dossier: Number("abc"), avocat: 200 })).toEqual({
      taux: 200,
      source: "avocat",
    });
  });

  it("écarte l'infini", () => {
    expect(resoudreTauxHoraire({ avocat: Infinity, cabinet: 150 }).source).toBe("cabinet");
  });

  it("accepte un taux décimal", () => {
    expect(resoudreTauxHoraire({ avocat: 187.5 })).toEqual({ taux: 187.5, source: "avocat" });
  });

  it("traite undefined comme absent, pas comme zéro", () => {
    expect(resoudreTauxHoraire({ dossier: undefined, avocat: undefined, cabinet: 125 })).toEqual({
      taux: 125,
      source: "cabinet",
    });
  });
});
