import { cache } from "react";
import { prisma } from "@/lib/db";
import type { PlanKey } from "@/lib/stripe";

export const ACTIVE_STRIPE_STATUSES = ["active", "trialing"] as const;

/**
 * D'où vient l'accès quand il est accordé.
 *
 * `stripe`     — abonnement Stripe actif ou en essai.
 * `acces_paye` — échéance `Cabinet.accesPayeJusquau` encore valide, c'est-à-dire
 *                un encaissement hors Stripe (virement Interac) confirmé par
 *                SAFE Inc.
 * `null`       — aucun accès.
 *
 * Exposé plutôt que déduit par les appelants : l'écran d'abonnement doit dire
 * la vérité au cabinet, et un cabinet qui a payé par virement ne doit pas lire
 * « aucun abonnement » sur sa page de réglages.
 */
export type SubscriptionSource = "stripe" | "acces_paye" | null;

export interface CabinetSubscriptionState {
  active: boolean;
  status: string | null;
  plan: PlanKey | string;
  isTrialing: boolean;
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
  trialEnd: Date | null;
  reason: string | null;
  /** Source de l'accès accordé. `null` quand l'accès est refusé. */
  source: SubscriptionSource;
  /** Échéance de l'accès payé hors Stripe, telle que stockée. */
  accesPayeJusquau: Date | null;
}

/**
 * Deux sources d'accès, jamais une seule.
 *
 * Jusqu'ici l'accès dépendait uniquement de `stripeSubscriptionStatus`, que
 * seul le webhook Stripe écrit. SAFE Inc. encaissant par virement Interac, un
 * cabinet pouvait payer pour de vrai et rester devant l'écran « abonnement
 * requis ». L'échéance `accesPayeJusquau` est la seconde source : elle vaut
 * pour l'encaissement hors Stripe et se prolonge à chaque paiement confirmé.
 *
 * L'accès est accordé si l'UNE des deux est valide, jamais s'il faut les deux :
 * un cabinet qui a payé son mois ne doit pas être bloqué parce que son
 * abonnement Stripe historique est passé à `canceled`.
 *
 * `now` est injectable pour que la règle se teste sans dépendre de l'horloge.
 */
export function deriveCabinetSubscriptionState(input: {
  plan: string | null;
  stripeSubscriptionStatus?: string | null;
  stripeCurrentPeriodEnd?: Date | null;
  stripeCancelAtPeriodEnd?: boolean | null;
  stripeTrialEnd?: Date | null;
  accesPayeJusquau?: Date | null;
}, now: Date = new Date()): CabinetSubscriptionState {
  const status = input.stripeSubscriptionStatus ?? null;
  const isTrialing = status === "trialing";
  const stripeActive = status === "active" || status === "trialing";

  const accesPayeJusquau = input.accesPayeJusquau ?? null;
  const accesPayeActif =
    accesPayeJusquau != null && accesPayeJusquau.getTime() >= now.getTime();

  const active = stripeActive || accesPayeActif;
  // Stripe d'abord quand les deux sont valides : c'est la source qui se
  // renouvelle toute seule, donc celle dont la date fait foi.
  const source: SubscriptionSource = stripeActive
    ? "stripe"
    : accesPayeActif
      ? "acces_paye"
      : null;

  return {
    active,
    status,
    plan: input.plan ?? "essentiel",
    isTrialing: isTrialing && source === "stripe",
    // L'échéance affichée doit être celle de la source qui donne réellement
    // l'accès, sinon la page annonce une date qui ne décide de rien.
    currentPeriodEnd:
      source === "acces_paye"
        ? accesPayeJusquau
        : (input.stripeCurrentPeriodEnd ?? null),
    cancelAtPeriodEnd: input.stripeCancelAtPeriodEnd ?? false,
    trialEnd: input.stripeTrialEnd ?? null,
    reason: active ? null : inactiveReason(status, accesPayeJusquau),
    source,
    accesPayeJusquau,
  };
}

/**
 * `React.cache()` : appelée par le layout applicatif à chaque navigation ;
 * sans elle, une requête `Cabinet` de plus vient s'ajouter aux deux autres
 * déjà faites sur la même ligne dans le même rendu serveur.
 */
export const getCabinetSubscriptionState = cache(async (
  cabinetId: string,
): Promise<CabinetSubscriptionState> => {
  const cabinet = await prisma.cabinet.findUnique({
    where: { id: cabinetId },
    select: {
      plan: true,
      stripeSubscriptionStatus: true,
      stripeCurrentPeriodEnd: true,
      stripeCancelAtPeriodEnd: true,
      stripeTrialEnd: true,
      accesPayeJusquau: true,
    },
  });

  if (!cabinet) {
    return {
      active: false,
      status: null,
      plan: "essentiel",
      isTrialing: false,
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
      trialEnd: null,
      reason: "cabinet_not_found",
      source: null,
      accesPayeJusquau: null,
    };
  }

  return deriveCabinetSubscriptionState(cabinet);
});

/**
 * Motif du refus. `acces_expire` est distingué de `no_active_subscription` :
 * un cabinet qui a déjà payé et dont l'échéance vient de passer n'est pas dans
 * la même situation qu'un cabinet qui n'a jamais rien payé, et la personne qui
 * lit le journal doit pouvoir les séparer sans ouvrir la base.
 */
function inactiveReason(status: string | null, accesPayeJusquau: Date | null): string {
  switch (status) {
    case "past_due":
      return "past_due";
    case "canceled":
      return "canceled";
    case "unpaid":
      return "unpaid";
    case "incomplete":
    case "incomplete_expired":
      return status;
    default:
      return accesPayeJusquau != null ? "acces_expire" : "no_active_subscription";
  }
}
