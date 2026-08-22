import { describe, it, expect } from "vitest";
import { jours, nombre, saisieSuffisante, saisieVersEntree, type Saisie } from "../saisie";
import { calculerPension } from "../calcul";

const vide: Saisie = {
  divorce: true,
  deuxParentsAuQuebec: true,
  pere: { revenuAnnuel: "", cotisationsSyndicales: "", cotisationsProfessionnelles: "" },
  mere: { revenuAnnuel: "", cotisationsSyndicales: "", cotisationsProfessionnelles: "" },
  nombreEnfants: "",
  fraisGarde: "",
  fraisEtudes: "",
  fraisParticuliers: "",
  situation: "exclusive",
  parentNonGardien: "pere",
  joursNonGardien: "",
  enfantsChezPere: "",
  enfantsChezMere: "",
  joursPere: "",
  joursMere: "",
};

describe("lire ce qui est tapé", () => {
  it.each([["80 000 $", 80_000], ["1 250,50", 1250.5], ["", 0], ["abc", 0]])(
    "%s donne %s",
    (s, attendu) => expect(nombre(s)).toBe(attendu),
  );

  it("borne les jours de garde à l'année, dans les deux sens", () => {
    expect(jours("400")).toBe(365);
    expect(jours("-10")).toBe(0);
    expect(jours("182,5")).toBe(182.5);
  });
});

describe("le calcul n'a de sens qu'avec de quoi calculer", () => {
  it("refuse une saisie vide", () => {
    expect(saisieSuffisante(vide)).toBe(false);
  });

  it("refuse zéro enfant", () => {
    expect(
      saisieSuffisante({ ...vide, nombreEnfants: "0", pere: { ...vide.pere, revenuAnnuel: "80000" } }),
    ).toBe(false);
  });

  it("accepte dès qu'un revenu et un enfant sont donnés", () => {
    expect(
      saisieSuffisante({ ...vide, nombreEnfants: "1", pere: { ...vide.pere, revenuAnnuel: "80000" } }),
    ).toBe(true);
  });
});

describe("de la frappe au montant", () => {
  const saisie: Saisie = {
    ...vide,
    pere: { revenuAnnuel: "80 000 $", cotisationsSyndicales: "", cotisationsProfessionnelles: "" },
    mere: { revenuAnnuel: "40 000 $", cotisationsSyndicales: "", cotisationsProfessionnelles: "" },
    nombreEnfants: "2",
    situation: "exclusive",
    parentNonGardien: "pere",
  };

  it("produit une pension, un débiteur et des lignes numérotées", () => {
    const r = calculerPension(saisieVersEntree(saisie));
    expect(r.debiteur).toBe("pere");
    expect(r.pensionAnnuelle).toBeGreaterThan(0);
    expect(r.pensionMensuelle).toBeCloseTo(r.pensionAnnuelle! / 12, 2);
    expect(r.lignes.map((l) => l.numero)).toContain("401");
  });

  it("le nombre d'enfants est un entier, même si on tape 2,7", () => {
    const e = saisieVersEntree({ ...saisie, nombreEnfants: "2,7" });
    expect(Number.isInteger(e.nombreEnfants)).toBe(true);
  });

  it("un divorce avec un parent hors Québec s'arrête avant de calculer", () => {
    const r = calculerPension(saisieVersEntree({ ...saisie, deuxParentsAuQuebec: false }));
    expect(r.pensionAnnuelle).toBeNull();
    expect(r.reserves[0].code).toBe("regime_federal");
  });
});
