import { describe, expect, it } from "vitest";
import {
  getTimeEntryBillableAmount,
  getTimeEntryProducedAmount,
  classifyTimeEntryForBilling,
  isTimeEntryReadyForBilling,
  getRegistreTacheBillableAmount,
  recomputeRegistreTacheFinal,
  computeWipForDossier,
  computeRealizationRate,
  computeRecoveryRate,
  computeBillingRatios,
} from "@/lib/billing/wip";
import type {
  BillingTimeEntry,
  BillingRegistreTache,
  DossierBillingSnapshot,
} from "@/lib/billing/types";

function te(over: Partial<BillingTimeEntry> = {}): BillingTimeEntry {
  return {
    id: "te-1",
    montant: 500,
    feeAmount: null,
    facturable: true,
    isWrittenOff: false,
    billingStatus: "READY_TO_BILL",
    ...over,
  };
}

function rt(over: Partial<BillingRegistreTache> = {}): BillingRegistreTache {
  return {
    id: "rt-1",
    montantBase: 1500,
    ajustement: 0,
    rabais: 0,
    montantFinal: 1500,
    statut: "complete",
    taxable: true,
    invoiceLineId: null,
    ...over,
  };
}

describe("getTimeEntryBillableAmount — résolution feeAmount vs montant", () => {
  it("Préfère feeAmount quand défini (write-down implicite)", () => {
    expect(getTimeEntryBillableAmount(te({ montant: 500, feeAmount: 425 }))).toBe(425);
  });

  it("Retombe sur montant quand feeAmount est null", () => {
    expect(getTimeEntryBillableAmount(te({ montant: 500, feeAmount: null }))).toBe(500);
  });

  it("Retourne 0 si write-off", () => {
    expect(getTimeEntryBillableAmount(te({ isWrittenOff: true, montant: 500, feeAmount: 425 }))).toBe(0);
    expect(getTimeEntryBillableAmount(te({ billingStatus: "WRITTEN_OFF", montant: 500 }))).toBe(0);
  });

  it("Retourne 0 si non facturable ou NON_BILLABLE", () => {
    expect(getTimeEntryBillableAmount(te({ facturable: false }))).toBe(0);
    expect(getTimeEntryBillableAmount(te({ billingStatus: "NON_BILLABLE" }))).toBe(0);
  });

  it("Retourne 0 si CANCELLED", () => {
    expect(getTimeEntryBillableAmount(te({ billingStatus: "CANCELLED" }))).toBe(0);
  });

  it("Le brut produit ignore les write-offs (référence pour réalisation)", () => {
    expect(getTimeEntryProducedAmount(te({ montant: 500, isWrittenOff: true }))).toBe(500);
  });
});

describe("classifyTimeEntryForBilling", () => {
  it("write-off prime sur tout", () => {
    expect(classifyTimeEntryForBilling(te({ isWrittenOff: true }))).toBe("written_off");
  });

  it("BILLED → billed", () => {
    expect(classifyTimeEntryForBilling(te({ billingStatus: "BILLED" }))).toBe("billed");
  });

  it("IN_DRAFT_INVOICE → drafted", () => {
    expect(classifyTimeEntryForBilling(te({ billingStatus: "IN_DRAFT_INVOICE" }))).toBe("drafted");
  });

  it("READY_TO_BILL → billable", () => {
    expect(classifyTimeEntryForBilling(te({ billingStatus: "READY_TO_BILL" }))).toBe("billable");
  });

  it("NON_BILLED sans feeAmount → produced_only", () => {
    expect(classifyTimeEntryForBilling(te({ billingStatus: "NON_BILLED", feeAmount: null }))).toBe("produced_only");
  });

  it("NON_BILLED avec feeAmount défini → billable", () => {
    expect(classifyTimeEntryForBilling(te({ billingStatus: "NON_BILLED", feeAmount: 100 }))).toBe("billable");
  });

  it("isTimeEntryReadyForBilling cohérent avec classify", () => {
    expect(isTimeEntryReadyForBilling(te({ billingStatus: "READY_TO_BILL" }))).toBe(true);
    expect(isTimeEntryReadyForBilling(te({ billingStatus: "BILLED" }))).toBe(false);
  });
});

