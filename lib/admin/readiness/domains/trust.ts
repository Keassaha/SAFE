import type { DomainResult } from "../types";
import type { CabinetReadinessSnapshot } from "../snapshot";

const TITLE = "Fidéicommis";

/**
 * Domaine 5 — Fidéicommis (spec §5.2.5).
 * Réutilise le statut de rapprochement (B-1 r.5 / LSO By-Law 9, échéance 25 jours).
 * `not_applicable` si aucune activité de fidéicommis ; `blocking` si en retard.
 */
export function evaluateTrust(snapshot: CabinetReadinessSnapshot): DomainResult {
  const s = snapshot.trust;
  if (s === null) {
    return {
      domain: "trust",
      title: TITLE,
      state: "not_applicable",
      checks: [],
      evidence: "Aucune activité de fidéicommis.",
      action: null,
    };
  }
  if (s.isOverdue) {
    const why = s.hasNeverReconciled ? "jamais rapproché" : `${s.daysOverdue} jour(s) de retard`;
    return {
      domain: "trust",
      title: TITLE,
      state: "blocking",
      checks: [
        { id: "reconciliation_current", label: "Rapprochement à jour", passed: false, evidence: null },
      ],
      evidence: null,
      action: `Rapprochement de fidéicommis en retard (${why}). Obligation B-1 r.5 / By-Law 9.`,
    };
  }
  return {
    domain: "trust",
    title: TITLE,
    state: "complete",
    checks: [
      {
        id: "reconciliation_current",
        label: "Rapprochement à jour",
        passed: true,
        evidence: s.lastCertifiedPeriode,
      },
    ],
    evidence: `Dernier rapprochement certifié : ${s.lastCertifiedPeriode}.`,
    action: null,
  };
}
