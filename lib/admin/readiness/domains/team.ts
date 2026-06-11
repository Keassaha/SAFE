import type { DomainResult } from "../types";
import type { CabinetReadinessSnapshot } from "../snapshot";

/**
 * Domaine 6 — Équipe (spec §5.2.6). Au moins un employé actif.
 */
export function evaluateTeam(snapshot: CabinetReadinessSnapshot): DomainResult {
  const active = snapshot.team.employees.filter((e) => e.status === "active").length;
  const passed = active > 0;
  return {
    domain: "team",
    title: "Équipe",
    state: passed ? "complete" : "to_complete",
    checks: [
      {
        id: "active_employee",
        label: "Au moins un employé actif",
        passed,
        evidence: passed ? `${active} actif(s)` : null,
      },
    ],
    evidence: passed ? `${active} employé(s) actif(s).` : null,
    action: passed ? null : "Ajouter au moins un employé actif.",
  };
}
