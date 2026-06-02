/**
 * SAFE — Moteur de recommandation de bundle.
 *
 * Source: docs/audit/AUDIT_TO_BUNDLE_MAPPING.md + docs/bundles/BUNDLE_DECISION_RULES.md.
 *
 * Logique déterministe et lisible:
 *   1) filtrer les bundles par province
 *   2) scorer chaque bundle restant sur 4 dimensions
 *   3) prendre le meilleur, calculer la confiance
 *   4) proposer overrides + détecter custom triggers
 *
 * Pas de magie, pas d'apprentissage. Tout passe par des règles inspectables.
 */

import { BUNDLES } from "./bundles";
import { selectCapabilities } from "./capability-library";
import type {
  BundleConfidence,
  BundleDefinition,
  BundleRecommendation,
  AuditSnapshot,
} from "./types";

const SCORE_PROVINCE = 30;
const SCORE_BILLING = 25;
const SCORE_PRACTICES = 30;
const SCORE_TEAM = 15;

const HIGH_THRESHOLD = 70;
const MEDIUM_THRESHOLD = 40;

interface ScoredBundle {
  bundle: BundleDefinition;
  score: number;
  matched: string[];
}

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null ? value as Record<string, unknown> : {};
}

function targetProvinces(b: BundleDefinition): string[] {
  const arr = (b.targetProfile as { provinces?: string[] }).provinces;
  return Array.isArray(arr) ? arr : [];
}

function targetPractices(b: BundleDefinition): string[] {
  const arr = (b.targetProfile as { practices?: string[] }).practices;
  return Array.isArray(arr) ? arr : [];
}

function targetBilling(b: BundleDefinition): string[] {
  const arr = (b.targetProfile as { billingModels?: string[] }).billingModels;
  return Array.isArray(arr) ? arr : [];
}

function targetTeam(b: BundleDefinition): string[] {
  const arr = (b.targetProfile as { teamSize?: string[] }).teamSize;
  return Array.isArray(arr) ? arr : [];
}

function scoreBundle(bundle: BundleDefinition, snap: AuditSnapshot): ScoredBundle {
  const cab = snap.profiles.cabinetProfile as { jurisdictionPrimary: string; teamSizeBand: string };
  const prac = snap.profiles.practiceProfile as { primaryPractices: string[]; secondaryPractices: string[] };
  const bill = snap.profiles.billingProfile as { billingPrimary: string };

  const matched: string[] = [];
  let score = 0;

  if (targetProvinces(bundle).includes(cab.jurisdictionPrimary)) {
    score += SCORE_PROVINCE;
    matched.push(`Province ${cab.jurisdictionPrimary}`);
  }

  const tBilling = targetBilling(bundle);
  if (tBilling.includes(bill.billingPrimary)) {
    score += SCORE_BILLING;
    matched.push(`Facturation ${bill.billingPrimary}`);
  } else if (bill.billingPrimary === "mixte" && tBilling.includes("mixte")) {
    score += SCORE_BILLING;
    matched.push("Facturation mixte");
  }

  const tPractices = targetPractices(bundle);
  const userPractices = [...prac.primaryPractices, ...prac.secondaryPractices];
  const overlap = userPractices.filter((p) => tPractices.includes(p));
  if (overlap.length >= 2) {
    score += SCORE_PRACTICES;
    matched.push(`Pratiques: ${overlap.join(" + ")}`);
  } else if (overlap.length === 1) {
    score += Math.round(SCORE_PRACTICES * 0.6);
    matched.push(`Pratique dominante: ${overlap[0]}`);
  }

  if (targetTeam(bundle).includes(cab.teamSizeBand)) {
    score += SCORE_TEAM;
    matched.push(`Équipe ${cab.teamSizeBand}`);
  }

  return { bundle, score, matched };
}

function confidenceFor(score: number): BundleConfidence {
  if (score >= HIGH_THRESHOLD) return "high";
  if (score >= MEDIUM_THRESHOLD) return "medium";
  return "low";
}

