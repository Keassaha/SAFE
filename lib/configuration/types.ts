export type BundleConfidence = "high" | "medium" | "low";

export type ActivationPriority = "critical" | "high" | "medium" | "low";

export interface DerivedAuditProfiles {
  cabinetProfile: Record<string, unknown>;
  practiceProfile: Record<string, unknown>;
  billingProfile: Record<string, unknown>;
  complianceProfile: Record<string, unknown>;
  operationsProfile: Record<string, unknown>;
  migrationProfile: Record<string, unknown>;
}

export interface AuditSnapshot {
  auditId?: string;
  source: string;
  answers: Record<string, unknown>;
  profiles: DerivedAuditProfiles;
}

export interface BundleConfigDefaults {
  locale?: string;
  ongletsActifs?: string[];
  ongletsMasques?: string[];
  disciplines?: string[];
  widgets?: string[];
  modules?: Record<string, unknown>;
  checklistsParType?: Record<string, string[]>;
  modeFacturation?: Record<string, unknown>;
  conformite?: Record<string, unknown>;
  cabinetConfig?: Record<string, unknown>;
}

export interface BundleDefinition {
  bundleId: string;
  label: string;
  version: number;
  status: "active" | "draft" | "deprecated";
  targetProfile: Record<string, unknown>;
  eligibilityRules: {
    required: string[];
    preferred?: string[];
    excluded?: string[];
  };
  defaultConfig: BundleConfigDefaults;
  activationPack: {
    seeds: string[];
    requiredDocuments: string[];
    requiredIntegrations: string[];
    criticalUserJourneys: string[];
  };
  allowedOverrides: string[];
  customTriggers: string[];
}

export interface BundleRecommendation {
  bundleId: string;
  confidence: BundleConfidence;
  why: string[];
  alternativeBundleIds: string[];
  recommendedOverrides: string[];
  customTriggers: string[];
  consultationTopics: string[];
}

export interface ConsultationDecision {
  bundleId: string;
  validatedOverrides: Array<{
    key: string;
    value: unknown;
    reason?: string;
  }>;
  rejectedOverrides: Array<{
    key: string;
    reason: string;
  }>;
  customItems: Array<{
    id: string;
    title: string;
    reason: string;
    priority: ActivationPriority;
  }>;
  activationPriorities: string[];
  blockingIntegrations: string[];
}

export interface CabinetConfigurationPackage {
  bundleId: string;
  bundleVersion: number;
  configVersion: number;
  generatedAt: string;
  generatedFromAuditId?: string;
  cabinetInterfaceConfig: BundleConfigDefaults;
  cabinetConfig: Record<string, unknown>;
  seedPlan: Array<{
    seedId: string;
    order: number;
    args?: string[];
  }>;
  activationChecklist: Array<{
    id: string;
    label: string;
    priority: ActivationPriority;
  }>;
  integrationRequirements: Array<{
    integrationId: string;
    required: boolean;
    reason: string;
  }>;
  customBacklog: Array<{
    id: string;
    title: string;
    reason: string;
    priority: ActivationPriority;
  }>;
}

export interface ConfigurationEngineOutput {
  auditSnapshot: AuditSnapshot;
  bundleRecommendation: BundleRecommendation;
  consultationDecision: ConsultationDecision;
  configurationPackage: CabinetConfigurationPackage;
}
