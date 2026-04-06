import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { stripe, PLANS, PlanKey } from "@/lib/stripe";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.cabinetId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { plan } = (await req.json()) as { plan: PlanKey };
    if (!PLANS[plan]) {
      return NextResponse.json({ error: "Plan invalide" }, { status: 400 });
    }

    const cabinet = await prisma.cabinet.findUnique({
      where: { id: session.user.cabinetId },
    });
    if (!cabinet) {
      return NextResponse.json({ error: "Cabinet non trouvé" }, { status: 404 });
    }

    // Créer ou récupérer le client Stripe
    let customerId = cabinet.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        metadata: { cabinetId: cabinet.id },
        name: cabinet.nom,
      });
      customerId = customer.id;
      await prisma.cabinet.update({
        where: { id: cabinet.id },
        data: { stripeCustomerId: customerId },
      });
    }

    // Créer la session de checkout
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: PLANS[plan].currency,
            product_data: { name: `SAFE — ${PLANS[plan].name}` },
            unit_amount: PLANS[plan].price,
            recurring: { interval: PLANS[plan].interval },
          },
          quantity: 1,
        },
      ],
      metadata: { cabinetId: cabinet.id, plan },
      success_url: `${process.env.NEXTAUTH_URL}/parametres?stripe=success`,
      cancel_url: `${process.env.NEXTAUTH_URL}/parametres?stripe=cancel`,
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    console.error("Stripe checkout error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création du paiement" },
      { status: 500 }
    );
  }
}