function detectCustomTriggers(snap: AuditSnapshot, bundle: BundleDefinition): string[] {
  const triggers: string[] = [];
  const bill = snap.profiles.billingProfile as { billingPrimary: string; billingComplexityLevel: string };
  const comp = snap.profiles.complianceProfile as { aideJuridique: string };
  const prac = snap.profiles.practiceProfile as { primaryPractices: string[]; secondaryPractices: string[] };

  if (bill.billingPrimary === "commission") {
    triggers.push("Facturation à la commission — sortir en custom (revenue recognition).");
  }
  if (bill.billingComplexityLevel === "advanced_custom") {
    triggers.push("Logique de facturation avancée — dépasse les modes standards.");
  }
  if (comp.aideJuridique === "reg") {
    triggers.push("Aide juridique régulière — flux de facturation et reddition spécifiques.");
  }
  const allPractices = [...prac.primaryPractices, ...prac.secondaryPractices];
  const targeted = targetPractices(bundle);
  const outside = allPractices.filter((p) => !targeted.includes(p) && p !== "generaliste");
  if (outside.length >= 2) {
    triggers.push(`Pratiques hors bundle: ${outside.join(", ")} — vérifier hybride ou custom.`);
  }
  return triggers;
}

function consultationTopicsFor(bundle: BundleDefinition, snap: AuditSnapshot): string[] {
  const topics: string[] = [];
  topics.push(`Valider la pratique dominante: ${targetPractices(bundle).join(" + ")}`);
  topics.push(`Confirmer le mode de facturation: ${targetBilling(bundle).join(", ")}`);

  const comp = snap.profiles.complianceProfile as { trustRequired: boolean; trustRegime: string };
  if (comp.trustRequired) {
    topics.push(`Cadrer la fiducie (${comp.trustRegime}): conciliation et signataires.`);
  }

  const ops = snap.profiles.operationsProfile as { primaryOperator: string };
  topics.push(`Confirmer l'utilisateur principal: ${ops.primaryOperator}`);

  return topics;
}

