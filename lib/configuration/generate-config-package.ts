/**
 * SAFE — Génération du paquet de configuration final.
 *
 * Source: docs/configuration/CONFIG_GENERATION_MODEL.md + CONFIG_ARTIFACTS.md.
 *
 * Le générateur reste minimaliste:
 *   - les defaults du bundle deviennent le squelette
 *   - les overrides validés par la consultation sont fusionnés
 *   - les seeds de l'activationPack deviennent le seedPlan
 *   - les triggers de custom ou les customItems décidés deviennent le customBacklog
 *
 * Aucune transformation magique. Si un point doit être généré dynamiquement
 * plus tard (ex: priorisation par urgence), on l'ajoute ici de manière explicite.
 */

import type {
  ActivationPriority,
  AuditSnapshot,
  BundleDefinition,
  BundleRecommendation,
  CabinetConfigurationPackage,
  ConsultationDecision,
} from "./types";

const DEFAULT_CABINET_CONFIG = {
  devise: "CAD",
  tauxInteret: 0,
  formatFacture: "standard",
  envoiFactureClient: "email",
};

const INTEGRATION_REASONS: Record<string, string> = {
  resend: "Envoi des emails transactionnels (factures, relances, conformité).",
  "stripe-or-interac": "Encaissement client en ligne ou virement Interac.",
  stripe: "Encaissement client par carte.",
  interac: "Encaissement client par virement Interac.",
};

const SEED_EXECUTION_CATALOG: Record<string, { args?: string[] }> = {
  "seed-immobilier-on": { args: ["lib/seeds/checklists-immobilier-on.ts"] },
  "seed-immigration": { args: ["lib/seeds/checklists-immigration.ts"] },
  "seed-checklists-immigration": { args: ["lib/seeds/checklists-immigration.ts"] },
  "seed-retention-on": { args: ["lib/seeds/retention-policies.ts"] },
  "seed-email-templates-en": { args: ["lib/seeds/email-templates.ts", "--locale=en"] },
};

function reasonFor(integrationId: string): string {
  return INTEGRATION_REASONS[integrationId] ?? `Intégration requise par le bundle (${integrationId}).`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function deepClone<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => deepClone(item)) as T;
  }
  if (isRecord(value)) {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, deepClone(item)]),
    ) as T;
  }
  return value;
}

function setAtPath(target: Record<string, unknown>, path: string[], value: unknown) {
  let cursor = target;
  for (const segment of path.slice(0, -1)) {
    const current = cursor[segment];
    if (!isRecord(current)) {
      cursor[segment] = {};
    }
    cursor = cursor[segment] as Record<string, unknown>;
  }
  cursor[path[path.length - 1]] = value;
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.map(String) : [];
}

function addUnique(values: string[], items: string[]): string[] {
  return Array.from(new Set([...values, ...items]));
}

function removeItems(values: string[], items: string[]): string[] {
  const blacklist = new Set(items);
  return values.filter((item) => !blacklist.has(item));
}

type ConfigState = BundleDefinition["defaultConfig"];
type OverrideHandler = (config: ConfigState, value: unknown) => void;

const OVERRIDE_HANDLERS: Record<string, OverrideHandler> = {
  reminder_days: (config, value) => {
    setAtPath(config as Record<string, unknown>, ["modules", "facturation", "joursRelance"], value);
  },
  accepted_payment_methods: (config, value) => {
    setAtPath(config as Record<string, unknown>, ["modules", "facturation", "methodesAcceptees"], asStringArray(value));
  },
  dashboard_widgets: (config, value) => {
    config.widgets = asStringArray(value);
  },
  real_estate_subtypes: (config, value) => {
    setAtPath(config as Record<string, unknown>, ["modules", "realEstate", "subtypes"], asStringArray(value));
  },
  locale_secondary_fr: (config) => {
    setAtPath(config as Record<string, unknown>, ["modules", "localization", "secondaryLocale"], "fr");
  },
  locale_fr: (config) => {
    config.locale = "fr";
  },
  show_internal_time: (config, value) => {
    setAtPath(config as Record<string, unknown>, ["modules", "timeTracking", "showInternal"], Boolean(value));
  },
  prepayment_amount: (config, value) => {
    setAtPath(config as Record<string, unknown>, ["modules", "facturation", "prepaymentAmount"], value);
  },
  step_granularity: (config, value) => {
    setAtPath(config as Record<string, unknown>, ["modules", "facturation", "stageGranularity"], value);
  },
  plafond_par_dossier: (config, value) => {
    setAtPath(config as Record<string, unknown>, ["modules", "facturation", "caseCap"], value);
  },
  remises_client: (config, value) => {
    setAtPath(config as Record<string, unknown>, ["modules", "facturation", "clientDiscounts"], value);
  },
  niveau_detail_facture: (config, value) => {
    setAtPath(config as Record<string, unknown>, ["modules", "facturation", "invoiceDetailLevel"], value);
  },
  ajout_domaine: (config, value) => {
    config.disciplines = addUnique(config.disciplines ?? [], asStringArray(value));
  },
  retrait_domaine: (config, value) => {
    config.disciplines = removeItems(config.disciplines ?? [], asStringArray(value));
  },
  widgets_par_domaine: (config, value) => {
    setAtPath(config as Record<string, unknown>, ["modules", "dashboard", "widgetsByPractice"], value);
  },
  permissions_assistant: (config, value) => {
    setAtPath(config as Record<string, unknown>, ["modules", "permissions", "assistantProfile"], value);
  },
  types_dossiers_immigration_actifs: (config, value) => {
    setAtPath(config as Record<string, unknown>, ["modules", "immigration", "activeCaseTypes"], asStringArray(value));
  },
  specialisation_progressive: (config, value) => {
    setAtPath(config as Record<string, unknown>, ["modules", "specialization", "progressive"], value);
  },
  ajout_module_conformite: (config, value) => {
    setAtPath(config as Record<string, unknown>, ["conformite", String(value)], true);
  },
  masquage_modules_secondaires: (config, value) => {
    config.ongletsMasques = addUnique(config.ongletsMasques ?? [], asStringArray(value));
  },
};

