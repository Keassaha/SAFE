import type { DomainResult } from "../types";
import type { CabinetReadinessSnapshot } from "../snapshot";
import { deriveCabinetSubscriptionState } from "@/lib/services/subscription-state";

/**
 * Domaine 9 — Abonnement SAFE (spec §5.2.9).
 * État DÉRIVÉ via le moteur unifié, jamais le token Stripe brut.
 * `blocking` si inactif (past_due/unpaid/canceled), `warning` si résiliation programmée.
 */
export function evaluateSubscription(snapshot: CabinetReadinessSnapshot): DomainResult {
  const s = deriveCabinetSubscriptionState(snapshot.subscription);
  const title = "Abonnement SAFE";

  if (s.active && s.cancelAtPeriodEnd) {
    return {
      domain: "subscription",
      title,
      state: "warning",
      checks: [{ id: "active", label: "Abonnement actif", passed: true, evidence: s.status }],
      evidence: "Actif, mais résiliation programmée en fin de période.",
      action: "Réactiver le renouvellement automatique si nécessaire.",
    };
  }
  if (s.active) {
    return {
      domain: "subscription",
      title,
      state: "complete",
      checks: [
        { id: "active", label: "Abonnement actif", passed: true, evidence: s.status ?? String(s.plan) },
      ],
      evidence: s.isTrialing ? "Période d'essai active." : "Abonnement actif.",
      action: null,
    };
  }
  return {
    domain: "subscription",
    title,
    state: "blocking",
    checks: [{ id: "active", label: "Abonnement actif", passed: false, evidence: null }],
    evidence: null,
    action: `Régulariser l'abonnement (état : ${s.reason ?? s.status ?? "inconnu"}).`,
  };
}
