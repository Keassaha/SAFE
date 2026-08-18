/**
 * Le plafond québécois sur les frais de représentation.
 *
 * Paliers confirmés le 2026-08-18 sur le guide IN-155 §6.11.1 de Revenu Québec,
 * après être restés `A_CONFIRMER` depuis le 2026-08-17.
 *
 * Ce que ces tests verrouillent :
 *   1. les trois paliers et leurs bornes exactes ;
 *   2. la continuité du barème, qui est la preuve qu'il est bien transcrit ;
 *   3. l'absence de plafond hors Québec, où rendre zéro serait faux.
 */

import { describe, it, expect } from "vitest";
import {
  plafondRepresentation,
  deductionRepresentation,
  PALIERS_QC,
} from "../plafond-representation";

describe("les trois paliers", () => {
  it.each([
    [10_000, 200], // 2 %
    [32_500, 650], // borne haute du 1er palier
    [40_000, 650], // montant fixe
    [52_000, 650], // borne haute du 2e palier
    [100_000, 1250], // 1,25 %
    [1_000_000, 12_500],
  ])("chiffre d'affaires %s $ donne un plafond de %s $", (ca, attendu) => {
    expect(plafondRepresentation(ca, "QC")).toBe(attendu);
  });

  it("le barème est CONTINU aux deux bornes", () => {
    // 2 % de 32 500 = 650 et 1,25 % de 52 000 = 650. C'est une propriété voulue du
    // barème, et le meilleur garde-fou contre une erreur de transcription : si une
    // borne était fausse, le plafond sauterait à la jonction.
    expect(plafondRepresentation(32_500, "QC")).toBe(650);
    expect(plafondRepresentation(32_500.01, "QC")).toBe(650);
    expect(plafondRepresentation(51_999.99, "QC")).toBe(650);
    expect(plafondRepresentation(52_000, "QC")).toBe(650);
    expect(plafondRepresentation(52_000.01, "QC")).toBeCloseTo(650, 1);
  });

  it("le barème a exactement trois paliers", () => {
    expect(PALIERS_QC).toHaveLength(3);
    expect(PALIERS_QC[2].jusqua).toBeNull();
  });
});

describe("hors Québec", () => {
  it.each(["ON", "AB", "BC", null, undefined])("%s n'a aucun plafond", (prov) => {
    // L'art. 67.1 fédéral n'impose que la limite de 50 %. Rendre 0 laisserait croire
    // qu'aucune déduction n'est permise, ce qui est l'inverse de la réalité.
    expect(plafondRepresentation(100_000, prov as string | null)).toBeNull();
  });

  it("un cabinet ontarien déduit la moitié, sans plafond", () => {
    const d = deductionRepresentation({
      fraisEngages: 4000,
      chiffreAffairesAnnuel: 100_000,
      province: "ON",
    });
    expect(d.deductible).toBe(2000);
    expect(d.plafond).toBeNull();
    expect(d.plafondApplique).toBe(false);
  });
});

describe("la déduction finale est le moindre des deux", () => {
  it("reprend l'exemple du guide IN-155", () => {
    // CA 50 000 $, frais 2 000 $ : limite 50 % = 1 000 $, plafond = 650 $,
    // déductible = 650 $. Exemple textuel du §6.11.1.
    const d = deductionRepresentation({
      fraisEngages: 2000,
      chiffreAffairesAnnuel: 50_000,
      province: "QC",
    });
    expect(d.limite50).toBe(1000);
    expect(d.plafond).toBe(650);
    expect(d.deductible).toBe(650);
    expect(d.plafondApplique).toBe(true);
  });

  it("quand la limite de 50 % mord la première, le plafond ne s'applique pas", () => {
    const d = deductionRepresentation({
      fraisEngages: 400,
      chiffreAffairesAnnuel: 500_000,
      province: "QC",
    });
    expect(d.deductible).toBe(200);
    expect(d.plafondApplique).toBe(false);
  });

  it("aucun frais ne donne aucune déduction, sans planter", () => {
    const d = deductionRepresentation({
      fraisEngages: 0,
      chiffreAffairesAnnuel: 100_000,
      province: "QC",
    });
    expect(d.deductible).toBe(0);
  });

  it("un chiffre d'affaires aberrant ne fabrique pas de plafond", () => {
    expect(plafondRepresentation(-5, "QC")).toBeNull();
    expect(plafondRepresentation(Number.NaN, "QC")).toBeNull();
  });
});
