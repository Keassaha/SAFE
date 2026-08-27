import { describe, it, expect } from "vitest";
import { estUneChargeEnAttente, getDaysOverdue } from "../interest-service";

/**
 * B-03 — `createOrUpdateInterestCharge` ne contenait qu'un `create`.
 *
 * Appelée deux fois sur la même facture, elle empilait deux charges au lieu
 * d'en corriger une. Cette règle décide laquelle des deux conduites tenir.
 */
describe("charge d'intérêt en attente", () => {
  it("rafraîchit une charge calculée que rien n'a encore facturée", () => {
    expect(estUneChargeEnAttente({ status: "calculated", invoiceLineId: null })).toBe(true);
  });

  /* Une charge portée par une ligne a été facturée à un client. La réécrire
     changerait un document déjà remis. */
  it("ne touche pas une charge déjà portée par une ligne de facture", () => {
    expect(estUneChargeEnAttente({ status: "calculated", invoiceLineId: "line_1" })).toBe(false);
  });

  it("ne touche pas une charge dont le statut a changé", () => {
    for (const status of ["billed", "cancelled", "waived", ""]) {
      expect(estUneChargeEnAttente({ status, invoiceLineId: null })).toBe(false);
    }
  });
});

describe("jours de retard", () => {
  const echeance = new Date("2026-08-01T12:00:00Z");

  it("ne compte aucun retard avant l'échéance ni le jour même", () => {
    expect(getDaysOverdue(echeance, new Date("2026-07-31T12:00:00Z"))).toBe(0);
    expect(getDaysOverdue(echeance, echeance)).toBe(0);
  });

  it("compte les jours entiers écoulés depuis l'échéance", () => {
    expect(getDaysOverdue(echeance, new Date("2026-08-24T12:00:00Z"))).toBe(23);
  });
});
