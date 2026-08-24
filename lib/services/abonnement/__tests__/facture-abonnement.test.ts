import { describe, it, expect } from "vitest";
import {
  MOIS_COUVERTS_MAX,
  preparerFactureAbonnement,
  validerMoisCouverts,
  EmissionFactureAbonnementError,
} from "../facture-abonnement";

describe("mois couverts", () => {
  it("accepte un entier de un à douze", () => {
    expect(validerMoisCouverts(1)).toBe(1);
    expect(validerMoisCouverts(MOIS_COUVERTS_MAX)).toBe(MOIS_COUVERTS_MAX);
    expect(validerMoisCouverts("3")).toBe(3);
  });

  /* Une facture de zéro mois n'ouvrirait aucun droit tout en creusant un
     numero dans la sequence Barreau. */
  it("refuse zéro, le négatif et le fractionnaire", () => {
    for (const v of [0, -1, 1.5, "deux", null, undefined]) {
      expect(() => validerMoisCouverts(v)).toThrow(EmissionFactureAbonnementError);
    }
  });

  /* Garde-fou de saisie, pas règle commerciale : une faute de frappe ne doit
     pas offrir huit ans d'accès sans que personne ne le remarque. */
  it("refuse au-delà du plafond", () => {
    expect(() => validerMoisCouverts(MOIS_COUVERTS_MAX + 1)).toThrow(/entre 1 et/);
  });
});

describe("préparation de la facture", () => {
  const base = { nomCabinet: "Derisier Law", montantMensuel: 75, dateEmission: new Date("2026-07-01T12:00:00Z") };

  it("multiplie la mensualité par les mois couverts", () => {
    expect(preparerFactureAbonnement({ ...base, mois: 1 }).montant).toBe(75);
    expect(preparerFactureAbonnement({ ...base, mois: 3 }).montant).toBe(225);
  });

  it("accorde le libellé au nombre de mois", () => {
    expect(preparerFactureAbonnement({ ...base, mois: 1 }).description).toContain("1 mois");
    expect(preparerFactureAbonnement({ ...base, mois: 6 }).description).toContain("6 mois");
  });

  /* Le virement est déjà arrivé quand la facture s'écrit : une échéance future
     ferait apparaître un impayé qui n'existe pas. */
  it("échoit le jour même", () => {
    const p = preparerFactureAbonnement({ ...base, mois: 1 });
    expect(p.dateEcheance).toEqual(base.dateEmission);
  });

  it("arrondit au cent, sans traîner de flottant", () => {
    const p = preparerFactureAbonnement({ ...base, montantMensuel: 49.99, mois: 3 });
    expect(p.montant).toBe(149.97);
  });

  it("bute sur la fin du mois plutôt que de déborder", () => {
    const p = preparerFactureAbonnement({
      ...base,
      dateEmission: new Date("2026-01-31T12:00:00Z"),
      mois: 1,
    });
    expect(p.periodeFin.toISOString().slice(0, 10)).toBe("2026-02-28");
  });
});
