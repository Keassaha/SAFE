import { describe, expect, it } from "vitest";
import {
  isCabinetFerme,
  isFermetureExemptPath,
  shouldBlockForFermeture,
} from "@/lib/services/cabinet-fermeture";

const NOW = new Date("2026-08-20T12:00:00.000Z");
const HIER = new Date("2026-08-19T12:00:00.000Z");
const DEMAIN = new Date("2026-08-21T12:00:00.000Z");

describe("isCabinetFerme", () => {
  it("un cabinet sans date est ouvert", () => {
    expect(isCabinetFerme({ fermeLe: null }, NOW)).toBe(false);
    expect(isCabinetFerme({}, NOW)).toBe(false);
    expect(isCabinetFerme(null, NOW)).toBe(false);
  });

  it("une date passée ferme l'espace", () => {
    expect(isCabinetFerme({ fermeLe: HIER }, NOW)).toBe(true);
  });

  it("une date future laisse l'espace ouvert jusqu'au jour dit", () => {
    // Préavis convenu avec le cabinet : il travaille jusqu'à la date.
    expect(isCabinetFerme({ fermeLe: DEMAIN }, NOW)).toBe(false);
  });

  it("le jour même ferme", () => {
    expect(isCabinetFerme({ fermeLe: NOW }, NOW)).toBe(true);
  });
});

describe("shouldBlockForFermeture", () => {
  it("un cabinet ouvert n'est jamais bloqué", () => {
    expect(shouldBlockForFermeture("/tableau-de-bord", { fermeLe: null }, NOW)).toBe(false);
  });

  it("un cabinet fermé ne peut plus ouvrir les écrans de travail", () => {
    for (const p of ["/tableau-de-bord", "/clients", "/facturation", "/comptes", "/dossiers"]) {
      expect(shouldBlockForFermeture(p, { fermeLe: HIER }, NOW)).toBe(true);
    }
  });

  it("les pages qui servent à partir restent ouvertes", () => {
    expect(shouldBlockForFermeture("/parametres", { fermeLe: HIER }, NOW)).toBe(false);
    expect(shouldBlockForFermeture("/parametres/retention", { fermeLe: HIER }, NOW)).toBe(false);
    expect(isFermetureExemptPath("/parametres")).toBe(true);
  });

  it("rouvrir se fait en effaçant la date, sans rien restaurer", () => {
    const ferme = { fermeLe: HIER };
    expect(shouldBlockForFermeture("/tableau-de-bord", ferme, NOW)).toBe(true);
    const rouvert = { ...ferme, fermeLe: null };
    expect(shouldBlockForFermeture("/tableau-de-bord", rouvert, NOW)).toBe(false);
  });
});
