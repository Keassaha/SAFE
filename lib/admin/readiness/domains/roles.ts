import type { DomainResult } from "../types";
import type { CabinetReadinessSnapshot } from "../snapshot";
import { employeeRoleCanLogin } from "@/lib/employees/access";

const TITLE = "Rôles et permissions";

/**
 * Domaine 8 — Rôles et permissions (spec §5.2.8).
 * `blocking` si aucun administrateur. `warning` si un rôle non connectable
 * (stagiaire / lecture seule) possède malgré tout un compte de connexion —
 * c'est exactement le trou que la colonne « Accès » de P1 a mis en lumière.
 */
export function evaluateRoles(snapshot: CabinetReadinessSnapshot): DomainResult {
  const admins = snapshot.team.adminUserCount;
  const nonConnectableWithAccount = snapshot.team.employees.filter(
    (e) => !employeeRoleCanLogin(e.role) && e.userId !== null,
  ).length;

  const checks = [
    {
      id: "has_admin",
      label: "Au moins un administrateur",
      passed: admins > 0,
      evidence: admins > 0 ? `${admins} admin(s)` : null,
    },
    {
      id: "no_illegit_access",
      label: "Aucun rôle non connectable avec compte",
      passed: nonConnectableWithAccount === 0,
      evidence: nonConnectableWithAccount === 0 ? "aucun" : null,
    },
  ];

  if (admins === 0) {
    return {
      domain: "roles",
      title: TITLE,
      state: "blocking",
      checks,
      evidence: null,
      action: "Désigner au moins un administrateur du cabinet.",
    };
  }
  if (nonConnectableWithAccount > 0) {
    return {
      domain: "roles",
      title: TITLE,
      state: "warning",
      checks,
      evidence: `${nonConnectableWithAccount} compte(s) de connexion sur un rôle qui ne devrait pas se connecter.`,
      action: "Retirer l'accès au portail des rôles stagiaire / lecture seule.",
    };
  }
  return {
    domain: "roles",
    title: TITLE,
    state: "complete",
    checks,
    evidence: `${admins} administrateur(s), accès cohérents.`,
    action: null,
  };
}
