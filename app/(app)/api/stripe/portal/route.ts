import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/db";

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.cabinetId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const cabinet = await prisma.cabinet.findUnique({
      where: { id: session.user.cabinetId },
    });

    if (!cabinet?.stripeCustomerId) {
      return NextResponse.json(
        { error: "Aucun abonnement actif" },
        { status: 400 }
      );
    }

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: cabinet.stripeCustomerId,
      return_url: `${process.env.NEXTAUTH_URL}/parametres`,
    });

    return NextResponse.json({ url: portalSession.url });
  } catch (error) {
    console.error("Stripe portal error:", error);
    return NextResponse.json({ error: "Erreur" }, { status: 500 });
  }
}
