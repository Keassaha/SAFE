/**
 * Lot 1 — la taxe payée sur une dépense.
 *
 * Spec : docs/accounting/SPEC_DEPENSES_ET_PREPARATION_FISCALE.md §2.1
 *
 * Ce que ces tests protègent, dans l'ordre de ce qu'une régression coûterait :
 *   1. ne jamais fabriquer de taxe sur une catégorie exonérée ;
 *   2. ne jamais présenter une taxe estimée comme réclamable ;
 *   3. ne jamais perdre un centime entre HT, taxes et TTC.
 */

import { describe, it, expect } from "vitest";
import { decomposeExpenseTax, taxeReclamable } from "../tax-decomposition";
import type { CabinetTaxConfig } from "@/lib/billing/types";

const QC: CabinetTaxConfig = {
  province: "QC",
  mode: "tps_tvq",
  rates: { tps: 5, tvq: 9.975 },
};
const ON: CabinetTaxConfig = { province: "ON", mode: "hst", rates: { hst: 13 } };

describe("le régime de la catégorie prime sur tout", () => {
  it("un salaire ne reçoit aucune taxe, même sur un gros montant", () => {
    const r = decomposeExpenseTax({ montantTtc: 5000, categoryCode: "SALAIRES", taxConfig: QC });
    expect(r.origine).toBe("AUCUNE");
    expect(r.tps + r.tvq).toBe(0);
    expect(r.montantHt).toBe(5000);
    expect(r.motif).toBeTruthy();
  });

  it("une prime d'assurance refuse même une taxe DÉCLARÉE", () => {
    // Le piège : la taxe sur les primes d'assurance existe au Québec et n'est PAS
    // récupérable. L'accepter la ferait entrer dans les récupérables.
    const r = decomposeExpenseTax({
      montantTtc: 1000,
      categoryCode: "ASSURANCES",
      taxConfig: QC,
      declared: { tps: 50, tvq: 99.75 },
    });
    expect(r.origine).toBe("AUCUNE");
    expect(r.reclamable).toBe(false);
    expect(r.tps + r.tvq).toBe(0);
  });

  it("un droit de greffe n'est pas estimé, mais accepte la pièce", () => {
    const sansPiece = decomposeExpenseTax({ montantTtc: 200, categoryCode: "TRIBUNAL", taxConfig: QC });
    expect(sansPiece.origine).toBe("AUCUNE");

    // Un sténographe judiciaire facture une taxe réelle et atterrit ici.
    const avecPiece = decomposeExpenseTax({
      montantTtc: 230,
      categoryCode: "TRIBUNAL",
      taxConfig: QC,
      declared: { tps: 10, tvq: 19.95 },
    });
    expect(avecPiece.origine).toBe("DECLAREE");
    expect(avecPiece.reclamable).toBe(true);
  });
});

describe("déclarée contre estimée", () => {
  it("une taxe lue sur la pièce est gardée telle quelle et reste réclamable", () => {
    const r = decomposeExpenseTax({
      montantTtc: 114.98,
      categoryCode: "LOGICIELS",
      taxConfig: QC,
      declared: { montantHt: 100, tps: 5, tvq: 9.98 },
    });
    expect(r.origine).toBe("DECLAREE");
    expect(r.reclamable).toBe(true);
    expect(r.montantHt).toBe(100);
    expect(r.tps).toBe(5);
    // On ne recalcule pas : 9,98 lu sur la pièce reste 9,98, pas 9,975 arrondi.
    expect(r.tvq).toBe(9.98);
  });

  it("une taxe décomposée d'un TTC n'est JAMAIS réclamable", () => {
    // Spec §2.2 c : le montant de taxe est exigé sur la pièce dès le premier dollar
    // pour la TVQ. Une estimation sert aux états, pas à la déclaration.
    const r = decomposeExpenseTax({ montantTtc: 114.98, categoryCode: "LOGICIELS", taxConfig: QC });
    expect(r.origine).toBe("ESTIMEE");
    expect(r.reclamable).toBe(false);
    expect(r.tps + r.tvq).toBeGreaterThan(0);
  });

  it("le HT se déduit quand la pièce donne la taxe sans le HT", () => {
    const r = decomposeExpenseTax({
      montantTtc: 114.98,
      categoryCode: "LOGICIELS",
      taxConfig: QC,
      declared: { tps: 5, tvq: 9.98 },
    });
    expect(r.montantHt).toBe(100);
  });
});

