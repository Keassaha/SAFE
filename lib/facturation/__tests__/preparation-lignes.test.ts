import { describe, it, expect } from "vitest";
import {
  calculerSousTotaux,
  estDebours,
  estHonoraire,
  estRabais,
} from "../preparation-lignes";

const l = (type: string, amount: number, extra: Record<string, unknown> = {}) => ({
  type,
  amount,
  ...extra,
});

describe("classement des lignes", () => {
  it("range les honoraires et les forfaits du côté du travail", () => {
    expect(estHonoraire("honoraires")).toBe(true);
    expect(estHonoraire("forfait")).toBe(true);
  });

  it("range les frais administratifs avec les débours, comme le fait le document", () => {
    expect(estDebours("frais_administratifs")).toBe(true);
    expect(estHonoraire("frais_administratifs")).toBe(false);
  });

  it("reconnaît les quatre formes de débours", () => {
    for (const t of ["debours", "debours_taxable", "debours_non_taxable", "frais_administratifs"]) {
      expect(estDebours(t)).toBe(true);
    }
  });

  it("isole le rabais des deux autres natures", () => {
    expect(estRabais("rabais")).toBe(true);
    expect(estDebours("rabais")).toBe(false);
    expect(estHonoraire("rabais")).toBe(false);
  });
});

describe("sous-totaux de préparation", () => {
  it("compte zéro sur une facture vide", () => {
    const s = calculerSousTotaux([]);
    expect(s).toEqual({
      honoraires: 0,
      deboursTaxables: 0,
      deboursNonTaxables: 0,
      debours: 0,
      rabais: 0,
      baseTaxable: 0,
    });
  });

  it("garde les débours non taxables HORS de l'assiette de la taxe", () => {
    const s = calculerSousTotaux([
      l("honoraires", 1000),
      l("debours", 1365, { taxable: false }),
    ]);
    expect(s.honoraires).toBe(1000);
    expect(s.deboursNonTaxables).toBe(1365);
    expect(s.deboursTaxables).toBe(0);
    // C'est le défaut corrigé : l'assiette valait 2365 avant.
    expect(s.baseTaxable).toBe(1000);
  });

  it("fait entrer les débours taxables dans l'assiette", () => {
    const s = calculerSousTotaux([l("honoraires", 1000), l("debours", 165, { taxable: true })]);
    expect(s.deboursTaxables).toBe(165);
    expect(s.baseTaxable).toBe(1165);
  });

  it("traite les frais administratifs comme un débours taxable", () => {
    const s = calculerSousTotaux([l("frais_administratifs", 50)]);
    expect(s.honoraires).toBe(0);
    expect(s.deboursTaxables).toBe(50);
    expect(s.baseTaxable).toBe(50);
  });

  it("retranche le rabais de l'assiette", () => {
    const s = calculerSousTotaux([l("honoraires", 1000), l("rabais", 100)]);
    expect(s.rabais).toBe(100);
    expect(s.baseTaxable).toBe(900);
  });

  it("retranche aussi le rabais porté par une ligne reprise d'un registre", () => {
    const s = calculerSousTotaux([l("forfait", 500, { rabais: 50 })]);
    expect(s.honoraires).toBe(500);
    expect(s.rabais).toBe(50);
    expect(s.baseTaxable).toBe(450);
  });

  it("additionne les deux familles de débours sur le titre du groupe", () => {
    const s = calculerSousTotaux([
      l("debours", 45, { taxable: true }),
      l("debours", 120, { taxable: true }),
      l("debours", 1365, { taxable: false }),
    ]);
    expect(s.debours).toBe(1530);
  });

  it("arrondit au cent, pas au flottant", () => {
    const s = calculerSousTotaux([l("honoraires", 0.1), l("honoraires", 0.2)]);
    expect(s.honoraires).toBe(0.3);
    expect(s.baseTaxable).toBe(0.3);
  });

  it("tient la facture complète de bout en bout", () => {
    const s = calculerSousTotaux([
      l("honoraires", 400),
      l("honoraires", 300),
      l("honoraires", 600),
      l("honoraires", 100),
      l("debours", 45, { taxable: true }),
      l("debours", 120, { taxable: true }),
      l("debours", 1365, { taxable: false }),
      l("rabais", 100),
    ]);
    expect(s.honoraires).toBe(1400);
    expect(s.deboursTaxables).toBe(165);
    expect(s.deboursNonTaxables).toBe(1365);
    expect(s.rabais).toBe(100);
    expect(s.baseTaxable).toBe(1465);
  });
});
