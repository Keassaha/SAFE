import { describe, expect, it } from "vitest";
import { isCompteDesactive } from "@/lib/auth/compte-desactive";

const NOW = new Date("2026-08-21T12:00:00.000Z");
const HIER = new Date("2026-08-20T12:00:00.000Z");
const DEMAIN = new Date("2026-08-22T12:00:00.000Z");

describe("isCompteDesactive", () => {
  it("un compte sans date est actif", () => {
    expect(isCompteDesactive({ desactiveLe: null }, NOW)).toBe(false);
    expect(isCompteDesactive({}, NOW)).toBe(false);
    expect(isCompteDesactive(null, NOW)).toBe(false);
  });

  it("une date passée désactive", () => {
    expect(isCompteDesactive({ desactiveLe: HIER }, NOW)).toBe(true);
  });

  it("une date future laisse l'accès jusqu'au jour dit", () => {
    // Dernier jour convenu avec la personne qui part : l'accès s'arrête tout
    // seul ce jour-là, sans que personne ait à y repenser.
    expect(isCompteDesactive({ desactiveLe: DEMAIN }, NOW)).toBe(false);
  });

  it("le jour même désactive", () => {
    expect(isCompteDesactive({ desactiveLe: NOW }, NOW)).toBe(true);
  });

  it("réactiver, c'est effacer la date", () => {
    const parti = { desactiveLe: HIER };
    expect(isCompteDesactive(parti, NOW)).toBe(true);
    expect(isCompteDesactive({ ...parti, desactiveLe: null }, NOW)).toBe(false);
  });

  it("la règle ne dépend PAS d'une fiche employé", () => {
    // C'est tout l'objet du correctif : neuf comptes sur dix n'en ont pas.
    expect(isCompteDesactive({ desactiveLe: HIER } as { desactiveLe: Date }, NOW)).toBe(true);
  });
});
