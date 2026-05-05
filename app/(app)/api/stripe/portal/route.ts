import { NextResponse } from "next/server";
import { getStripe, appBaseUrl } from "@/lib/stripe";
import { prisma } from "@/lib/db";
import { requireCabinetAndUser } from "@/lib/auth/session";

export async function POST() {
  try {
    let sessionData: { cabinetId: string };
    try {
      sessionData = await requireCabinetAndUser();
    } catch {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const cabinet = await prisma.cabinet.findUnique({
      where: { id: sessionData.cabinetId },
    });

    if (!cabinet?.stripeCustomerId) {
      return NextResponse.json(
        { error: "Aucun abonnement actif" },
        { status: 400 }
      );
    }

    const portalSession = await getStripe().billingPortal.sessions.create({
      customer: cabinet.stripeCustomerId,
      return_url: `${appBaseUrl()}/parametres/abonnement`,
    });

    return NextResponse.json({ url: portalSession.url });
  } catch (error) {
    console.error("Stripe portal error:", error);
    return NextResponse.json({ error: "Erreur" }, { status: 500 });
  }
}