describe("RegistreTache — forfait", () => {
  it("Tâche statut=complete → montantFinal", () => {
    expect(getRegistreTacheBillableAmount(rt({ montantFinal: 1500, statut: "complete" }))).toBe(1500);
  });

  it("Tâche statut=facture → 0 (déjà facturée)", () => {
    expect(getRegistreTacheBillableAmount(rt({ montantFinal: 1500, statut: "facture" }))).toBe(0);
  });

  it("recompute défensif: base + ajustement - rabais", () => {
    expect(recomputeRegistreTacheFinal(rt({ montantBase: 1500, ajustement: 100, rabais: 50 }))).toBe(1550);
  });
});

describe("computeWipForDossier", () => {
  function snap(over: Partial<DossierBillingSnapshot> = {}): DossierBillingSnapshot {
    return {
      dossierId: "d1",
      cabinetId: "c1",
      timeEntries: [],
      registreTaches: [],
      unbilledDisbursements: [],
      ...over,
    };
  }

  it("Cas Derisier (forfait + débours): 1500 forfait + 250 débours", () => {
    const wip = computeWipForDossier(snap({
      registreTaches: [rt({ montantFinal: 1500, statut: "complete" })],
      unbilledDisbursements: [{ id: "d1", montant: 250, taxable: false }],
    }));
    expect(wip.forfaitValue).toBe(1500);
    expect(wip.disbursementsValue).toBe(250);
    expect(wip.hoursValue).toBe(0);
    expect(wip.total).toBe(1750);
  });

  it("Cas horaire (heures avec write-down)", () => {
    const wip = computeWipForDossier(snap({
      timeEntries: [
        te({ id: "t1", montant: 500, feeAmount: 425, billingStatus: "READY_TO_BILL" }),
        te({ id: "t2", montant: 300, feeAmount: null, billingStatus: "READY_TO_BILL" }),
        te({ id: "t3", montant: 200, billingStatus: "WRITTEN_OFF" }), // exclu
      ],
    }));
    expect(wip.hoursValue).toBe(725); // 425 + 300
    expect(wip.total).toBe(725);
  });

  it("Cas hybride forfait + horaire + débours", () => {
    const wip = computeWipForDossier(snap({
      timeEntries: [te({ montant: 800, billingStatus: "READY_TO_BILL" })],
      registreTaches: [rt({ montantFinal: 1500, statut: "complete" })],
      unbilledDisbursements: [{ id: "d1", montant: 100, taxable: true }],
    }));
    expect(wip.total).toBe(2400);
  });

  it("Snapshot vide → tout à 0", () => {
    const wip = computeWipForDossier(snap());
    expect(wip).toEqual({ hoursValue: 0, forfaitValue: 0, disbursementsValue: 0, total: 0 });
  });
});

describe("Ratios — réalisation et recouvrement", () => {
  it("Réalisation 100% si pas de write-down", () => {
    expect(computeRealizationRate(1000, 1000)).toBe(1);
  });

  it("Réalisation 85% (write-down 150 sur 1000)", () => {
    expect(computeRealizationRate(1000, 850)).toBe(0.85);
  });

  it("Réalisation 1 si rien produit (pas de référence)", () => {
    expect(computeRealizationRate(0, 0)).toBe(1);
  });

  it("Recouvrement 0 si rien facturé", () => {
    expect(computeRecoveryRate(0, 0)).toBe(0);
  });

  it("Recouvrement 75%", () => {
    expect(computeRecoveryRate(1000, 750)).toBe(0.75);
  });

  it("computeBillingRatios combine les deux", () => {
    const r = computeBillingRatios(1000, 850, 850, 700);
    expect(r.realization).toBe(0.85);
    expect(r.recovery).toBeCloseTo(0.824, 2);
  });

  it("Borne supérieure 1, jamais > 1", () => {
    expect(computeRecoveryRate(1000, 1500)).toBe(1);
  });
});
