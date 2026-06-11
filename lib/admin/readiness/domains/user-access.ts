import type { DomainResult } from "../types";
import type { CabinetReadinessSnapshot } from "../snapshot";

/**
 * Domaine 7 — Accès utilisateurs (spec §5.2.7).
 * Chaque compte de connexion (User) devrait être rattaché à un employé.
 * `warning` si des comptes orphelins existent (à rattacher ou révoquer).
 */
export function evaluateUserAccess(snapshot: CabinetReadinessSnapshot): DomainResult {
  const { totalUsers, usersWithoutEmployee } = snapshot.userAccess;
  const passed = usersWithoutEmployee === 0;
  const state = totalUsers === 0 ? "to_complete" : passed ? "complete" : "warning";
  return {
    domain: "user_access",
    title: "Accès utilisateurs",
    state,
    checks: [
      {
        id: "all_linked",
        label: "Tout compte rattaché à un employé",
        passed,
        evidence: passed ? `${totalUsers} compte(s) rattaché(s)` : null,
      },
    ],
    evidence:
      passed && totalUsers > 0 ? `${totalUsers} compte(s), tous rattachés à un employé.` : null,
    action: passed
      ? null
      : `${usersWithoutEmployee} compte(s) de connexion sans employé lié : à rattacher ou révoquer.`,
  };
}
