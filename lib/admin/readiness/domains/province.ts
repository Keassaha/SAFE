import type { DomainResult } from "../types";
import type { CabinetReadinessSnapshot } from "../snapshot";
import { normalizeProvince } from "../retention-requirements";

/**
 * Domaine 2 — Province / juridiction (spec §5.2.2).
 * `blocking` si absente : elle conditionne taxes, rétention et fidéicommis.
 */
export function evaluateProvince(snapshot: CabinetReadinessSnapshot): DomainResult {
  const prov = normalizeProvince(snapshot.province);
  const passed = prov !== null;
  return {
    domain: "province",
    title: "Province / juridiction",
    state: passed ? "complete" : "blocking",
    checks: [{ id: "province_set", label: "Province définie", passed, evidence: prov }],
    evidence: passed ? `Province : ${prov}.` : null,
    action: passed
      ? null
      : "Définir la province : elle pilote taxes, rétention et fidéicommis.",
  };
}
