/**
 * SAFE — Bibliothèque de capacités composables.
 *
 * Les bundles donnent un point de départ cohérent. Les capacités sont les blocs
 * métier granulaires que SAFE assemble selon l'audit, les risques et les
 * priorités du cabinet.
 */

import type {
  ActivationPriority,
  AuditSnapshot,
  CapabilityBlockDefinition,
  CapabilitySelection,
} from "./types";

export const CAPABILITY_LIBRARY: CapabilityBlockDefinition[] = [
  {
    capabilityId: "matter-opening-control",
    label: "Ouverture de dossier contrôlée",
    category: "dossiers",
    description: "Création de dossier, client, équipe, mandat, conflits et état de préparation.",
    when: {
      required: ["all"],
      preferred: ["toolingMaturity=low", "missingMandateRisk=true"],
    },
    config: {
      ongletsActifs: ["dossiers", "clients"],
      modules: {
        dossiers: { ouvertureControlee: true, preparationStatus: true },
      },
      conformite: { verif_conflits: true },
    },
    activationItems: [
      { id: "matter-intake-checklist", label: "Valider la checklist d'ouverture de dossier", priority: "high" },
      { id: "conflict-check-workflow", label: "Activer le workflow de vérification des conflits", priority: "high" },
    ],
    seeds: ["seed-templates-generiques"],
  },
  {
    capabilityId: "trust-3way-reconciliation",
    label: "Fidéicommis et conciliation 3-way",
    category: "fideicommis",
    description: "Dépôts, retraits, solde par client/dossier, rapprochement mensuel et certification.",
    when: {
      required: ["trustRequired=true"],
      preferred: ["trustRisk=high", "inspectionStress=true"],
    },
    config: {
      ongletsActifs: ["comptes"],
      modules: {
        fideicommis: { actif: true, reconciliation: "mensuelle", segregationParClient: true },
      },
    },
    activationItems: [
      { id: "trust-opening-balances", label: "Importer les soldes fidéicommis par client/dossier", priority: "critical" },
      { id: "trust-monthly-reconciliation", label: "Effectuer la première conciliation mensuelle", priority: "critical" },
      { id: "trust-report-validation", label: "Valider le rapport de conformité fidéicommis", priority: "high" },
    ],
    seeds: ["seed-trust-reconciliation"],
  },
  {
    capabilityId: "loi25-privacy-controls",
    label: "Conformité Loi 25",
    category: "conformite",
    description: "Responsable PRP, consentements, conservation, incidents et sécurité des renseignements.",
    when: {
      required: ["privacyRegime=loi25"],
      preferred: ["privacyRisk=high"],
    },
    config: {
      ongletsActifs: ["conformite", "parametres"],
      modules: {
        loi25: { actif: true, responsablePrp: true, registreIncidents: true },
      },
      conformite: { loi25: true },
    },
    activationItems: [
      { id: "loi25-owner", label: "Désigner le responsable de la protection des renseignements", priority: "critical" },
      { id: "loi25-retention-policy", label: "Configurer les politiques de conservation documentaire", priority: "high" },
      { id: "loi25-incident-register", label: "Valider le registre d'incidents et le processus interne", priority: "medium" },
    ],
    seeds: ["seed-retention-qc"],
  },
  {
    capabilityId: "billing-ar-followup",
    label: "Facturation et recouvrement",
    category: "facturation",
    description: "Factures, paiements, balances dues, retards, relances et suivi des comptes à recevoir.",
    when: {
      required: ["billingPrimary in [horaire, forfait, mixte]"],
      preferred: ["paymentDelayRisk=medium", "paymentDelayRisk=high"],
    },
    config: {
      ongletsActifs: ["facturation"],
      modules: {
        facturation: { actif: true, relances: true, suiviCreances: true },
      },
    },
    activationItems: [
      { id: "billing-rules", label: "Valider les règles de facturation et d'échéance", priority: "high" },
      { id: "ar-followup", label: "Configurer les relances et le suivi des comptes à recevoir", priority: "high" },
    ],
    seeds: ["seed-templates-facture-horaire"],
  },
  {
    capabilityId: "admin-automation-dashboard",
    label: "Tableau de bord opérations",
    category: "operations",
    description: "Priorités, tâches, alertes, préparation à la revue et visibilité quotidienne.",
    when: {
      required: ["adminLoadLevel=high"],
      preferred: ["automationPriority=true", "primaryOperator=assistant"],
    },
    config: {
      ongletsActifs: ["tableau-de-bord", "gestion"],
      widgets: ["ready-for-review", "billing-follow-up", "tasks-and-appointments"],
      modules: {
        operations: { assistantQueue: true, alerts: true },
      },
    },
    activationItems: [
      { id: "dashboard-widgets", label: "Choisir les widgets de pilotage quotidien", priority: "medium" },
      { id: "assistant-queue", label: "Valider la file de travail assistante et les alertes", priority: "medium" },
    ],
    seeds: [],
  },
  {
    capabilityId: "executive-firm-command-center",
    label: "Centre de commandement cabinet",
    category: "operations",
    description: "Interface de pilotage qui donne à un cabinet solo le confort d'un cabinet structuré: priorités, risques, production, finances et dossiers à revoir.",
    when: {
      required: ["premiumStructureExpectation=true"],
      preferred: ["adminLoadLevel=medium", "adminLoadLevel=high", "automationPriority=dashboard"],
    },
    config: {
      ongletsActifs: ["tableau-de-bord", "gestion", "rapports"],
      widgets: [
        "firm-health",
        "priority-matters",
        "ready-for-review",
        "billing-follow-up",
        "compliance-risk",
      ],
      modules: {
        commandCenter: {
          actif: true,
          executiveDashboard: true,
          riskRadar: true,
          dailyBrief: true,
        },
      },
    },
    activationItems: [
      { id: "command-center-kpis", label: "Définir les indicateurs de pilotage du cabinet", priority: "high" },
      { id: "daily-brief-rules", label: "Configurer le brief quotidien et les priorités visibles", priority: "high" },
      { id: "risk-radar", label: "Valider les alertes de risque: échéances, conformité, comptes à recevoir", priority: "high" },
    ],
    seeds: [],
  },
  {
    capabilityId: "legal-calendar-event-planner",
    label: "Planificateur juridique",
    category: "operations",
    description: "Agenda intelligent pour rendez-vous, audiences, échéances, relances, tâches et préparation hebdomadaire.",
    when: {
      required: ["eventPlanningExpectation=true"],
      preferred: ["deadlinesImportant=true", "automationPriority=agenda", "automationPriority=assistant"],
    },
    config: {
      ongletsActifs: ["gestion"],
      widgets: ["tasks-and-appointments", "deadline-calendar", "weekly-plan"],
      modules: {
        calendar: {
          actif: true,
          legalDeadlines: true,
          weeklyPlanning: true,
          clientFollowups: true,
          reminders: true,
        },
      },
    },
    activationItems: [
      { id: "calendar-sources", label: "Centraliser les rendez-vous, audiences et échéances existantes", priority: "high" },
      { id: "weekly-planning-ritual", label: "Configurer le rituel de planification hebdomadaire", priority: "high" },
      { id: "followup-rules", label: "Définir les règles de relance client et de rappel interne", priority: "medium" },
    ],
    seeds: [],
    dependencies: ["admin-automation-dashboard"],
  },
  {
    capabilityId: "document-retention-library",
    label: "Bibliothèque documentaire et rétention",
    category: "conformite",
    description: "Documents, modèles, conservation par type de document et fermeture de dossier.",
    when: {
      required: ["all"],
      preferred: ["privacyRegime=loi25", "practiceMix=multi"],
    },
    config: {
      ongletsActifs: ["documents", "edition", "parametres"],
      modules: {
        documents: { bibliotheque: true, retention: true, fermetureDossier: true },
      },
    },
    activationItems: [
      { id: "document-types", label: "Lister les types de documents à conserver", priority: "medium" },
      { id: "closure-checklist", label: "Configurer la checklist de fermeture", priority: "medium" },
    ],
    seeds: ["seed-templates-generiques"],
  },
];

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null ? value as Record<string, unknown> : {};
}

