import type { BillingStatus } from "@prisma/client";

const LOCKED_BILLING_STATUSES = new Set<BillingStatus>([
  "IN_DRAFT_INVOICE",
  "BILLED",
  "WRITTEN_OFF",
  "CANCELLED",
]);

function roundCurrency(value: number): number {
  return Math.round(value * 100) / 100;
}

export function isTimeEntryBillingLocked(status: BillingStatus | null | undefined): boolean {
  return status != null && LOCKED_BILLING_STATUSES.has(status);
}

export function resolveEditableTimeEntryBillingFields(input: {
  facturable: boolean;
  montant: number;
  currentBillingStatus?: BillingStatus | null;
}): { feeAmount?: number | null; billingStatus?: BillingStatus } {
  if (isTimeEntryBillingLocked(input.currentBillingStatus)) {
    return {};
  }

  if (!input.facturable) {
    return {
      feeAmount: null,
      billingStatus: "NON_BILLABLE",
    };
  }

  return {
    feeAmount: roundCurrency(input.montant),
    billingStatus: "READY_TO_BILL",
  };
}
