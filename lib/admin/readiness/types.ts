/**
 * Administrative Readiness Engine — types.
 *
 * Doctrine : statut CALCULÉ, jamais figé ; « complete » seulement sur preuve.
 * Spec : docs/admin/ARCHITECTURE_ADMIN_RBAC.md §5 ·
 *        docs/journal/2026-06-10_architecture_admin_rbac.md (P2).
 */

export type ReadinessState =
  | "complete"
  | "to_complete"
  | "warning"
  | "blocking"
  | "not_applicable";

/**
 * Domaines évalués par le moteur (spec §5.2, 14 domaines). Tous déclarés ici ;
 * ceux pas encore branchés figurent dans PENDING_DOMAINS (index.ts).
 */
export type ReadinessDomainId =
  | "identity"
  | "province"
  | "taxes"
  | "billing"
  | "trust"
  | "team"
  | "user_access"
  | "roles"
  | "subscription"
  | "retention"
  | "audit_log"
  | "security"
  | "onboarding"
  | "console";

export interface CheckResult {
  id: string;
  label: string;
  passed: boolean;
  /** Preuve vérifiable. NULL = aucune preuve → ne peut JAMAIS rendre `complete`. */
  evidence: string | null;
}

export interface DomainResult {
  domain: ReadinessDomainId;
  title: string;
  state: ReadinessState;
  checks: CheckResult[];
  /** Synthèse de preuve lisible (ratio, date, statut dérivé). */
  evidence: string | null;
  /** Action recommandée si l'état n'est pas `complete`. */
  action: string | null;
  /** Données structurées optionnelles pour l'UI (ratios, listes). */
  data?: Record<string, unknown>;
}

export interface ReadinessReport {
  domains: DomainResult[];
  /** Score 0-100 sur les domaines applicables (not_applicable exclus). */
  score: number;
  counts: Record<ReadinessState, number>;
  blocking: DomainResult[];
  warnings: DomainResult[];
  /** Domaines de la spec §5.2 pas encore évalués par le moteur (transparence). */
  pending: string[];
}
