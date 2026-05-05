import Stripe from "stripe";
import { prisma } from "@/lib/db";
import {
  getStripe,
  planFromStripePriceId,
  subscriptionCurrentPeriodEndUnix,
  type PlanKey,
} from "@/lib/stripe";

export function stripeDateFromUnix(value: number | null | undefined): Date | null {
  return typeof value === "number" ? new Date(value * 1000) : null;
}

export function planFromSubscription(subscription: Stripe.Subscription): PlanKey | null {
  const metadataPlan = subscription.metadata?.plan;
  if (metadataPlan === "essentiel" || metadataPlan === "professionnel" || metadataPlan === "cabinet") {
    return metadataPlan;
  }
  return planFromStripePriceId(subscription.items.data[0]?.price.id);
}

export async function recordStripeEvent(event: Stripe.Event): Promise<boolean> {
  try {
    await prisma.stripeWebhookEvent.create({
      data: {
        id: event.id,
        type: event.type,
        cabinetId: cabinetIdFromEvent(event),
      },
    });
    return true;
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "P2002") {
      return false;
    }
    throw error;
  }
}

export async function applySubscriptionToCabinet(params: {
  cabinetId?: string | null;
  customerId: string;
  subscription: Stripe.Subscription;
}): Promise<number> {
  const { cabinetId, customerId, subscription } = params;
  const periodEnd = subscriptionCurrentPeriodEndUnix(subscription);
  const trialEnd = typeof subscription.trial_end === "number" ? subscription.trial_end : null;
  const plan = planFromSubscription(subscription);

  const result = await prisma.cabinet.updateMany({
    where: cabinetId ? { id: cabinetId } : { stripeCustomerId: customerId },
    data: {
      ...(plan ? { plan } : {}),
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscription.id,
      stripeSubscriptionStatus: subscription.status,
      stripePriceId: subscription.items.data[0]?.price.id ?? null,
      stripeCurrentPeriodEnd: stripeDateFromUnix(periodEnd),
      stripeCancelAtPeriodEnd: subscription.cancel_at_period_end ?? false,
      stripeTrialEnd: stripeDateFromUnix(trialEnd),
    },
  });

  return result.count;
}

export async function applyDeletedSubscription(subscription: Stripe.Subscription): Promise<number> {
  const result = await prisma.cabinet.updateMany({
    where: { stripeSubscriptionId: subscription.id },
    data: {
      stripeSubscriptionStatus: subscription.status,
      stripeSubscriptionId: null,
      stripePriceId: null,
      stripeCurrentPeriodEnd: null,
      stripeCancelAtPeriodEnd: false,
      stripeTrialEnd: null,
    },
  });
  return result.count;
}

export async function retrieveSubscription(id: string): Promise<Stripe.Subscription> {
  return getStripe().subscriptions.retrieve(id);
}

function cabinetIdFromEvent(event: Stripe.Event): string | null {
  const object = event.data.object as {
    metadata?: { cabinetId?: string | null } | null;
  };
  return object.metadata?.cabinetId ?? null;
}
