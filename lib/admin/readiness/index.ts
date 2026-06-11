/**
 * Administrative Readiness Engine — point d'entrée.
 *
 * Pipeline : loader (Prisma) -> snapshot -> domaines purs -> assembleReport.
 * Doctrine : « jamais conforme sans preuve ». Spec : docs/admin/ARCHITECTURE_ADMIN_RBAC.md §5.
 */
import { assembleReport } from "./engine";
import { loadCabinetReadinessSnapshot } from "./loader";
import { evaluateIdentity } from "./domains/identity";
import { evaluateProvince } from "./domains/province";
import { evaluateTaxes } from "./domains/taxes";
import { evaluateBilling } from "./domains/billing";
import { evaluateTrust } from "./domains/trust";
import { evaluateTeam } from "./domains/team";
import { evaluateUserAccess } from "./domains/user-access";
import { evaluateRoles } from "./domains/roles";
import { evaluateSubscription } from "./domains/subscription";
import { evaluateRetention } from "./domains/retention";
import { evaluateAuditLog } from "./domains/audit-log";
import { evaluateSecurity } from "./domains/security";
import { evaluateConsole } from "./domains/console";
import { evaluateOnboarding } from "./domains/onboarding";
import type { CabinetReadinessSnapshot } from "./snapshot";
import type { ReadinessReport } from "./types";

export * from "./types";
export type { CabinetReadinessSnapshot, RetentionPolicySnapshot } from "./snapshot";
export { assembleReport, enforceEvidenceRule } from "./engine";
export { loadCabinetReadinessSnapshot } from "./loader";
export { evaluateIdentity } from "./domains/identity";
export { evaluateProvince } from "./domains/province";
export { evaluateTaxes } from "./domains/taxes";
export { evaluateBilling } from "./domains/billing";
export { evaluateTrust } from "./domains/trust";
export { evaluateTeam } from "./domains/team";
export { evaluateUserAccess } from "./domains/user-access";
export { evaluateRoles } from "./domains/roles";
export { evaluateSubscription } from "./domains/subscription";
export { evaluateRetention } from "./domains/retention";
export { evaluateAuditLog } from "./domains/audit-log";
export { evaluateSecurity } from "./domains/security";
export { evaluateConsole } from "./domains/console";
export { evaluateOnboarding } from "./domains/onboarding";

/**
 * Domaines de la spec §5.2 pas encore branchés. Les 14 sont désormais implémentés
 * (cet incrément clôt P2). Liste vide = aucun domaine en attente.
 */
export const PENDING_DOMAINS: string[] = [];

/** Évalue tous les domaines implémentés sur un snapshot donné (fonction pure). */
export function evaluateReadiness(snapshot: CabinetReadinessSnapshot): ReadinessReport {
  const base = [
    evaluateIdentity(snapshot),
    evaluateProvince(snapshot),
    evaluateTaxes(snapshot),
    evaluateBilling(snapshot),
    evaluateTrust(snapshot),
    evaluateTeam(snapshot),
    evaluateUserAccess(snapshot),
    evaluateRoles(snapshot),
    evaluateSubscription(snapshot),
    evaluateRetention(snapshot),
    evaluateAuditLog(snapshot),
    evaluateSecurity(snapshot),
    evaluateConsole(snapshot),
  ];
  // Onboarding agrège les bloquants restants : calculé après les autres.
  const onboarding = evaluateOnboarding(base);
  return assembleReport([...base, onboarding], PENDING_DOMAINS);
}

/** Charge le snapshot et calcule le rapport de readiness pour un cabinet. */
export async function getCabinetReadiness(cabinetId: string): Promise<ReadinessReport | null> {
  const snapshot = await loadCabinetReadinessSnapshot(cabinetId);
  if (!snapshot) return null;
  return evaluateReadiness(snapshot);
}
