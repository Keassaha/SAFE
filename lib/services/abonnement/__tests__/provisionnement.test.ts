import { describe, expect, it } from "vitest";
import {
  validerJourFacturation,
  validerMontantMensuel,
  verifierAucuneTaxe,
} from "@/lib/services/abonnement/provisionnement.mjs";

describe("validerJourFacturation", () => {
  it("accepte 1 à 28", () => {
    for (const j of [1, 15, 28]) expect(validerJourFacturation(j)).toEqual({ ok: true, jour: j });
  });

  it("refuse 29, 30 et 31 : février ne les a pas", () => {
    for (const j of [29, 30, 31]) expect(validerJourFacturation(j).ok).toBe(false);
  });

  it("refuse 0, les négatifs et les décimaux", () => {
    for (const j of [0, -1, 1.5]) expect(validerJourFacturation(j).ok).toBe(false);
  });

  it("accepte une chaîne numérique venue de la ligne de commande", () => {
    expect(validerJourFacturation("15")).toEqual({ ok: true, jour: 15 });
  });

  it("refuse ce qui n'est pas un nombre", () => {
    for (const j of ["abc", null, undefined, {}]) expect(validerJourFacturation(j).ok).toBe(false);
  });
});

describe("validerMontantMensuel", () => {
  it("accepte les tarifs fondateurs et catalogue", () => {
    for (const m of [50, 75, 79, 119, 99, 149.99, 299.99]) {
      expect(validerMontantMensuel(m)).toEqual({ ok: true, montant: m });
    }
  });

  it("refuse zéro et renvoie vers le script d'accès gratuit", () => {
    const r = validerMontantMensuel(0);
    expect(r.ok).toBe(false);
    expect(!r.ok && r.message).toContain("accorder-abonnement-gratuit");
  });

  it("refuse un montant négatif", () => {
    expect(validerMontantMensuel(-50).ok).toBe(false);
  });

  it("refuse plus de deux décimales", () => {
    expect(validerMontantMensuel(49.999).ok).toBe(false);
  });

  it("accepte la virgule décimale française en ligne de commande", () => {
    expect(validerMontantMensuel("149,99")).toEqual({ ok: true, montant: 149.99 });
  });
});

describe("verifierAucuneTaxe", () => {
  it("laisse passer le mode « none »", () => {
    expect(verifierAucuneTaxe("none")).toEqual({ ok: true });
  });

  it("bloque le défaut québécois, qui taxerait sans inscription", () => {
    const r = verifierAucuneTaxe(undefined);
    expect(r.ok).toBe(false);
    expect(!r.ok && r.message).toContain("perception indue");
  });

  it("bloque tps_tvq et hst", () => {
    for (const m of ["tps_tvq", "hst", "tps_only"]) expect(verifierAucuneTaxe(m).ok).toBe(false);
  });
});
