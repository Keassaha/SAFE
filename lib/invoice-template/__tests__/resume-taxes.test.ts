/**
 * Les taxes sur la facture du cabinet.
 *
 * DÉFAUT RÉEL, RELEVÉ LE 2026-08-18 EN RENDANT UNE VRAIE FACTURE
 *
 * Le calcul additionnait `tps + tvq` et oubliait `hst`. Le projet stocke la TVH dans
 * la colonne `tps` (invariant de lib/billing/taxes.ts), mais le presenter la
 * ré-étiquette avant l'affichage : pour un cabinet en TVH, il rend tps = 0, tvq = 0
 * et hst = le montant.
 *
 * Sur les factures d'un cabinet ONTARIEN, la somme valait donc zéro. Deux effets,
 * tous deux visibles par le client :
 *   - la ligne de TVH disparaissait, étant conditionnée à `taxTotal > 0` ;
 *   - le « Sous-total » affichait le total TAXES COMPRISES.
 *
 * Une facture d'inscrit qui ne montre aucune taxe est indéfendable.
 */

import { describe, it, expect } from "vitest";
import { resumeTaxes } from "../DerisierInvoiceDocument";

describe("un cabinet en TVH", () => {
  it("montre sa taxe au lieu de la faire disparaître", () => {
    // Forme exacte de ce que le presenter rend pour l'Ontario.
    const r = resumeTaxes({ tps: 0, tvq: 0, hst: 289.25, montantTotal: 2514.25 });
    expect(r.taxTotal).toBe(289.25);
    expect(r.subtotalPreTax).toBe(2225);
  });

  it("la ligne de taxe passe le seuil d'affichage", () => {
    // Le gabarit conditionne le rendu à `taxTotal > 0`. C'est ce seuil qui faisait
    // disparaître la ligne entière.
    expect(resumeTaxes({ tps: 0, tvq: 0, hst: 289.25, montantTotal: 2514.25 }).taxTotal)
      .toBeGreaterThan(0);
  });
});

describe("un cabinet en TPS/TVQ", () => {
  it("additionne les deux taxes", () => {
    const r = resumeTaxes({ tps: 100, tvq: 199.5, hst: 0, montantTotal: 2299.5 });
    expect(r.taxTotal).toBe(299.5);
    expect(r.subtotalPreTax).toBe(2000);
  });
});

describe("invariant", () => {
  it.each([
    [{ tps: 0, tvq: 0, hst: 289.25, montantTotal: 2514.25 }, 2225],
    [{ tps: 100, tvq: 199.5, hst: 0, montantTotal: 2299.5 }, 2000],
    [{ tps: 50, tvq: 0, hst: 0, montantTotal: 1050 }, 1000],
    [{ tps: 0, tvq: 0, hst: 0, montantTotal: 500 }, 500],
  ])("sous-total + taxes retombe toujours sur le total", (totals, attendu) => {
    const r = resumeTaxes(totals);
    expect(r.subtotalPreTax).toBe(attendu);
    expect(Math.round((r.subtotalPreTax + r.taxTotal) * 100) / 100).toBe(totals.montantTotal);
  });

  it("un cabinet non inscrit n'affiche aucune ligne de taxe", () => {
    // Sans inscription, il n'y a pas de taxe à montrer, et le sous-total EST le
    // total. C'est le seul cas où l'absence de ligne est correcte.
    const r = resumeTaxes({ tps: 0, tvq: 0, hst: 0, montantTotal: 500 });
    expect(r.taxTotal).toBe(0);
    expect(r.subtotalPreTax).toBe(500);
  });
});
