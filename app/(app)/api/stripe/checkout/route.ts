import { NextRequest, NextResponse } from "next/server";
import { getStripe, PLANS, PlanKey, appBaseUrl, stripePriceIdForPlan } from "@/lib/stripe";
import { prisma } from "@/lib/db";
import { requireCabinetAndUser } from "@/lib/auth/session";
import { canManageCabinetSettings } from "@/lib/auth/permissions";
import type { UserRole } from "@prisma/client";

export async function POST(req: NextRequest) {
  try {
    let sessionData: { cabinetId: string; userId: string; role: string };
    try {
      sessionData = await requireCabinetAndUser();
    } catch {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }
    const { cabinetId, userId, role } = sessionData;
    if (!canManageCabinetSettings(role as UserRole)) {
      return NextResponse.json({ error: "Droits insuffisants" }, { status: 403 });
    }

    const { plan } = (await req.json()) as { plan: PlanKey };
    if (!PLANS[plan]) {
      return NextResponse.json({ error: "Plan invalide" }, { status: 400 });
    }

    const cabinet = await prisma.cabinet.findUnique({
      where: { id: cabinetId },
    });
    if (!cabinet) {
      return NextResponse.json({ error: "Cabinet non trouvé" }, { status: 404 });
    }

    // Créer ou récupérer le client Stripe
    let customerId = cabinet.stripeCustomerId;
    if (!customerId) {
      const customer = await getStripe().customers.create({
        metadata: { cabinetId: cabinet.id, userId },
        name: cabinet.nom,
        email: cabinet.email ?? undefined,
      });
      customerId = customer.id;
      await prisma.cabinet.update({
        where: { id: cabinet.id },
        data: { stripeCustomerId: customerId },
      });
    }

    const priceId = stripePriceIdForPlan(plan);
    const lineItem = priceId
      ? { price: priceId, quantity: 1 }
      : {
          price_data: {
            currency: PLANS[plan].currency,
            product_data: { name: `SAFE — ${PLANS[plan].name}` },
            unit_amount: PLANS[plan].price,
            recurring: { interval: PLANS[plan].interval },
          },
          quantity: 1,
        };
    const baseUrl = appBaseUrl();

    const checkoutSession = await getStripe().checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [lineItem],
      metadata: { cabinetId: cabinet.id, userId, plan },
      subscription_data: {
        metadata: { cabinetId: cabinet.id, userId, plan },
      },
      success_url: `${baseUrl}/parametres/abonnement?stripe=success`,
      cancel_url: `${baseUrl}/parametres/abonnement?stripe=cancel`,
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
