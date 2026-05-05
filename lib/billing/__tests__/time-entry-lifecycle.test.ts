import { describe, expect, it } from "vitest";
import {
  isTimeEntryBillingLocked,
  resolveEditableTimeEntryBillingFields,
} from "@/lib/billing/time-entry-lifecycle";

describe("time-entry billing lifecycle", () => {
  it("active le panier facturable quand une fiche facturable a un montant", () => {
    expect(resolveEditableTimeEntryBillingFields({ facturable: true, montant: 312.345 })).toEqual({
      feeAmount: 312.35,
      billingStatus: "READY_TO_BILL",
    });
  });

  it("sort explicitement les fiches non facturables du panier", () => {
    expect(resolveEditableTimeEntryBillingFields({ facturable: false, montant: 312.35 })).toEqual({
      feeAmount: null,
      billingStatus: "NON_BILLABLE",
    });
  });

  it("ne réouvre pas une fiche déjà attachée à une facture", () => {
    expect(
      resolveEditableTimeEntryBillingFields({
        facturable: true,
        montant: 312.35,
        currentBillingStatus: "IN_DRAFT_INVOICE",
      }),
    ).toEqual({});
    expect(isTimeEntryBillingLocked("BILLED")).toBe(true);
  });
});
