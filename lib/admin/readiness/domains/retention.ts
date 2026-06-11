import type { DomainResult } from "../types";
import type { CabinetReadinessSnapshot } from "../snapshot";
import {
  requirementsForProvince,
  minYearsFor,
  normalizeDocType,
  normalizeProvince,
  type RetentionRequirement,
} from "../retention-requirements";

const TITLE = "Rétention documentaire";

/**
 * Domaine 10 — Rétention documentaire (spec §5.2.10).
 *
 * Couverture RÉELLE par type de document requis (pas un simple `count > 0`) :
 * pour chaque type requis dans la province, existe-t-il une politique de rétention,
 * et sa durée atteint-elle le minimum ? Doctrine : partiel = `to_complete` ;
 * `complete` seulement si tous les types sont couverts ET les durées suffisantes.
 */
export function evaluateRetention(snapshot: CabinetReadinessSnapshot): DomainResult {
  const province = normalizeProvince(snapshot.province);

  // Sans province, impossible de déterminer le référentiel applicable.
  if (!province) {
    return {
      domain: "retention",
      title: TITLE,
      state: "blocking",
      checks: [{ id: "province_set", label: "Province définie", passed: false, evidence: null }],
      evidence: null,
      action: "Définir la province du cabinet pour déterminer les types de documents requis.",
    };
  }

  const required = requirementsForProvince(province);
  if (required.length === 0) {
    return {
      domain: "retention",
      title: TITLE,
      state: "not_applicable",
      checks: [],
      evidence: `Aucun type requis répertorié pour ${province}.`,
      action: null,
    };
  }

  const policyByType = new Map<string, number>();
  for (const p of snapshot.retention.policies) {
    policyByType.set(normalizeDocType(p.documentType), p.retentionYears);
  }

  const matchPolicy = (req: RetentionRequirement): number | null => {
    const keys = [req.documentType, ...(req.aliases ?? [])].map(normalizeDocType);
    for (const k of keys) {
      const years = policyByType.get(k);
      if (years !== undefined) return years;
    }
    return null;
  };

  const missing: string[] = [];
  const belowMinimum: { type: string; have: number; need: number }[] = [];
  const checks = required.map((req) => {
    const years = matchPolicy(req);
    const need = minYearsFor(req, province);
    if (years === null) {
      missing.push(req.documentType);
      return { id: `policy_${req.documentType}`, label: req.label, passed: false, evidence: null };
    }
    const adequate = years >= need;
    if (!adequate) belowMinimum.push({ type: req.documentType, have: years, need });
    return {
      id: `policy_${req.documentType}`,
      label: req.label,
      passed: adequate,
      evidence: `${years} an(s) conservés (min. ${need}).`,
    };
  });

  const covered = required.length - missing.length;
  const ratio = `${covered} / ${required.length}`;
  const data = {
    covered,
    required: required.length,
    missing,
    belowMinimum,
    provisional: true, // référentiel provisoire, cf. retention-requirements.ts
  };

  if (covered === 0) {
    return {
      domain: "retention",
      title: TITLE,
      state: "to_complete",
      checks,
      evidence: `Aucun des ${required.length} types requis n'a de politique de rétention.`,
      action: "Définir une politique de rétention pour chaque type de document requis.",
      data,
    };
  }
  if (covered < required.length) {
    return {
      domain: "retention",
      title: TITLE,
      state: "to_complete",
      checks,
      evidence: `${ratio} types requis couverts.`,
      action: `Compléter les ${missing.length} type(s) manquant(s) : ${missing.join(", ")}.`,
      data,
    };
  }
  // Couverture complète : reste à vérifier l'adéquation des durées.
  if (belowMinimum.length > 0) {
    return {
      domain: "retention",
      title: TITLE,
      state: "warning",
      checks,
      evidence: `${ratio} types couverts, mais ${belowMinimum.length} durée(s) sous le minimum.`,
      action: `Relever la durée de conservation : ${belowMinimum.map((b) => b.type).join(", ")}.`,
      data,
    };
  }
  return {
    domain: "retention",
    title: TITLE,
    state: "complete",
    checks,
    evidence: `${ratio} types requis couverts, durées conformes.`,
    action: null,
    data,
  };
}
