import { describe, expect, it } from "vitest";
import {
  ajouterMois,
  deciderProlongation,
} from "@/lib/services/abonnement/acces-paye";

const d = (iso: string) => new Date(iso);
const MAINTENANT = d("2026-08-20T12:00:00.000Z");

describe("ajouterMois", () => {
  it("ajoute un mois ordinaire", () => {
    expect(ajouterMois(d("2026-08-20T12:00:00.000Z"), 1).toISOString())
      .toBe("2026-09-20T12:00:00.000Z");
  });

  it("bute sur la fin du mois plutôt que de déborder", () => {
    // `setMonth` seul donnerait le 3 mars : l'abonné sauterait février entier.
    expect(ajouterMois(d("2026-01-31T12:00:00.000Z"), 1).toISOString())
      .toBe("2026-02-28T12:00:00.000Z");
    expect(ajouterMois(d("2026-05-31T12:00:00.000Z"), 1).toISOString())
      .toBe("2026-06-30T12:00:00.000Z");
  });

  it("gère le 29 février d'une année bissextile", () => {
    expect(ajouterMois(d("2028-01-31T12:00:00.000Z"), 1).toISOString())
      .toBe("2028-02-29T12:00:00.000Z");
  });

  it("franchit l'année", () => {
    expect(ajouterMois(d("2026-12-15T12:00:00.000Z"), 1).toISOString())
      .toBe("2027-01-15T12:00:00.000Z");
  });

  it("ajoute douze mois pour une facture annuelle", () => {
    expect(ajouterMois(d("2026-08-20T12:00:00.000Z"), 12).toISOString())
      .toBe("2027-08-20T12:00:00.000Z");
  });

  it("ne dérive pas sur douze mois consécutifs depuis un 31", () => {
    // Chaque mois repart du jour d'origine, jamais du résultat buté.
    let dt = d("2026-01-31T00:00:00.000Z");
    const jours = new Set<number>();
    for (let i = 1; i <= 12; i++) jours.add(ajouterMois(dt, i).getUTCDate());
    // Seuls des jours de fin de mois : 28, 29, 30 ou 31, jamais un 1er ou un 3.
    for (const j of jours) expect(j).toBeGreaterThanOrEqual(28);
  });
});

describe("deciderProlongation — refus", () => {
  const base = {
    balanceDue: 0,
    dejaProlongeJusquau: null,
    accesActuel: null,
    moisCouverts: 1,
    maintenant: MAINTENANT,
  };

  it("une facture ordinaire de cabinet d'avocats ne prolonge rien", () => {
    const r = deciderProlongation({ ...base, cabinetAbonneId: null });
    expect(r).toEqual({ prolonger: false, raison: "pas_un_abonnement" });
  });

  it("une facture déjà appliquée ne prolonge pas une seconde fois", () => {
    // Idempotence : paiement rejoué, corrigé ou réalloué.
    const r = deciderProlongation({
      ...base,
      cabinetAbonneId: "cab_1",
      dejaProlongeJusquau: d("2026-09-20T12:00:00.000Z"),
    });
    expect(r).toEqual({ prolonger: false, raison: "deja_prolongee" });
  });

  it("un paiement partiel n'achète pas un mois", () => {
    const r = deciderProlongation({ ...base, cabinetAbonneId: "cab_1", balanceDue: 25 });
    expect(r).toEqual({ prolonger: false, raison: "solde_restant" });
  });

  it("un résidu d'un dixième de cent ne bloque pas la prolongation", () => {
    const r = deciderProlongation({ ...base, cabinetAbonneId: "cab_1", balanceDue: 0.001 });
    expect(r.prolonger).toBe(true);
  });
});

describe("deciderProlongation — calcul de l'échéance", () => {
  const base = {
    cabinetAbonneId: "cab_1",
    balanceDue: 0,
    dejaProlongeJusquau: null,
    moisCouverts: 1,
    maintenant: MAINTENANT,
  };

  it("premier paiement : un mois à partir d'aujourd'hui", () => {
    const r = deciderProlongation({ ...base, accesActuel: null });
    expect(r.prolonger && r.nouvelleEcheance.toISOString()).toBe("2026-09-20T12:00:00.000Z");
  });

  it("paiement en avance : les mois s'empilent, rien n'est perdu", () => {
    const r = deciderProlongation({ ...base, accesActuel: d("2026-10-01T12:00:00.000Z") });
    expect(r.prolonger && r.nouvelleEcheance.toISOString()).toBe("2026-11-01T12:00:00.000Z");
  });

  it("paiement en retard : le mois court du paiement, jamais rétroactif", () => {
    // Échéance dépassée depuis juin : on ne vend pas les jours déjà écoulés.
    const r = deciderProlongation({ ...base, accesActuel: d("2026-06-01T12:00:00.000Z") });
    expect(r.prolonger && r.nouvelleEcheance.toISOString()).toBe("2026-09-20T12:00:00.000Z");
  });

  it("facture annuelle : douze mois", () => {
    const r = deciderProlongation({ ...base, accesActuel: null, moisCouverts: 12 });
    expect(r.prolonger && r.nouvelleEcheance.toISOString()).toBe("2027-08-20T12:00:00.000Z");
  });

  it("moisCouverts absent vaut un mois", () => {
    const r = deciderProlongation({ ...base, accesActuel: null, moisCouverts: null });
    expect(r.prolonger && r.mois).toBe(1);
  });

  it("une valeur absurde ne produit jamais une échéance dans le passé", () => {
    for (const absurde of [0, -3, 1.5, NaN]) {
      const r = deciderProlongation({ ...base, accesActuel: null, moisCouverts: absurde });
      expect(r.prolonger).toBe(true);
      expect(r.prolonger && r.nouvelleEcheance.getTime()).toBeGreaterThan(MAINTENANT.getTime());
    }
  });
});
