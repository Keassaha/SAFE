import type { DomainResult } from "../types";
import type { CabinetReadinessSnapshot } from "../snapshot";

/**
 * Domaine 1 — Identité du cabinet (spec §5.2.1).
 * `complete` si nom, adresse et courriel présents (logo et n° Barreau facultatifs ici).
 */
export function evaluateIdentity(snapshot: CabinetReadinessSnapshot): DomainResult {
  const { nom, adresse, email } = snapshot.identity;
  const checks = [
    { id: "nom", label: "Nom légal", passed: Boolean(nom), evidence: nom },
    { id: "adresse", label: "Adresse", passed: Boolean(adresse), evidence: adresse },
    { id: "email", label: "Courriel", passed: Boolean(email), evidence: email },
  ];
  const allPass = checks.every((c) => c.passed);
  return {
    domain: "identity",
    title: "Identité du cabinet",
    state: allPass ? "complete" : "to_complete",
    checks,
    evidence: allPass ? "Nom, adresse et courriel renseignés." : null,
    action: allPass ? null : "Compléter l'identité du cabinet (nom, adresse, courriel).",
  };
}