function stringValue(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function activationPriority(score: number): ActivationPriority {
  if (score >= 85) return "critical";
  if (score >= 60) return "high";
  if (score >= 35) return "medium";
  return "low";
}

export function selectCapabilities(snapshot: AuditSnapshot): CapabilitySelection[] {
  const practice = asRecord(snapshot.profiles.practiceProfile);
  const billing = asRecord(snapshot.profiles.billingProfile);
  const compliance = asRecord(snapshot.profiles.complianceProfile);
  const operations = asRecord(snapshot.profiles.operationsProfile);

  const trustRequired = Boolean(compliance.trustRequired);
  const privacyRegime = stringValue(compliance.privacyRegime);
  const billingPrimary = stringValue(billing.billingPrimary);
  const paymentDelay = stringValue(billing.delaiPaiement);
  const adminLoad = stringValue(operations.adminLoadLevel);
  const automationDream = stringValue(operations.automationDream);
  const frustrations = Array.isArray(snapshot.answers.frustrations)
    ? snapshot.answers.frustrations.map(String).join(" ")
    : stringValue(snapshot.answers.frustrations);
  const messageLibre = [
    stringValue(snapshot.answers.message),
    stringValue(snapshot.answers.commentaire),
    stringValue(snapshot.answers.objectif),
    stringValue(snapshot.answers.automation_notes),
  ].join(" ");
  const practiceMix = stringValue(practice.practiceMixType);

  const scored = new Map<string, { score: number; reasons: string[] }>();

  function add(capabilityId: string, score: number, reason: string) {
    const current = scored.get(capabilityId) ?? { score: 0, reasons: [] };
    current.score += score;
    current.reasons.push(reason);
    scored.set(capabilityId, current);
  }

  add("matter-opening-control", 50, "Base requise pour structurer clients, dossiers, mandats et conflits.");
  add("document-retention-library", 35, "Base documentaire requise pour la conservation et la fermeture des dossiers.");

  if (trustRequired) {
    add("trust-3way-reconciliation", 90, "Le cabinet utilise ou prévoit utiliser le fidéicommis.");
  }

  if (privacyRegime === "loi25") {
    add("loi25-privacy-controls", 85, "Le cabinet est au Québec et relève de la Loi 25.");
    add("document-retention-library", 25, "La Loi 25 augmente l'importance des politiques de conservation.");
  }

  if (["horaire", "forfait", "mixte"].includes(billingPrimary)) {
    add("billing-ar-followup", 55, `Mode de facturation ${billingPrimary} détecté.`);
  }

  if (["31_60", "60plus", "plus30"].includes(paymentDelay)) {
    add("billing-ar-followup", 30, "Le délai de paiement signale un risque de recouvrement.");
  }

  if (adminLoad === "high") {
    add("admin-automation-dashboard", 70, "La charge administrative est élevée.");
    add("executive-firm-command-center", 45, "La charge administrative justifie une interface de pilotage structurée.");
  } else if (adminLoad === "medium") {
    add("admin-automation-dashboard", 35, "La charge administrative justifie un tableau de bord opérationnel.");
    add("executive-firm-command-center", 35, "La charge administrative justifie une meilleure visibilité de gestion.");
  }

  if (automationDream) {
    add("admin-automation-dashboard", 20, "Une priorité d'automatisation a été exprimée dans l'audit.");
  }

  if (/dashboard|tableau|pilotage|structure|grand cabinet|big firm|20 avocats/i.test(`${automationDream} ${messageLibre}`)) {
    add("executive-firm-command-center", 50, "Le besoin exprimé vise une expérience de cabinet très structuré.");
  }

  if (/agenda|calendrier|planning|planif|event|rendez|échéance|echeance|assistant/i.test(`${automationDream} ${frustrations} ${messageLibre}`)) {
    add("legal-calendar-event-planner", 65, "Le besoin exprimé exige une organisation proactive des rendez-vous, tâches et échéances.");
  }

  if (practiceMix === "hybrid_multi_practice" || practiceMix === "dual_specialty") {
    add("matter-opening-control", 20, "La pratique multi-domaines exige une meilleure standardisation à l'ouverture.");
    add("document-retention-library", 15, "La pratique multi-domaines exige des règles documentaires par type de dossier.");
    add("legal-calendar-event-planner", 20, "La pratique multi-domaines augmente le besoin de planification transversale.");
  }

  return Array.from(scored.entries())
    .map(([capabilityId, value]) => ({
      capabilityId,
      reason: value.reasons.join(" "),
      priority: activationPriority(value.score),
    }))
    .sort((a, b) => {
      const order: Record<ActivationPriority, number> = { critical: 0, high: 1, medium: 2, low: 3 };
      return order[a.priority] - order[b.priority] || a.capabilityId.localeCompare(b.capabilityId);
    });
}

export function getCapabilityById(capabilityId: string): CapabilityBlockDefinition | undefined {
  return CAPABILITY_LIBRARY.find((capability) => capability.capabilityId === capabilityId);
}
