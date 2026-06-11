import type { DomainResult, ReadinessReport, ReadinessState } from "./types";

/**
 * Règle d'or (doctrine de preuve) : un domaine reste `complete` SEULEMENT si
 * tous ses checks passent ET chacun porte une preuve (evidence non nulle).
 * Tout `complete` non prouvé est rétrogradé en `to_complete`. C'est la traduction
 * technique de « jamais conforme sans preuve » : même un domaine qui se déclare
 * complete par erreur ne peut pas franchir cette barrière sans evidence.
 */
export function enforceEvidenceRule(result: DomainResult): DomainResult {
  if (result.state !== "complete") return result;
  const proven =
    result.checks.length > 0 &&
    result.checks.every((c) => c.passed && c.evidence !== null);
  return proven ? result : { ...result, state: "to_complete" };
}

const SCORE_WEIGHT: Record<ReadinessState, number | null> = {
  complete: 100,
  warning: 70,
  to_complete: 40,
  blocking: 0,
  not_applicable: null, // exclu du score
};

function emptyCounts(): Record<ReadinessState, number> {
  return { complete: 0, to_complete: 0, warning: 0, blocking: 0, not_applicable: 0 };
}

/**
 * Agrège les résultats de domaines en un rapport. Applique la règle d'or à chaque
 * domaine, calcule un score 0-100 sur les domaines applicables (not_applicable
 * exclus) et trie les domaines bloquants / en avertissement pour l'UI.
 */
export function assembleReport(
  rawDomains: DomainResult[],
  pending: string[] = [],
): ReadinessReport {
  const domains = rawDomains.map(enforceEvidenceRule);
  const counts = emptyCounts();
  let sum = 0;
  let n = 0;
  for (const d of domains) {
    counts[d.state] += 1;
    const w = SCORE_WEIGHT[d.state];
    if (w !== null) {
      sum += w;
      n += 1;
    }
  }
  return {
    domains,
    score: n === 0 ? 0 : Math.round(sum / n),
    counts,
    blocking: domains.filter((d) => d.state === "blocking"),
    warnings: domains.filter((d) => d.state === "warning"),
    pending,
  };
}
