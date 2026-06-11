import type { DomainResult } from "../types";
import type { CabinetReadinessSnapshot } from "../snapshot";

/**
 * Domaine 12 — Sécurité (spec §5.2.12).
 * Aucun champ MFA n'existe encore au modèle : ce domaine démarre HONNÊTEMENT en
 * `to_complete`, jamais `complete`, tant que les contrôles réels (MFA, politique
 * de mot de passe, NAS chiffré au repos) ne sont pas mesurables. La doctrine de
 * preuve interdit de prétendre « complet » sans contrôle vérifiable.
 */
export function evaluateSecurity(_snapshot: CabinetReadinessSnapshot): DomainResult {
  return {
    domain: "security",
    title: "Sécurité",
    state: "to_complete",
    checks: [
      { id: "mfa", label: "Authentification multifacteur", passed: false, evidence: null },
    ],
    evidence: null,
    action:
      "Contrôles de sécurité (MFA, politique de mot de passe, NAS chiffré) pas encore mesurables : à implémenter (P6).",
  };
}
