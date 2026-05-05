import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getStripe, subscriptionIdFromInvoice } from "@/lib/stripe";
import {
  applyDeletedSubscription,
  applySubscriptionToCabinet,
  recordStripeEvent,
  retrieveSubscription,
} from "@/lib/services/stripe-subscription";
import { prisma } from "@/lib/db";

function logIfNoCabinetUpdated(event: Stripe.Event, operation: string, count: number) {
  if (count === 0) {
    console.error(`[stripe] ${operation} updated 0 Cabinet rows for event ${event.id}`);
  }
}

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

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

  const shouldProcess = await recordStripeEvent(event);
  if (!shouldProcess) {
    return NextResponse.json({ received: true, duplicate: true });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode === "subscription" && session.subscription && session.customer) {
          const subscription = await retrieveSubscription(session.subscription as string);
          const count = await applySubscriptionToCabinet({
            cabinetId: session.metadata?.cabinetId ?? null,
            customerId: session.customer as string,
            subscription,
          });
          logIfNoCabinetUpdated(event, "checkout.session.completed", count);
        }
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const count = await applySubscriptionToCabinet({
          cabinetId: subscription.metadata?.cabinetId ?? null,
          customerId: subscription.customer as string,
          subscription,
        });
        logIfNoCabinetUpdated(event, event.type, count);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const count = await applyDeletedSubscription(subscription);
        logIfNoCabinetUpdated(event, "customer.subscription.deleted", count);
        break;
      }

      case "invoice.payment_succeeded":
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const subId = subscriptionIdFromInvoice(invoice);
        if (subId && invoice.customer) {
          const subscription = await retrieveSubscription(subId);
          const count = await applySubscriptionToCabinet({
            customerId: invoice.customer as string,
            subscription,
          });
          logIfNoCabinetUpdated(event, event.type, count);
        }
        break;
      }

      default:
        break;
    }
  } catch (err) {
    await prisma.stripeWebhookEvent.delete({ where: { id: event.id } }).catch(() => undefined);
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error(`Webhook handler error: ${message}`);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
