import { describe, expect, it } from "vitest";
import {
  presentInvoice,
  type PresenterInput,
} from "@/lib/services/billing/invoice-presenter";

/**
 * CONTRAT D'ÉQUIVALENCE FACTURE (blocqueur commercial n°1).
 *
 * Les trois surfaces de rendu d'une facture — l'aperçu écran, le PDF officiel
 * (lib/invoice-template/InvoiceDocument) et le portail client public — consomment
 * TOUTES le même projecteur `presentInvoice()` et affichent `presented.totals`.
 * Elles ne peuvent donc pas diverger tant que ces deux invariants tiennent :
 *
 *   1. `presentInvoice` est un PROJECTEUR FIDÈLE : il ne recalcule pas les totaux,
 *      il ré-expose les valeurs persistées (montantTotal, taxes, solde) sans dérive.
 *   2. `presentInvoice` est DÉTERMINISTE : même entrée → même sortie.
 *
 * Ces tests verrouillent ces invariants. Une régression qui ferait recalculer un
 * total (ou diverger un montant selon le contexte d'appel) casserait ici, avant de
 * pouvoir montrer 15 000 $ à l'écran et envoyer 12 500 $ en PDF.
 */

/** Construit une entrée presenter minimale mais valide (champs réellement lus). */
function makeInvoice(overrides: Partial<Record<string, unknown>> = {}): PresenterInput {
  const base = {
    id: "inv_1",
    numero: "2026-0001",
    dateEmission: new Date("2026-03-01T00:00:00Z"),
    dateEcheance: new Date("2026-03-31T00:00:00Z"),
    statut: "envoyee",
    invoiceStatus: "ISSUED",
    currency: "CAD",
    // Totaux persistés (source de vérité, calculés par recalculateInvoiceTotals).
    subtotalTaxable: 1000,
    tps: 50,
    tvq: 99.75,
    deboursNonTaxableTotal: 200,
    montantTotal: 1349.75,
    montantPaye: 349.75,
    balanceDue: 1000,
    clientNote: null,
    cabinet: {
      id: "cab_1",
      nom: "Cabinet Test",
      adresse: null,
      telephone: null,
      email: null,
      barreauNumero: null,
      logoUrl: null,
      config: null,
    },
    client: {
      id: "cli_1",
      raisonSociale: "Client Démo",
      prenom: null,
      nom: null,
      typeClient: "personne_morale",
      email: null,
      billingAddress: null,
      billingCity: null,
      billingProvince: null,
      billingPostalCode: null,
      billingCountry: null,
    },
    dossier: {
      id: "dos_1",
      intitule: "Dossier démo",
      numeroDossier: "RE-00001",
      modeFacturation: "horaire",
    },
    invoiceLines: [
      {
        id: "l1",
        lineType: "fee",
        description: "Honoraires",
        quantite: 5,
        tauxUnitaire: 200,
        montant: 1000,
        lineSubtotal: 1000,
        taxable: true,
        sortOrder: 0,
        serviceDate: new Date("2026-02-15T00:00:00Z"),
        createdAt: new Date("2026-02-15T00:00:00Z"),
        parentLineId: null,
        discountReason: null,
      },
      {
        id: "l2",
        lineType: "expense",
        description: "Frais gouvernementaux",
        quantite: 1,
        tauxUnitaire: 200,
        montant: 200,
        lineSubtotal: 200,
        taxable: false,
        sortOrder: 1,
        serviceDate: new Date("2026-02-20T00:00:00Z"),
        createdAt: new Date("2026-02-20T00:00:00Z"),
        parentLineId: null,
        discountReason: null,
      },
    ],
    invoiceItems: [],
    ...overrides,
  };
  return base as unknown as PresenterInput;
}

describe("Contrat d'équivalence facture — presenter fidèle et déterministe", () => {
  it("ré-expose les totaux persistés SANS les recalculer (projecteur fidèle)", () => {
    const inv = makeInvoice();
    const p = presentInvoice(inv);
    expect(p.totals.montantTotal).toBe(1349.75);
    expect(p.totals.subtotalTaxable).toBe(1000);
    expect(p.totals.montantPaye).toBe(349.75);
    expect(p.totals.balanceDue).toBe(1000);
    expect(p.totals.deboursNonTaxableTotal).toBe(200);
  });

  it("est déterministe : même entrée → même sortie (écran = PDF = portail)", () => {
    const inv = makeInvoice();
    expect(presentInvoice(inv)).toEqual(presentInvoice(inv));
  });

  it("ne perd ni n'ajoute de taxe : tps+tvq+hst affichés = tps+tvq persistés", () => {
    const inv = makeInvoice();
    const p = presentInvoice(inv);
    const affiche = p.totals.tps + p.totals.tvq + p.totals.hst;
    expect(affiche).toBeCloseTo(50 + 99.75, 2);
    expect(p.totals.taxRegime).toBe("GST_QST");
  });

  it("mode TVH : la taxe est ré-étiquetée en HST sans changer la somme", () => {
    // En mode HST, la TVH est persistée dans `tps` et `tvq=0` (Option A).
    const inv = makeInvoice({ tps: 130, tvq: 0, subtotalTaxable: 1000, deboursNonTaxableTotal: 0, montantTotal: 1130, montantPaye: 0, balanceDue: 1130 });
    const p = presentInvoice(inv, { mode: "hst" } as never);
    expect(p.totals.taxRegime).toBe("HST");
    expect(p.totals.hst).toBeCloseTo(130, 2);
    expect(p.totals.tps + p.totals.tvq + p.totals.hst).toBeCloseTo(130, 2);
  });

  it("respecte l'identité comptable : total = base + taxes + débours non taxables", () => {
    const p = presentInvoice(makeInvoice());
    const reconstruit =
      p.totals.subtotalTaxable +
      p.totals.tps +
      p.totals.tvq +
      p.totals.hst +
      p.totals.deboursNonTaxableTotal;
    expect(reconstruit).toBeCloseTo(p.totals.montantTotal, 2);
  });

  it("respecte l'identité du solde : solde = total - payé", () => {
    const p = presentInvoice(makeInvoice());
    expect(p.totals.balanceDue).toBeCloseTo(p.totals.montantTotal - p.totals.montantPaye, 2);
  });

  it("un solde persisté incohérent est ré-exposé tel quel (le presenter n'invente pas)", () => {
    // Garantit qu'on ne masque pas une donnée fausse : la source de vérité reste
    // la valeur persistée, détectable en amont, jamais « corrigée » en douce ici.
    const p = presentInvoice(makeInvoice({ balanceDue: 42 }));
    expect(p.totals.balanceDue).toBe(42);
  });
});
