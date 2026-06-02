/**
 * SAFE — Point d'entrée du moteur de configuration.
 *
 * Pipeline:
 *   answers brutes
 *     -> AuditSnapshot (profils dérivés)
 *     -> BundleRecommendation
 *     -> CapabilitySelection[] (blocs métier composables)
 *     -> ConsultationDecision (mock par défaut tant que l'UI n'existe pas)
 *     -> CabinetConfigurationPackage
 *
 * Cette fonction est le seul point d'appel nécessaire côté API.
 */

import { BUNDLES, getBundleById } from "./bundles";
import { buildAuditSnapshot } from "./derive-audit-profiles";
import { recommendBundle } from "./recommend-bundle";
import {
  defaultConsultationDecision,
  generateConfigurationPackage,
} from "./generate-config-package";
import type { ConfigurationEngineOutput } from "./types";

export interface RunConfigurationEngineOptions {
  source?: string;
  auditId?: string;
}

export function runConfigurationEngine(
  answers: Record<string, unknown>,
  options: RunConfigurationEngineOptions = {},
): ConfigurationEngineOutput {
  const snapshot = buildAuditSnapshot(answers, options.source ?? "audit_gratuit_v2", options.auditId);
  const recommendation = recommendBundle(snapshot, BUNDLES);
  const bundle = getBundleById(recommendation.bundleId);
  if (!bundle) {
    throw new Error(`Bundle introuvable: ${recommendation.bundleId}`);
  }
  const decision = defaultConsultationDecision(recommendation);
  const configurationPackage = generateConfigurationPackage({
    snapshot,
    bundle,
    recommendation,
    decision,
  });
  return {
    auditSnapshot: snapshot,
    bundleRecommendation: recommendation,
    consultationDecision: decision,
    configurationPackage,
  };
}

export { BUNDLES, getBundleById } from "./bundles";
export {
  CAPABILITY_LIBRARY,
  getCapabilityById,
  selectCapabilities,
} from "./capability-library";
export { buildAuditSnapshot, deriveAuditProfiles } from "./derive-audit-profiles";
export { recommendBundle } from "./recommend-bundle";
export {
  defaultConsultationDecision,
  generateConfigurationPackage,
} from "./generate-config-package";
export * from "./types";
