import { describe, it, expect } from "vitest";
import { grouperLignes, deboursEstTaxable } from "../groupes";
import type { PresentedLine } from "@/lib/services/billing/invoice-presenter";

const l = (p: Partial<PresentedLine> & { type: PresentedLine["type"]; amount: number }) =>
  ({ id: Math.random().toString(), description: "x", date: new Date("2026-08-19"), hours: null, rate: null, userNom: null, parentLineId: null, ...p }) as PresentedLine;

describe("grouperLignes — deux groupes, deux sous-totaux", () => {
  const lignes = [
    l({ type: "honoraires", amount: 570 }),
    l({ type: "honoraires", amount: 1282.5 }),
    l({ type: "debours_non_taxable", amount: 191 }),
    l({ type: "debours_taxable", amount: 150 }),
  ];

  it("sépare le travail des sommes avancées", () => {
    const g = grouperLignes(lignes);
    expect(g.honoraires).toHaveLength(2);
    expect(g.debours).toHaveLength(2);
  });

  it("totalise chaque groupe", () => {
    const g = grouperLignes(lignes);
    expect(g.sousTotaux.honoraires).toBe(1852.5);
    expect(g.sousTotaux.debours).toBe(341);
  });

  it("garde les deux natures de débours distinctes : elles ne se taxent pas pareil", () => {
    const g = grouperLignes(lignes);
    expect(g.sousTotaux.deboursTaxables).toBe(150);
    expect(g.sousTotaux.deboursNonTaxables).toBe(191);
  });

  it("l'assiette taxable exclut les débours non taxables", () => {
    // 1852,50 + 150 = 2002,50. Le greffe (191 $) n'y est pas.
    expect(grouperLignes(lignes).sousTotaux.baseTaxable).toBe(2002.5);
  });

  it("un rabais réduit l'assiette taxable", () => {
    const g = grouperLignes([...lignes, l({ type: "rabais", amount: -100 })]);
    expect(g.sousTotaux.rabais).toBe(100);
    expect(g.sousTotaux.baseTaxable).toBe(1902.5);
  });

  it("le rabais sort du tableau des honoraires : un montant négatif s'y raterait", () => {
    const g = grouperLignes([...lignes, l({ type: "rabais", amount: -100 })]);
    expect(g.honoraires).toHaveLength(2);
    expect(g.rabais).toHaveLength(1);
  });

  it("une facture vide ne casse rien et ne totalise rien", () => {
    const g = grouperLignes([]);
    expect(g.sousTotaux.baseTaxable).toBe(0);
    expect(g.honoraires).toEqual([]);
  });

  it("les centimes ne dérivent pas", () => {
    const g = grouperLignes([l({ type: "honoraires", amount: 0.1 }), l({ type: "honoraires", amount: 0.2 })]);
    expect(g.sousTotaux.honoraires).toBe(0.3);
  });

  it("un type inconnu est gardé plutôt que perdu", () => {
    const g = grouperLignes([l({ type: "interet" as PresentedLine["type"], amount: 12 })]);
    expect(g.autres).toHaveLength(1);
  });
});

describe("deboursEstTaxable", () => {
  it("dit Oui au taxable, Non à l'autre", () => {
    expect(deboursEstTaxable(l({ type: "debours_taxable", amount: 1 }))).toBe(true);
    expect(deboursEstTaxable(l({ type: "debours_non_taxable", amount: 1 }))).toBe(false);
  });
});

describe("grouperLignes — le forfait et l'horaire se séparent", () => {
  const forfait = (amount: number) =>
    l({ type: "honoraires", amount, basis: "forfait", quantite: 1, taux: amount });
  const horaire = (amount: number, h: number, taux: number) =>
    l({ type: "honoraires", amount, basis: "horaire", quantite: h, taux });

  it("dit « horaire » quand rien n'est au forfait", () => {
    const g = grouperLignes([horaire(750, 2.5, 300), horaire(1140, 3.8, 300)]);
    expect(g.modeHonoraires).toBe("horaire");
    expect(g.honorairesForfait).toHaveLength(0);
    expect(g.sousTotaux.honorairesHoraire).toBe(1890);
  });

  it("dit « forfait » quand rien n'est à l'heure", () => {
    const g = grouperLignes([forfait(850), forfait(1100)]);
    expect(g.modeHonoraires).toBe("forfait");
    expect(g.honorairesHoraire).toHaveLength(0);
    expect(g.sousTotaux.honorairesForfait).toBe(1950);
  });

  it("dit « mixte » quand les deux familles sont là, et totalise chacune", () => {
    const g = grouperLignes([forfait(850), horaire(750, 2.5, 300), forfait(200), horaire(1140, 3.8, 300)]);
    expect(g.modeHonoraires).toBe("mixte");
    expect(g.honorairesForfait).toHaveLength(2);
    expect(g.honorairesHoraire).toHaveLength(2);
    expect(g.sousTotaux.honorairesForfait).toBe(1050);
    expect(g.sousTotaux.honorairesHoraire).toBe(1890);
    // Les deux sous-totaux redonnent le total du groupe : c'est ce qui rend la
    // facture vérifiable par le client.
    expect(g.sousTotaux.honorairesForfait + g.sousTotaux.honorairesHoraire).toBe(
      g.sousTotaux.honoraires,
    );
  });

  it("range une ligne sans base déclarée du côté horaire plutôt que de la perdre", () => {
    const g = grouperLignes([l({ type: "honoraires", amount: 500 })]);
    expect(g.honorairesHoraire).toHaveLength(1);
    expect(g.modeHonoraires).toBe("horaire");
  });

  it("dit « aucun » sur une facture qui ne porte que des débours", () => {
    const g = grouperLignes([l({ type: "debours_non_taxable", amount: 191 })]);
    expect(g.modeHonoraires).toBe("aucun");
  });

  it("ne range ni un débours ni un rabais dans une famille d'honoraires", () => {
    const g = grouperLignes([forfait(850), l({ type: "debours_taxable", amount: 150 }), l({ type: "rabais", amount: -50 })]);
    expect(g.honorairesForfait).toHaveLength(1);
    expect(g.honorairesHoraire).toHaveLength(0);
    expect(g.sousTotaux.honorairesForfait).toBe(850);
  });
});
