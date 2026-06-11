import type { DomainResult } from "../types";
import type { CabinetReadinessSnapshot } from "../snapshot";

/**
 * Domaine 11 — Journal d'audit (spec §5.2.11).
 * `complete` si le socle écrit (au moins une entrée). La preuve est la date de
 * la dernière écriture.
 */
export function evaluateAuditLog(snapshot: CabinetReadinessSnapshot): DomainResult {
  const last = snapshot.audit.lastEntryAt;
  const passed = last !== null;
  return {
    domain: "audit_log",
    title: "Journal d'audit",
    state: passed ? "complete" : "to_complete",
    checks: [
      {
        id: "has_entries",
        label: "Écritures présentes",
        passed,
        evidence: last ? last.toISOString() : null,
      },
    ],
    evidence: passed ? "Le journal d'audit enregistre des écritures." : null,
    action: passed
      ? null
      : "Aucune écriture d'audit : vérifier que la journalisation est active.",
  };
}