function applyOverrides(
  defaultCabinetInterface: BundleDefinition["defaultConfig"],
  decision: ConsultationDecision,
): BundleDefinition["defaultConfig"] {
  const out = deepClone(defaultCabinetInterface);
  for (const ov of decision.validatedOverrides) {
    const handler = OVERRIDE_HANDLERS[ov.key];
    if (handler) {
      handler(out, ov.value);
      continue;
    }

    if (ov.key.includes(".")) {
      setAtPath(out as Record<string, unknown>, ov.key.split("."), ov.value);
      continue;
    }

    (out as Record<string, unknown>)[ov.key] = ov.value;
  }
  return out;
}

function buildSeedPlan(bundle: BundleDefinition): CabinetConfigurationPackage["seedPlan"] {
  return bundle.activationPack.seeds.map((seedId, idx) => ({
    seedId,
    order: idx + 1,
    args: SEED_EXECUTION_CATALOG[seedId]?.args,
  }));
}

function buildActivationChecklist(
  bundle: BundleDefinition,
  decision: ConsultationDecision,
): CabinetConfigurationPackage["activationChecklist"] {
  const fromBundle = bundle.activationPack.criticalUserJourneys.map((id) => ({
    id: `journey-${id}`,
    label: `Vérifier le parcours critique: ${id}`,
    priority: "high" as ActivationPriority,
  }));
  const fromDocs = bundle.activationPack.requiredDocuments.map((id) => ({
    id: `doc-${id}`,
    label: `Préparer document: ${id}`,
    priority: "medium" as ActivationPriority,
  }));
  const fromDecision = decision.activationPriorities.map((p, idx) => ({
    id: `priority-${idx + 1}-${p}`,
    label: `Priorité d'activation: ${p}`,
    priority: "critical" as ActivationPriority,
  }));
  return [...fromDecision, ...fromBundle, ...fromDocs];
}

function buildIntegrationRequirements(
  bundle: BundleDefinition,
  decision: ConsultationDecision,
): CabinetConfigurationPackage["integrationRequirements"] {
  const required = new Set([
    ...bundle.activationPack.requiredIntegrations,
    ...decision.blockingIntegrations,
  ]);
  return Array.from(required).map((id) => ({
    integrationId: id,
    required: true,
    reason: reasonFor(id),
  }));
}

function buildCustomBacklog(
  recommendation: BundleRecommendation,
  decision: ConsultationDecision,
): CabinetConfigurationPackage["customBacklog"] {
  const fromTriggers = recommendation.customTriggers.map((t, idx) => ({
    id: `trigger-${idx + 1}`,
    title: t,
    reason: "Détecté automatiquement par le moteur (doc: AUDIT_TO_BUNDLE_MAPPING.md).",
    priority: "medium" as ActivationPriority,
  }));
  const fromDecision = decision.customItems.map((c) => ({
    id: c.id,
    title: c.title,
    reason: c.reason,
    priority: c.priority,
  }));
  return [...fromTriggers, ...fromDecision];
}

interface GenerateInput {
  snapshot: AuditSnapshot;
  bundle: BundleDefinition;
  recommendation: BundleRecommendation;
  decision: ConsultationDecision;
  configVersion?: number;
  generatedAt?: string;
}

export function generateConfigurationPackage(input: GenerateInput): CabinetConfigurationPackage {
  const { snapshot, bundle, recommendation, decision } = input;

  const cabinetInterfaceConfig = applyOverrides(bundle.defaultConfig, decision);

  return {
    bundleId: bundle.bundleId,
    bundleVersion: bundle.version,
    configVersion: input.configVersion ?? 1,
    generatedAt: input.generatedAt ?? new Date().toISOString(),
    generatedFromAuditId: snapshot.auditId,
    cabinetInterfaceConfig,
    cabinetConfig: { ...DEFAULT_CABINET_CONFIG, ...(bundle.defaultConfig.cabinetConfig ?? {}) },
    seedPlan: buildSeedPlan(bundle),
    activationChecklist: buildActivationChecklist(bundle, decision),
    integrationRequirements: buildIntegrationRequirements(bundle, decision),
    customBacklog: buildCustomBacklog(recommendation, decision),
  };
}

/**
 * Décision par défaut: on accepte tous les overrides recommandés sans
 * valeur custom, sans rejets, sans customItems supplémentaires (les
 * customTriggers du moteur passent automatiquement dans le backlog).
 *
 * À remplacer par une vraie ConsultationDecision dès qu'on a une UI
 * de consultation phase 2.
 */
export function defaultConsultationDecision(
  recommendation: BundleRecommendation,
): ConsultationDecision {
  return {
    bundleId: recommendation.bundleId,
    validatedOverrides: [],
    rejectedOverrides: [],
    customItems: [],
    activationPriorities: [],
    blockingIntegrations: [],
  };
}
