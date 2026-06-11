import type { EmployeeRole, EmployeeStatus } from "@prisma/client";
import { canEmployeeRoleSignIn } from "@/lib/auth/rbac";

/**
 * État d'accès d'un employé pour la liste d'équipe (P1) et le domaine readiness
 * « roles » (P2).
 *
 * SOURCE DE VÉRITÉ du mapping rôle RH → rôle portail : `lib/auth/rbac.ts`
 * (`employeeRoleToUserRole` / `canEmployeeRoleSignIn`). Ce module n'en garde PLUS
 * de copie (dédup P3, ADR-010) : INTERN et READ_ONLY restent non connectables là-bas.
 */

/** Le rôle RH a-t-il un équivalent de connexion au portail ? (délègue à rbac.ts). */
export function employeeRoleCanLogin(role: EmployeeRole): boolean {
  return canEmployeeRoleSignIn(role);
}

/**
 * État d'accès d'un employé, calculé (jamais figé). Quatre cas exclusifs :
 * - `connected`  : un compte de connexion est lié (`userId`).
 * - `pending`    : actif, rôle connectable, mais aucun compte → devrait être invité.
 * - `no_access`  : rôle sans équivalent portail (stagiaire, lecture seule) → voulu.
 * - `inactive`   : employé désactivé sans compte → aucun accès attendu.
 */
export type EmployeeAccessState = "connected" | "pending" | "no_access" | "inactive";

export function deriveEmployeeAccess(input: {
  userId: string | null;
  status: EmployeeStatus;
  role: EmployeeRole;
}): EmployeeAccessState {
  if (input.userId) return "connected";
  if (input.status === "inactive") return "inactive";
  return employeeRoleCanLogin(input.role) ? "pending" : "no_access";
}
