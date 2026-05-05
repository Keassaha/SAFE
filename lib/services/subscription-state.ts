import { prisma } from "@/lib/db";
import type { PlanKey } from "@/lib/stripe";

export const ACTIVE_STRIPE_STATUSES = ["active", "trialing"] as const;

export interface CabinetSubscriptionState {
  active: boolean;
  status: string | null;
  plan: PlanKey | string;
  isTrialing: boolean;
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
  trialEnd: Date | null;
  reason: string | null;
}

export function deriveCabinetSubscriptionState(input: {
  plan: string | null;
  stripeSubscriptionStatus?: string | null;
  stripeCurrentPeriodEnd?: Date | null;
  stripeCancelAtPeriodEnd?: boolean | null;
  stripeTrialEnd?: Date | null;
}): CabinetSubscriptionState {
  const status = input.stripeSubscriptionStatus ?? null;
  const isTrialing = status === "trialing";
  const active = status === "active" || status === "trialing";

  return {
    active,
    status,
    plan: input.plan ?? "essentiel",
    isTrialing,
    currentPeriodEnd: input.stripeCurrentPeriodEnd ?? null,
    cancelAtPeriodEnd: input.stripeCancelAtPeriodEnd ?? false,
    trialEnd: input.stripeTrialEnd ?? null,
    reason: active ? null : inactiveReason(status),
  };
}

export async function getCabinetSubscriptionState(
  cabinetId: string,
): Promise<CabinetSubscriptionState> {
  const cabinet = await prisma.cabinet.findUnique({
    where: { id: cabinetId },
    select: {
      plan: true,
      stripeSubscriptionStatus: true,
      stripeCurrentPeriodEnd: true,
      stripeCancelAtPeriodEnd: true,
      stripeTrialEnd: true,
    },
  });

  if (!cabinet) {
    return {
      active: false,
      status: null,
      plan: "essentiel",
      isTrialing: false,
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
      trialEnd: null,
      reason: "cabinet_not_found",
    };
  }

  return deriveCabinetSubscriptionState(cabinet);
}

function inactiveReason(status: string | null): string {
  switch (status) {
    case "past_due":
      return "past_due";
    case "canceled":
      return "canceled";
    case "unpaid":
      return "unpaid";
    case "incomplete":
    case "incomplete_expired":
      return status;
    default:
      return "no_active_subscription";
  }
}
