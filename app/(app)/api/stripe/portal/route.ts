import { NextResponse } from "next/server";
import type { UserRole } from "@prisma/client";
import { getStripe, appBaseUrl } from "@/lib/stripe";
import { prisma } from "@/lib/db";
import { requireCabinetAndUser } from "@/lib/auth/session";
import { canManageCabinetSettings } from "@/lib/auth/permissions";

export async function POST() {
  try {
    let sessionData: { cabinetId: string; role: string };
    try {
      sessionData = await requireCabinetAndUser();
    } catch {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // P0 sécurité : le portail de facturation Stripe (changer la carte, annuler
    // l'abonnement) est une action de gestion du cabinet, réservée à l'admin.
    if (!canManageCabinetSettings(sessionData.role as UserRole)) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
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