describe("l'addition retombe toujours juste", () => {
  it.each([
    ["QC", QC, 114.98],
    ["ON", ON, 113],
    ["QC petit montant", QC, 1.15],
    ["QC montant tordu", QC, 987.65],
    // Relevé en vérifiant la reprise sur la vraie base : base arrondie 203,50 puis
    // taxe recalculée dessus donnait 229,96 pour un montant payé de 229,95.
    ["ON cas du cent fantôme", ON, 229.95],
  ])("%s : HT + taxes === TTC au centime", (_label, config, ttc) => {
    const r = decomposeExpenseTax({ montantTtc: ttc, categoryCode: "LOGICIELS", taxConfig: config });
    const somme = Math.round((r.montantHt + r.tps + r.tvq) * 100) / 100;
    expect(somme).toBe(r.montantTtc);
  });

  it("balayage : aucun montant ne fabrique ni ne perd un cent", () => {
    // Un cas isolé prouve peu sur un arrondi. On balaie deux régimes sur toute la
    // plage des centimes, parce que le défaut est apparu sur un montant que quatre
    // cas choisis à la main n'avaient pas attrapé.
    const ecarts: string[] = [];
    for (const [nom, config] of [["QC", QC], ["ON", ON]] as const) {
      for (let cents = 1; cents <= 5000; cents++) {
        const ttc = Math.round(cents * 7.3) / 100;
        const r = decomposeExpenseTax({ montantTtc: ttc, categoryCode: "LOGICIELS", taxConfig: config });
        const somme = Math.round((r.montantHt + r.tps + r.tvq) * 100) / 100;
        if (somme !== r.montantTtc) ecarts.push(`${nom} ${ttc} -> ${somme}`);
      }
    }
    expect(ecarts.slice(0, 5)).toEqual([]);
  });

  it("en régime harmonisé, la TVH vit dans la colonne tps", () => {
    // Invariant du projet : tps + tvq === taxe totale, l'affichage ré-étiquette.
    const r = decomposeExpenseTax({ montantTtc: 113, categoryCode: "LOGICIELS", taxConfig: ON });
    expect(r.tps).toBeCloseTo(13, 2);
    expect(r.tvq).toBe(0);
  });
});

describe("cas limites", () => {
  it("un montant nul ne déclenche aucune division", () => {
    const r = decomposeExpenseTax({ montantTtc: 0, categoryCode: "LOGICIELS", taxConfig: QC });
    expect(r.origine).toBe("AUCUNE");
    expect(r.montantHt).toBe(0);
  });

  it("un cabinet sans régime de taxes ne reçoit aucune estimation", () => {
    const r = decomposeExpenseTax({
      montantTtc: 100,
      categoryCode: "LOGICIELS",
      taxConfig: { province: "QC", mode: "none", rates: {} },
    });
    expect(r.origine).toBe("AUCUNE");
    expect(r.motif).toBeTruthy();
  });

  it("une catégorie inconnue suit le régime général", () => {
    const r = decomposeExpenseTax({ montantTtc: 114.98, categoryCode: "INCONNUE", taxConfig: QC });
    expect(r.origine).toBe("ESTIMEE");
  });
});

describe("taxeReclamable", () => {
  it("sépare le réclamable de l'estimé au lieu de tout additionner", () => {
    // Additionner sans filtrer gonflerait la demande de remboursement avec des
    // montants qui ne se justifient pas en vérification.
    const r = taxeReclamable([
      { tps: 5, tvq: 9.98, origine: "DECLAREE" },
      { tps: 10, tvq: 19.95, origine: "ESTIMEE" },
      { tps: 0, tvq: 0, origine: "AUCUNE" },
    ]);
    expect(r.reclamable).toBe(14.98);
    expect(r.estimee).toBe(29.95);
  });

  it("un lot vide ne casse pas", () => {
    expect(taxeReclamable([])).toEqual({ reclamable: 0, estimee: 0 });
  });
});

describe("les deux issues de la modale de confirmation", () => {
  // L'écran ne pose qu'une question, « que montre votre pièce ? », et n'a donc que
  // deux réponses possibles. Ces tests couvrent ce que chaque bouton déclenche.

  it("« elle montre un montant » rend la dépense réclamable", () => {
    const r = decomposeExpenseTax({
      montantTtc: 114.98,
      categoryCode: "FOURNITURES",
      taxConfig: QC,
      declared: { tps: 5, tvq: 9.98 },
    });
    expect(r.origine).toBe("DECLAREE");
    expect(r.reclamable).toBe(true);
  });

  it("« elle ne porte aucune taxe » ferme la ligne au lieu de la réestimer", () => {
    // Sans ce signal, répondre « aucune taxe » relancerait l'estimation et la ligne
    // reviendrait indéfiniment dans la liste à confirmer. Elle ne se viderait jamais.
    const r = decomposeExpenseTax({
      montantTtc: 114.98,
      categoryCode: "FOURNITURES",
      taxConfig: QC,
      declaredSansTaxe: true,
    });
    expect(r.origine).toBe("AUCUNE");
    expect(r.tps + r.tvq).toBe(0);
    expect(r.montantHt).toBe(114.98);
    expect(r.motif).toBeTruthy();
  });

  it("une ligne confirmée ne revient pas dans la liste au passage suivant", () => {
    // La liste filtre sur ESTIMEE. Les deux réponses doivent en sortir.
    for (const r of [
      decomposeExpenseTax({ montantTtc: 100, categoryCode: "FOURNITURES", taxConfig: QC, declared: { tps: 4.35, tvq: 8.68 } }),
      decomposeExpenseTax({ montantTtc: 100, categoryCode: "FOURNITURES", taxConfig: QC, declaredSansTaxe: true }),
    ]) {
      expect(r.origine).not.toBe("ESTIMEE");
    }
  });
});
