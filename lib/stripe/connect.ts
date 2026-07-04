/**
 * Stripe Connect (Express) — comptes connectés des cabinets (ADR-012).
 *
 * Modèle : chaque cabinet a son propre compte Connect Express. Les paiements de
 * facture sont des *direct charges* sur ce compte → l'argent va directement à
 * l'avocate ; SAFE n'est jamais dépositaire des fonds.
 *
 * Ce module encapsule les appels Stripe Connect. Il nécessite Connect activé sur
 * le compte plateforme Stripe et une clé `STRIPE_SECRET_KEY` valide (le flux ne
 * peut donc être testé qu'en mode test Stripe, pas en unitaire).
 */
import { getStripe } from "@/lib/stripe";

/**
 * Crée un compte Connect Express pour un cabinet et renvoie son id. À stocker
 * dans `Cabinet.stripeConnectAccountId`. Idempotence : l'appelant ne doit créer
 * un compte que si le cabinet n'en a pas déjà un.
 */
export async function createConnectAccount(params: {
  email?: string | null;
  country?: string;
}): Promise<string> {
  const stripe = getStripe();
  const account = await stripe.accounts.create({
    type: "express",
    country: params.country ?? "CA",
    email: params.email ?? undefined,
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true },
    },
  });
  return account.id;
}

/**
 * Lien d'onboarding Express (hébergé par Stripe) pour que l'avocate complète son
 * compte (identité, compte bancaire). À usage unique, courte durée.
 */
export async function createConnectOnboardingLink(params: {
  accountId: string;
  refreshUrl: string;
  returnUrl: string;
}): Promise<string> {
  const stripe = getStripe();
  const link = await stripe.accountLinks.create({
    account: params.accountId,
    refresh_url: params.refreshUrl,
    return_url: params.returnUrl,
    type: "account_onboarding",
  });
  return link.url;
}

export interface ConnectAccountStatus {
  /** Le compte peut-il encaisser des cartes ? (pré-requis du bouton payer) */
  chargesEnabled: boolean;
  /** L'onboarding a-t-il été soumis ? */
  detailsSubmitted: boolean;
  /** Les versements sont-ils actifs ? */
  payoutsEnabled: boolean;
}

/** Récupère le statut d'un compte connecté (pour synchroniser `Cabinet`). */
export async function getConnectAccountStatus(
  accountId: string,
): Promise<ConnectAccountStatus> {
  const stripe = getStripe();
  const acct = await stripe.accounts.retrieve(accountId);
  return {
    chargesEnabled: Boolean(acct.charges_enabled),
    detailsSubmitted: Boolean(acct.details_submitted),
    payoutsEnabled: Boolean(acct.payouts_enabled),
  };
}
