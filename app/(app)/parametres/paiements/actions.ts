"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import type { UserRole } from "@prisma/client";
import { requireCabinetAndUser } from "@/lib/auth/session";
import { canManageCabinetSettings } from "@/lib/auth/permissions";
import { ONLINE_PAYMENTS_ENABLED } from "@/lib/payments/eligibility";
import { startConnectOnboarding, syncConnectStatus } from "@/lib/services/stripe/connect-service";

async function baseUrl(): Promise<string> {
  if (process.env.NEXTAUTH_URL) return process.env.NEXTAUTH_URL.replace(/\/$/, "");
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3001";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

/** Démarre/reprend l'onboarding Connect puis redirige vers Stripe. */
export async function startConnectOnboardingAction(): Promise<void> {
  const { cabinetId, role } = await requireCabinetAndUser();
  if (!ONLINE_PAYMENTS_ENABLED || !canManageCabinetSettings(role as UserRole)) {
    redirect("/parametres");
  }
  let url: string;
  try {
    ({ url } = await startConnectOnboarding({ cabinetId, baseUrl: await baseUrl() }));
  } catch (err) {
    // Ex. Connect pas activé sur le compte plateforme. On revient avec un message
    // plutôt que de crasher. (Le redirect de succès reste HORS du try/catch pour
    // ne pas avaler le NEXT_REDIRECT.)
    console.error("[connect] onboarding failed:", err);
    redirect("/parametres/paiements?connect=error");
  }
  redirect(url);
}

/** Synchronise le statut du compte connecté depuis Stripe. */
export async function refreshConnectStatusAction(): Promise<void> {
  const { cabinetId, role } = await requireCabinetAndUser();
  if (!ONLINE_PAYMENTS_ENABLED || !canManageCabinetSettings(role as UserRole)) {
    redirect("/parametres");
  }
  await syncConnectStatus(cabinetId);
  redirect("/parametres/paiements");
}
