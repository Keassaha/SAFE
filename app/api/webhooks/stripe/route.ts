import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import {
  getStripe,
  subscriptionCurrentPeriodEndUnix,
  subscriptionIdFromInvoice,
} from "@/lib/stripe";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  const body = await req.text();
  const headersList = await headers();
  const signature = headersList.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("STRIPE_WEBHOOK_SECRET is not set");
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 });
  }

  let event: Stripe.Event;

  try {
    event = getStripe().webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error(`Webhook signature verification failed: ${message}`);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode === "subscription" && session.subscription && session.customer) {
          const subscription = await getStripe().subscriptions.retrieve(
            session.subscription as string
          );
          const periodEnd = subscriptionCurrentPeriodEndUnix(subscription);
          await prisma.cabinet.update({
            where: { stripeCustomerId: session.customer as string },
            data: {
              stripeSubscriptionId: subscription.id,
              stripePriceId: subscription.items.data[0]?.price.id ?? null,
              stripeCurrentPeriodEnd:
                periodEnd != null ? new Date(periodEnd * 1000) : null,
            },
          });
        }
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        const subId = subscriptionIdFromInvoice(invoice);
        if (subId && invoice.customer) {
          const subscription = await getStripe().subscriptions.retrieve(subId);
          const periodEndInv = subscriptionCurrentPeriodEndUnix(subscription);
          await prisma.cabinet.update({
            where: { stripeCustomerId: invoice.customer as string },
            data: {
              stripePriceId: subscription.items.data[0]?.price.id ?? null,
              stripeCurrentPeriodEnd:
                periodEndInv != null ? new Date(periodEndInv * 1000) : null,
            },
          });
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const periodEndUpd = subscriptionCurrentPeriodEndUnix(subscription);
        await prisma.cabinet.update({
          where: { stripeCustomerId: subscription.customer as string },
          data: {
            stripeSubscriptionId: subscription.id,
            stripePriceId: subscription.items.data[0]?.price.id ?? null,
            stripeCurrentPeriodEnd:
              periodEndUpd != null ? new Date(periodEndUpd * 1000) : null,
          },
        });
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await prisma.cabinet.update({
          where: { stripeCustomerId: subscription.customer as string },
          data: {
            plan: "essentiel",
            stripeSubscriptionId: null,
            stripePriceId: null,
            stripeCurrentPeriodEnd: null,
          },
        });
        break;
      }

      default:
        // Événement non géré — on retourne 200 quand même
        break;
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error(`Webhook handler error: ${message}`);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
