import type { DomainResult } from "../types";
import type { CabinetReadinessSnapshot } from "../snapshot";

const TITLE = "Console SAFE";

/**
 * Domaine 14 — Console SAFE interne (spec §5.2.14).
 * `not_applicable` hors cabinet SAFE. Pour le cabinet SAFE : `blocking` tant que
 * la garde de la Console repose sur le NOM du cabinet plutôt qu'un rôle interne
 * distinct (P0 a ajouté `canManageCabinetSettings`, mais le rôle interne = P3).
 */
export function evaluateConsole(snapshot: CabinetReadinessSnapshot): DomainResult {
  if (!snapshot.console.isSafeInc) {
    return {
      domain: "console",
      title: TITLE,
      state: "not_applicable",
      checks: [],
      evidence: "Cabinet non interne SAFE.",
      action: null,
    };
  }
  return {
    domain: "console",
    title: TITLE,
    state: "blocking",
    checks: [
      {
        id: "internal_role_guard",
        label: "Garde Console par rôle interne",
        passed: false,
        evidence: null,
      },
    ],
    evidence: null,
    action: "La garde Console repose sur le nom du cabinet. Introduire un rôle interne distinct (P3).",
  };
}