function recommendOverrides(bundle: BundleDefinition, snapshot: AuditSnapshot): string[] {
  const allowed = new Set(bundle.allowedOverrides);
  const recommended = new Set<string>();

  const cabinet = asRecord(snapshot.profiles.cabinetProfile);
  const practice = asRecord(snapshot.profiles.practiceProfile);
  const billing = asRecord(snapshot.profiles.billingProfile);
  const operations = asRecord(snapshot.profiles.operationsProfile);
  const compliance = asRecord(snapshot.profiles.complianceProfile);

  const languages = Array.isArray(practice.languages) ? practice.languages.map(String) : [];
  const secondaryPractices = Array.isArray(practice.secondaryPractices)
    ? practice.secondaryPractices.map(String)
    : [];
  const allPractices = [
    ...(Array.isArray(practice.primaryPractices) ? practice.primaryPractices.map(String) : []),
    ...secondaryPractices,
  ];

  const localeDefault = String(cabinet.localeDefault || "");
  const paymentDelay = String(billing.delaiPaiement || "");
  const automationDream = String(operations.automationDream || "");
  const primaryOperator = String(operations.primaryOperator || "");
  const trustRequired = Boolean(compliance.trustRequired);
  const billingPrimary = String(billing.billingPrimary || "");

  if (allowed.has("reminder_days") && ["31_60", "60plus", "plus30"].includes(paymentDelay)) {
    recommended.add("reminder_days");
  }

  if (allowed.has("dashboard_widgets") && ["suivi", "dashboard", "creances", "reporting"].includes(automationDream)) {
    recommended.add("dashboard_widgets");
  }

  if (allowed.has("accepted_payment_methods") && (trustRequired || billingPrimary === "forfait")) {
    recommended.add("accepted_payment_methods");
  }

  if (allowed.has("real_estate_subtypes") && allPractices.includes("immobilier")) {
    recommended.add("real_estate_subtypes");
  }

  if (allowed.has("locale_secondary_fr") && localeDefault === "en" && languages.includes("fr")) {
    recommended.add("locale_secondary_fr");
  }

  if (allowed.has("locale_fr") && localeDefault === "en" && languages.includes("fr")) {
    recommended.add("locale_fr");
  }

  if (allowed.has("show_internal_time") && String(operations.delegationLevel || "none") !== "none") {
    recommended.add("show_internal_time");
  }

  if (allowed.has("prepayment_amount") && billingPrimary === "forfait") {
    recommended.add("prepayment_amount");
  }

  if (allowed.has("step_granularity") && String(practice.practiceMixType || "") !== "single_specialty") {
    recommended.add("step_granularity");
  }

  if (allowed.has("plafond_par_dossier") && String(practice.clientMix || "") === "entreprises") {
    recommended.add("plafond_par_dossier");
  }

  if (allowed.has("niveau_detail_facture") && billingPrimary === "horaire") {
    recommended.add("niveau_detail_facture");
  }

  if (allowed.has("ajout_domaine") && secondaryPractices.length > 0) {
    recommended.add("ajout_domaine");
  }

  if (allowed.has("widgets_par_domaine") && String(practice.practiceMixType || "") === "hybrid_multi_practice") {
    recommended.add("widgets_par_domaine");
  }

  if (allowed.has("permissions_assistant") && primaryOperator !== "moi") {
    recommended.add("permissions_assistant");
  }

  if (allowed.has("types_dossiers_immigration_actifs") && allPractices.includes("immigration")) {
    recommended.add("types_dossiers_immigration_actifs");
  }

  if (allowed.has("specialisation_progressive") && allPractices.includes("generaliste")) {
    recommended.add("specialisation_progressive");
  }

  if (allowed.has("ajout_module_conformite") && trustRequired) {
    recommended.add("ajout_module_conformite");
  }

  if (allowed.has("masquage_modules_secondaires") && automationDream === "simplicite") {
    recommended.add("masquage_modules_secondaires");
  }

  return bundle.allowedOverrides.filter((overrideId) => recommended.has(overrideId));
}

export function recommendBundle(
  snapshot: AuditSnapshot,
  bundles: BundleDefinition[] = BUNDLES,
): BundleRecommendation {
  const province = (snapshot.profiles.cabinetProfile as { jurisdictionPrimary: string }).jurisdictionPrimary;
  const eligible = bundles.filter((b) => targetProvinces(b).includes(province));

  // Si aucune province cible, on essaie quand même tous les bundles avec score réduit.
  const pool = eligible.length > 0 ? eligible : bundles;

  const scored = pool.map((b) => scoreBundle(b, snapshot)).sort((a, b) => b.score - a.score);
  const best = scored[0];
  const alternatives = scored.slice(1, 3).map((s) => s.bundle.bundleId);

  const confidence = confidenceFor(best.score);
  const customTriggers = detectCustomTriggers(snapshot, best.bundle);

  // Si la province ne matche aucun bundle, c'est un signal custom fort.
  if (eligible.length === 0) {
    customTriggers.unshift(`Province ${province} non couverte par un bundle standard.`);
  }
  if (confidence === "low" && customTriggers.length === 0) {
    customTriggers.push("Score faible — profil hors patterns standards, à valider en consultation.");
  }

  // Overrides probables: on remonte uniquement les ajustements contextuels
  // réellement suggérés par les réponses d'audit.
  const recommendedOverrides = recommendOverrides(best.bundle, snapshot);

  return {
    bundleId: best.bundle.bundleId,
    confidence,
    why: best.matched,
    alternativeBundleIds: alternatives,
    selectedCapabilities: selectCapabilities(snapshot),
    recommendedOverrides,
    customTriggers,
    consultationTopics: consultationTopicsFor(best.bundle, snapshot),
  };
}
