import { NextRequest, NextResponse } from "next/server";
import {
  getStripe,
  subscriptionCurrentPeriodEndUnix,
  subscriptionIdFromInvoice,
} from "@/lib/stripe";
import { prisma } from "@/lib/db";
import Stripe from "stripe";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  // En mode test sans webhook secret, on accepte directement
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event: Stripe.Event;

  try {
    if (webhookSecret && sig) {
      event = getStripe().webhooks.constructEvent(body, sig, webhookSecret);
    } else {
      event = JSON.parse(body) as Stripe.Event;
    }
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const cabinetId = session.metadata?.cabinetId;
        const plan = session.metadata?.plan;
        if (!cabinetId || !plan) break;

        const subscription = await getStripe().subscriptions.retrieve(
          session.subscription as string
        );

        const periodEndCheckout = subscriptionCurrentPeriodEndUnix(subscription);
        await prisma.cabinet.update({
          where: { id: cabinetId },
          data: {
            plan,
            stripeCustomerId: session.customer as string,
            stripeSubscriptionId: subscription.id,
            stripePriceId: subscription.items.data[0].price.id,
            stripeCurrentPeriodEnd:
              periodEndCheckout != null
                ? new Date(periodEndCheckout * 1000)
                : null,
          },
        });
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        const subId = subscriptionIdFromInvoice(invoice);
        if (!subId) break;

        const subscription = await getStripe().subscriptions.retrieve(subId);

        const cabinet = await prisma.cabinet.findFirst({
          where: { stripeSubscriptionId: subscription.id },
        });
        if (!cabinet) break;

        const periodEndInvoice = subscriptionCurrentPeriodEndUnix(subscription);
        await prisma.cabinet.update({
          where: { id: cabinet.id },
          data: {
            stripeCurrentPeriodEnd:
              periodEndInvoice != null
                ? new Date(periodEndInvoice * 1000)
                : null,
          },
        });
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const cabinet = await prisma.cabinet.findFirst({
          where: { stripeSubscriptionId: subscription.id },
        });
        if (!cabinet) break;

        await prisma.cabinet.update({
          where: { id: cabinet.id },
          data: {
            plan: "essentiel",
            stripeSubscriptionId: null,
            stripePriceId: null,
            stripeCurrentPeriodEnd: null,
          },
        });
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook processing error:", error);
    return NextResponse.json(
      { error: "Erreur de traitement" },
      { status: 500 }
    );
  }
}
