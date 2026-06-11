import type { DomainResult } from "../types";

/**
 * Domaine 13 — Onboarding / configuration initiale (spec §5.2.13).
 * Agrège les domaines BLOQUANTS restants : `to_complete` tant qu'un domaine
 * bloquant subsiste, `complete` sinon. Dérivé des autres domaines (pas du snapshot).
 */
export function evaluateOnboarding(domains: DomainResult[]): DomainResult {
  const blocking = domains.filter((d) => d.state === "blocking");
  if (blocking.length === 0) {
    return {
      domain: "onboarding",
      title: "Configuration initiale",
      state: "complete",
      checks: [
        { id: "no_blocking", label: "Aucun domaine bloquant", passed: true, evidence: "0 bloquant" },
      ],
      evidence: "Aucun point bloquant de configuration.",
      action: null,
    };
  }
  return {
    domain: "onboarding",
    title: "Configuration initiale",
    state: "to_complete",
    checks: [
      { id: "no_blocking", label: "Aucun domaine bloquant", passed: false, evidence: null },
    ],
    evidence: `${blocking.length} domaine(s) bloquant(s) à régler.`,
    action: `À régler : ${blocking.map((d) => d.title).join(", ")}.`,
  };
}
