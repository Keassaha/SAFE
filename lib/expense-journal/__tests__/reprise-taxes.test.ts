/**
 * Reprise de l'historique — arbitrage CEO n° 4.
 *
 * Ce que ces tests verrouillent, par ordre de gravité si ça cassait :
 *   1. une reprise ne produit JAMAIS une taxe réclamable ;
 *   2. elle ne fabrique pas de taxe sur une catégorie exonérée ;
 *   3. elle ne touche pas le montant, donc le journal reste juste.
 */

import { describe, it, expect } from "vitest";
import { planifierReprise, type LigneAReprendre } from "../reprise-taxes";
import type { CabinetTaxConfig } from "@/lib/billing/types";

const QC: CabinetTaxConfig = { province: "QC", mode: "tps_tvq", rates: { tps: 5, tvq: 9.975 } };

const l = (over: Partial<LigneAReprendre> = {}): LigneAReprendre => ({
  id: "e1",
  montant: 114.98,
  categoryCode: "LOGICIELS",
  ...over,
});

describe("la garantie centrale", () => {
  it("aucune ligne reprise n'est jamais DECLAREE", () => {
    // La reprise répare le chiffre sans prétendre l'avoir lu sur un reçu. Une
    // ligne déclarée serait réclamable en déclaration sans pièce pour la soutenir.
    const { plan } = planifierReprise(
      [
        l(),
        l({ id: "e2", categoryCode: "SALAIRES", montant: 3000 }),
        l({ id: "e3", categoryCode: "ASSURANCES", montant: 500 }),
        l({ id: "e4", categoryCode: "TRIBUNAL", montant: 200 }),
      ],
      QC,
    );
    for (const p of plan) {
      expect(p.origine, p.id).not.toBe("DECLAREE");
    }
  });

  it("les lignes estimées restent dans la file à confirmer", () => {
    const { plan } = planifierReprise([l()], QC);
    expect(plan[0].origine).toBe("ESTIMEE");
  });
});

describe("le régime des catégories est respecté", () => {
  it("un salaire repris ne reçoit aucune taxe", () => {
    const { plan, resume } = planifierReprise([l({ categoryCode: "SALAIRES", montant: 3000 })], QC);
    expect(plan[0].origine).toBe("AUCUNE");
    expect(plan[0].tps + plan[0].tvq).toBe(0);
    expect(plan[0].montantHt).toBe(3000);
    expect(resume.sansTaxe).toBe(1);
    expect(resume.estimees).toBe(0);
  });

  it("un droit de greffe repris n'est pas estimé non plus", () => {
    const { plan } = planifierReprise([l({ categoryCode: "TRIBUNAL", montant: 200 })], QC);
    expect(plan[0].origine).toBe("AUCUNE");
  });
});

describe("le montant n'est jamais touché", () => {
  it("HT + taxes retombe sur le montant d'origine, au centime", () => {
    // Le journal général inscrit `expense.montant`. Si la reprise déplaçait un
    // centime, le journal et la dépense diraient deux choses différentes.
    for (const montant of [114.98, 34.49, 1.15, 9876.54]) {
      const { plan } = planifierReprise([l({ montant })], QC);
      const somme = Math.round((plan[0].montantHt + plan[0].tps + plan[0].tvq) * 100) / 100;
      expect(somme, `montant ${montant}`).toBe(montant);
    }
  });
});

describe("le résumé sert à décider avant d'agir", () => {
  it("compte les deux familles et totalise la taxe estimée", () => {
    const { resume } = planifierReprise(
      [
        l({ id: "a", montant: 114.98 }),
        l({ id: "b", montant: 34.49 }),
        l({ id: "c", categoryCode: "SALAIRES", montant: 3000 }),
      ],
      QC,
    );
    expect(resume.examinees).toBe(3);
    expect(resume.estimees).toBe(2);
    expect(resume.sansTaxe).toBe(1);
    expect(resume.taxeEstimee).toBeCloseTo(19.47, 2);
  });

  it("un lot vide ne casse pas", () => {
    const { plan, resume } = planifierReprise([], QC);
    expect(plan).toEqual([]);
    expect(resume.examinees).toBe(0);
  });
});

describe("cabinet sans régime de taxes", () => {
  it("tout tombe en AUCUNE plutôt qu'en taxe nulle", () => {
    const { plan, resume } = planifierReprise([l()], {
      province: "QC",
      mode: "none",
      rates: {},
    });
    expect(plan[0].origine).toBe("AUCUNE");
    expect(resume.estimees).toBe(0);
  });
});
