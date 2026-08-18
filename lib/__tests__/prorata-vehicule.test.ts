/**
 * Prorata d'usage du véhicule — arbitrage CEO n° 1.
 *
 * Ce que ces tests verrouillent :
 *   1. le prorata est PAR EXERCICE et ne déborde jamais sur une autre année ;
 *   2. une valeur hors bornes est refusée, pas corrigée en silence ;
 *   3. enregistrer une année n'efface pas les autres.
 */

import { describe, it, expect } from "vitest";
import {
  getProrataVehicule,
  setProrataVehicule,
  type CabinetConfig,
} from "../cabinet-config";

const config = (entrees: CabinetConfig["prorataVehicule"]): CabinetConfig => ({
  prorataVehicule: entrees,
});

describe("lecture par exercice", () => {
  it("rend le prorata de l'année demandée", () => {
    const c = config([{ annee: 2026, prorata: 0.6, saisiLe: "2026-08-18" }]);
    expect(getProrataVehicule(c, 2026)?.prorata).toBe(0.6);
  });

  it("ne retombe JAMAIS sur une autre année", () => {
    // Déduire 2025 avec le chiffre de 2026 serait une affirmation que rien ne
    // soutient, sur un exercice possiblement déjà déclaré.
    const c = config([{ annee: 2026, prorata: 0.6, saisiLe: "2026-08-18" }]);
    expect(getProrataVehicule(c, 2025)).toBeNull();
    expect(getProrataVehicule(c, 2027)).toBeNull();
  });

  it("une config vide rend null plutôt que zéro", () => {
    expect(getProrataVehicule({}, 2026)).toBeNull();
    expect(getProrataVehicule(config([]), 2026)).toBeNull();
  });
});

describe("valeurs aberrantes", () => {
  it.each([1.5, -0.2, Number.NaN])("refuse %s au lieu de le corriger", (v) => {
    // Un clamp silencieux transformerait une faute de saisie en déduction
    // fabriquée. Refuser laisse l'incertitude visible.
    const c = config([{ annee: 2026, prorata: v as number, saisiLe: "2026-08-18" }]);
    expect(getProrataVehicule(c, 2026)).toBeNull();
  });

  it("accepte les bornes exactes", () => {
    expect(getProrataVehicule(config([{ annee: 2026, prorata: 0, saisiLe: "x" }]), 2026)?.prorata).toBe(0);
    expect(getProrataVehicule(config([{ annee: 2026, prorata: 1, saisiLe: "x" }]), 2026)?.prorata).toBe(1);
  });
});

describe("écriture", () => {
  it("remplace l'année visée sans toucher aux autres", () => {
    const c = config([
      { annee: 2025, prorata: 0.4, saisiLe: "2025-01-10" },
      { annee: 2026, prorata: 0.6, saisiLe: "2026-08-18" },
    ]);
    const maj = setProrataVehicule(c, { annee: 2026, prorata: 0.7, saisiLe: "2026-08-19" });
    expect(getProrataVehicule(maj, 2026)?.prorata).toBe(0.7);
    expect(getProrataVehicule(maj, 2025)?.prorata).toBe(0.4);
    expect(maj.prorataVehicule).toHaveLength(2);
  });

  it("ajoute une année absente et trie du plus récent au plus ancien", () => {
    const maj = setProrataVehicule(config([{ annee: 2024, prorata: 0.3, saisiLe: "x" }]), {
      annee: 2026,
      prorata: 0.6,
      saisiLe: "2026-08-18",
    });
    expect(maj.prorataVehicule!.map((p) => p.annee)).toEqual([2026, 2024]);
  });

  it("conserve la date et l'auteur de la déclaration", () => {
    // Sans registre kilométrique, savoir QUAND et PAR QUI la valeur a été affirmée
    // est tout ce qui reste de défendable.
    const maj = setProrataVehicule({}, {
      annee: 2026,
      prorata: 0.6,
      saisiLe: "2026-08-18",
      saisiPar: "Me Derisier",
    });
    const e = getProrataVehicule(maj, 2026)!;
    expect(e.saisiLe).toBe("2026-08-18");
    expect(e.saisiPar).toBe("Me Derisier");
  });
});
