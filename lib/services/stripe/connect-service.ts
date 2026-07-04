/**
 * Orchestration Stripe Connect côté cabinet (ADR-012, lot 2).
 * Fait le pont entre le service Stripe pur (`lib/stripe/connect`) et la base :
 * crée/retrouve le compte connecté du cabinet, génère le lien d'onboarding, et
 * synchronise le statut (`stripeConnectChargesEnabled`).
 */
import { prisma } from "@/lib/db";
import {
  createConnectAccount,
  createConnectOnboardingLink,
  getConnectAccountStatus,
  type ConnectAccountStatus,
} from "@/lib/stripe/connect";

export interface CabinetConnectState {
  accountId: string | null;
  chargesEnabled: boolean;
}

/** Lit l'état Connect persisté d'un cabinet. */
export async function getCabinetConnectState(cabinetId: string): Promise<CabinetConnectState> {
  const cabinet = await prisma.cabinet.findUnique({
    where: { id: cabinetId },
    select: { stripeConnectAccountId: true, stripeConnectChargesEnabled: true },
  });
  return {
    accountId: cabinet?.stripeConnectAccountId ?? null,
    chargesEnabled: Boolean(cabinet?.stripeConnectChargesEnabled),
  };
}

/**
 * Démarre (ou reprend) l'onboarding Connect : crée le compte Express si le cabinet
 * n'en a pas, puis renvoie un lien d'onboarding hébergé par Stripe. Idempotent sur
 * le compte (ne recrée jamais un compte existant).
 */
export async function startConnectOnboarding(params: {
  cabinetId: string;
  baseUrl: string;
}): Promise<{ url: string }> {
  const { cabinetId, baseUrl } = params;
  const cabinet = await prisma.cabinet.findUnique({
    where: { id: cabinetId },
    select: { stripeConnectAccountId: true, email: true },
  });
  if (!cabinet) throw new Error("Cabinet introuvable");

  let accountId = cabinet.stripeConnectAccountId;
  if (!accountId) {
    accountId = await createConnectAccount({ email: cabinet.email, country: "CA" });
    await prisma.cabinet.update({
      where: { id: cabinetId },
      data: { stripeConnectAccountId: accountId },
    });
  }

  const returnUrl = `${baseUrl}/parametres/paiements?connect=return`;
  const refreshUrl = `${baseUrl}/parametres/paiements?connect=refresh`;
  const url = await createConnectOnboardingLink({ accountId, refreshUrl, returnUrl });
  return { url };
}

/**
 * Synchronise le statut du compte connecté depuis Stripe vers la base. À appeler
 * au retour de l'onboarding. Renvoie null si le cabinet n'a pas encore de compte.
 */
export async function syncConnectStatus(cabinetId: string): Promise<ConnectAccountStatus | null> {
  const cabinet = await prisma.cabinet.findUnique({
    where: { id: cabinetId },
    select: { stripeConnectAccountId: true },
  });
  if (!cabinet?.stripeConnectAccountId) return null;

  const status = await getConnectAccountStatus(cabinet.stripeConnectAccountId);
  await prisma.cabinet.update({
    where: { id: cabinetId },
    data: { stripeConnectChargesEnabled: status.chargesEnabled },
  });
  return status;
}
