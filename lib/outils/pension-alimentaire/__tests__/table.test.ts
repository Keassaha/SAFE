/**
 * La table est la seule chose ici qu'on ne peut pas déduire du règlement : ce sont des
 * montants. Ces tests vérifient qu'elle n'a pas dérivé depuis la pièce officielle.
 */
import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import {
  DEDUCTION_DE_BASE,
  POURCENTAGES_AU_DELA,
  TABLE_VERSION,
  TRANCHES,
} from "../table-2026-01-01";
import { contributionDeBase } from "../calcul";

const officielle = JSON.parse(
  fs.readFileSync(
    path.join(
      process.cwd(),
      "docs/research/sources-officielles/table-contribution-alimentaire-2026-01-01.json",
    ),
    "utf-8",
  ),
);

describe("le module généré ne diverge pas de la pièce officielle", () => {
  it("porte la même version et la même déduction de base", () => {
    expect(TABLE_VERSION).toBe(officielle.source.applicable_a_compter_du);
    expect(DEDUCTION_DE_BASE).toBe(officielle.deduction_de_base_ligne_301);
    expect([...POURCENTAGES_AU_DELA]).toEqual(
      officielle.au_dela_de_200000.pourcentages_de_l_excedent,
    );
  });

  it("reproduit les 105 tranches au dollar près", () => {
    expect(TRANCHES).toHaveLength(officielle.tranches.length);
    TRANCHES.forEach((t, i) => {
      expect([t.de, t.a, ...t.montants]).toEqual([
        officielle.tranches[i].de,
        officielle.tranches[i].a,
        ...officielle.tranches[i].montants,
      ]);
    });
  });
});

describe("la table se lit correctement", () => {
  it("rend les montants de la première et de la dernière tranche", () => {
    expect(contributionDeBase(500, 1)).toBe(500);
    expect(contributionDeBase(199_000, 1)).toBe(15_140);
    expect(contributionDeBase(199_000, 6)).toBe(47_140);
  });

  it("croît avec le revenu et avec le nombre d'enfants", () => {
    for (let n = 1; n <= 6; n++) {
      expect(contributionDeBase(80_000, n)).toBeGreaterThanOrEqual(
        contributionDeBase(60_000, n),
      );
    }
    for (let n = 1; n < 6; n++) {
      expect(contributionDeBase(60_000, n + 1)).toBeGreaterThan(
        contributionDeBase(60_000, n),
      );
    }
  });

  it("est continue au passage d'une tranche à la suivante", () => {
    for (let i = 1; i < TRANCHES.length; i++) {
      expect(TRANCHES[i].de).toBe(TRANCHES[i - 1].a + 1);
    }
  });

  it("prolonge la table au-delà de six enfants par l'écart entre 5 et 6", () => {
    // r. 12, art. 1 al. 2
    const cinq = contributionDeBase(60_000, 5);
    const six = contributionDeBase(60_000, 6);
    expect(contributionDeBase(60_000, 7)).toBe(six + (six - cinq));
    expect(contributionDeBase(60_000, 9)).toBe(six + 3 * (six - cinq));
  });

  it("ajoute le pourcentage de l'excédent au-delà de 200 000 $", () => {
    const plafond = contributionDeBase(200_000, 1);
    // 3,5 % pour un enfant.
    expect(contributionDeBase(300_000, 1)).toBe(plafond + 100_000 * 0.035);
  });

  it("rend zéro plutôt que d'inventer, quand il n'y a rien à calculer", () => {
    expect(contributionDeBase(0, 2)).toBe(0);
    expect(contributionDeBase(-5000, 2)).toBe(0);
    expect(contributionDeBase(60_000, 0)).toBe(0);
  });
});
