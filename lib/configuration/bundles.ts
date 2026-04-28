/**
 * SAFE — Bibliothèque de bundles standards.
 *
 * Source: docs/bundles/SAFE_BUNDLE_LIBRARY.md (2026-04-28).
 * Tout ajout/modif d'un bundle doit refléter ce document.
 */

import type { BundleDefinition } from "./types";

export const BUNDLES: BundleDefinition[] = [
  {
    bundleId: "on-solo-real-estate-immigration-flat-fee",
    label: "Solo ON — Real Estate + Immigration — Flat Fee",
    version: 1,
    status: "active",
    targetProfile: {
      provinces: ["ON"],
      teamSize: ["1", "2"],
      practices: ["immobilier", "immigration"],
      billingModels: ["forfait"],
    },
    eligibilityRules: {
      required: [
        "province=ON",
        "billingPrimary=forfait",
        "practices includes one of [immobilier, immigration]",
      ],
      preferred: ["trustRequired=true", "locale=en"],
      excluded: ["multi-office", "billing contingency"],
    },
    defaultConfig: {
      locale: "en",
      ongletsActifs: [
        "tableau-de-bord", "clients", "dossiers", "facturation",
        "comptes", "documents", "conformite", "parametres",
      ],
      ongletsMasques: ["temps", "fiches-de-temps", "employees", "rapports-comptables"],
      disciplines: ["immobilier", "immigration"],
      modeFacturation: { principal: "forfait" },
      modules: {
        facturation: {
          principal: "forfait",
          periodeFact: "bimonthly",
          joursRelance: 60,
          taxes: { mode: "hst", taux: 13 },
        },
        fideicommis: { regle: "bylaw9-lso", interets: "LFO", reconciliation: "mensuelle" },
        fintrac: { actif: true, typesDossiers: ["immobilier"] },
        pipeda: { actif: true, retention: { immobilier: 10, immigration: 7 } },
      },
      conformite: { verif_conflits: true, lso_ontario: true, fintrac: true, pipeda: true },
    },
    activationPack: {
      seeds: [
        "seed-immobilier-on",
        "seed-immigration",
        "seed-retention-on",
        "seed-email-templates-en",
        "seed-trust-reconciliation",
      ],
      requiredDocuments: ["retainer-template", "fintrac-id-form", "title-insurance-checklist"],
      requiredIntegrations: ["resend", "stripe-or-interac"],
      criticalUserJourneys: ["trust-reconciliation", "fintrac-id-verification", "ircc-deadline-tracking"],
    },
    allowedOverrides: [
      "reminder_days",
      "accepted_payment_methods",
      "dashboard_widgets",
      "real_estate_subtypes",
      "locale_secondary_fr",
    ],
    customTriggers: [
      "multi-office",
      "billing mixte complexe par dossier",
      "workflow Teraview ou IRCC trop spécifique",
    ],
  },

  {
    bundleId: "qc-solo-family-flat-fee",
    label: "Solo QC — Famille — Forfait",
    version: 1,
    status: "active",
    targetProfile: {
      provinces: ["QC"],
      teamSize: ["1", "2"],
      practices: ["famille"],
      billingModels: ["forfait"],
    },
    eligibilityRules: {
      required: [
        "province=QC",
        "billingPrimary=forfait",
        "practices includes famille",
      ],
      preferred: ["trustRequired=true", "locale=fr"],
      excluded: ["aide juridique dominante", "litige complexe hybride"],
    },
    defaultConfig: {
      locale: "fr",
      ongletsActifs: [
        "tableau-de-bord", "clients", "dossiers", "facturation",
        "documents", "conformite", "parametres",
      ],
      ongletsMasques: ["employees"],
      disciplines: ["famille"],
      modeFacturation: { principal: "forfait" },
      modules: {
        facturation: { principal: "forfait", periodeFact: "monthly", joursRelance: 30 },
        fideicommis: { regle: "b1r5-qc", reconciliation: "mensuelle" },
        loi25: { actif: true },
      },
      conformite: { verif_conflits: true, loi25: true },
    },
    activationPack: {
      seeds: [
        "seed-checklists-famille-qc",
        "seed-templates-engagement-qc",
        "seed-retention-famille-qc",
      ],
      requiredDocuments: ["mandat-engagement-fr", "checklist-cloture-famille"],
      requiredIntegrations: ["resend"],
      criticalUserJourneys: ["ouverture-dossier-famille", "facture-forfait", "cloture-dossier"],
    },
    allowedOverrides: [
      "show_internal_time",
      "prepayment_amount",
      "step_granularity",
      "reminder_days",
    ],
    customTriggers: [
      "aide juridique dominante",
      "forte part de litige complexe avec facturation hybride",
    ],
  },

  {
    bundleId: "qc-small-business-hourly",
    label: "Petit cabinet QC — Affaires — Horaire",
    version: 1,
    status: "active",
    targetProfile: {
      provinces: ["QC"],
      teamSize: ["1", "2", "3plus"],
      practices: ["affaires"],
      billingModels: ["horaire"],
    },
    eligibilityRules: {
      required: [
        "province=QC",
        "billingPrimary=horaire",
        "practices includes one of [affaires, corporatif]",
      ],
      preferred: ["timeTrackingNeeded=true"],
      excluded: ["retainer mensuel structuré", "success fee dominant"],
    },
    defaultConfig: {
      locale: "fr",
      ongletsActifs: [
        "tableau-de-bord", "clients", "dossiers", "temps", "facturation",
        "documents", "rapports", "parametres",
      ],
      ongletsMasques: [],
      disciplines: ["affaires"],
      modeFacturation: { principal: "horaire" },
      modules: {
        facturation: { principal: "horaire", periodeFact: "monthly", joursRelance: 30 },
        timeTracking: { actif: true, granularite: "0.1h" },
        loi25: { actif: true },
      },
      conformite: { verif_conflits: true, loi25: true },
    },
    activationPack: {
      seeds: [
        "seed-taux-horaires-par-avocat",
        "seed-templates-facture-horaire",
        "seed-rapports-revenus",
      ],
      requiredDocuments: ["mandat-horaire-fr", "engagement-affaires"],
      requiredIntegrations: ["resend"],
      criticalUserJourneys: ["saisie-temps", "facture-horaire-mensuelle", "rapport-revenus"],
    },
    allowedOverrides: [
      "plafond_par_dossier",
      "remises_client",
      "niveau_detail_facture",
      "reminder_days",
    ],
    customTriggers: [
      "retainer mensuel structuré",
      "success fee",
      "revenue recognition avancée",
    ],
  },

  {
    bundleId: "qc-hybrid-multi-practice-small-firm",
    label: "Petit cabinet QC — Multi-pratique — Hybride",
    version: 1,
    status: "active",
    targetProfile: {
      provinces: ["QC"],
      teamSize: ["2", "3plus"],
      practices: ["famille", "affaires", "travail"],
      billingModels: ["mixte"],
    },
    eligibilityRules: {
      required: [
        "province=QC",
        "billingPrimary in [mixte, horaire, forfait]",
        "practices count >= 2",
      ],
      preferred: ["delegationLevel>=medium"],
      excluded: ["3+ logiques facturation incompatibles"],
    },
    defaultConfig: {
      locale: "fr",
      ongletsActifs: [
        "tableau-de-bord", "clients", "dossiers", "temps", "facturation",
        "documents", "rapports", "parametres",
      ],
      ongletsMasques: [],
      disciplines: ["famille", "affaires", "travail"],
      modeFacturation: { principal: "mixte", taggingDomaineParDossier: true },
      modules: {
        facturation: { principal: "mixte", periodeFact: "monthly", joursRelance: 30 },
        timeTracking: { actif: true, granularite: "0.1h" },
        loi25: { actif: true },
      },
      conformite: { verif_conflits: true, loi25: true },
    },
    activationPack: {
      seeds: [
        "seed-regles-facturation-par-domaine",
        "seed-tagging-domaine-dossier",
        "seed-rapports-par-domaine",
        "seed-templates-multi-pratique",
      ],
      requiredDocuments: ["mandat-multi-pratique-fr"],
      requiredIntegrations: ["resend"],
      criticalUserJourneys: ["tagging-domaine", "facture-mixte", "rapport-par-domaine"],
    },
    allowedOverrides: [
      "ajout_domaine",
      "retrait_domaine",
      "widgets_par_domaine",
      "permissions_assistant",
    ],
    customTriggers: [
      "plus de 3 logiques de facturation incompatibles",
      "governance multi-équipes très différenciée",
      "workflow inter-domaine non supporté",
    ],
  },

  {
    bundleId: "on-immigration-boutique-stage-billing",
    label: "Boutique ON — Immigration — Stage Billing",
    version: 1,
    status: "active",
    targetProfile: {
      provinces: ["ON"],
      teamSize: ["1", "2", "3plus"],
      practices: ["immigration"],
      billingModels: ["forfait"],
    },
    eligibilityRules: {
      required: [
        "province=ON",
        "practices=[immigration]",
        "billingPrimary=forfait",
      ],
      preferred: ["stageBilling=true"],
      excluded: ["dependance forte plateforme tierce"],
    },
    defaultConfig: {
      locale: "en",
      ongletsActifs: [
        "tableau-de-bord", "clients", "dossiers", "facturation",
        "documents", "conformite", "parametres",
      ],
      ongletsMasques: ["temps", "fiches-de-temps"],
      disciplines: ["immigration"],
      modeFacturation: { principal: "forfait", stageBilling: true },
      modules: {
        facturation: { principal: "forfait", stageBilling: true, periodeFact: "stage" },
        pipeda: { actif: true, retention: { immigration: 7 } },
      },
      conformite: { verif_conflits: true, pipeda: true },
    },
    activationPack: {
      seeds: [
        "seed-checklists-immigration",
        "seed-templates-mandat-immigration",
        "seed-suivi-expirations-documents",
      ],
      requiredDocuments: ["retainer-immigration-en", "imm5476-template"],
      requiredIntegrations: ["resend"],
      criticalUserJourneys: ["stage-billing", "ircc-deadline-tracking", "document-expiry-alerts"],
    },
    allowedOverrides: [
      "locale_fr",
      "types_dossiers_immigration_actifs",
      "reminder_days",
    ],
    customTriggers: [
      "forte dépendance à des plateformes externes spécialisées",
      "billing conditionnel complexe par programme",
    ],
  },

  {
    bundleId: "qc-generalist-foundation-hourly",
    label: "Cabinet QC — Généraliste — Fondation horaire",
    version: 1,
    status: "active",
    targetProfile: {
      provinces: ["QC"],
      teamSize: ["1", "2"],
      practices: ["generaliste"],
      billingModels: ["horaire"],
    },
    eligibilityRules: {
      required: [
        "province=QC",
        "billingPrimary in [horaire, forfait, mixte]",
      ],
      preferred: ["toolingMaturity=low"],
      excluded: ["heterogenicity tres forte", "reporting avance"],
    },
    defaultConfig: {
      locale: "fr",
      ongletsActifs: [
        "tableau-de-bord", "clients", "dossiers", "temps", "facturation",
        "documents", "parametres",
      ],
      ongletsMasques: ["rapports-avances"],
      disciplines: ["generaliste"],
      modeFacturation: { principal: "horaire" },
      modules: {
        facturation: { principal: "horaire", periodeFact: "monthly", joursRelance: 30 },
        timeTracking: { actif: true },
        loi25: { actif: true },
      },
      conformite: { verif_conflits: true, loi25: true },
    },
    activationPack: {
      seeds: [
        "seed-base-clients-dossiers-temps-factures",
        "seed-templates-generiques",
      ],
      requiredDocuments: ["mandat-generaliste-fr"],
      requiredIntegrations: ["resend"],
      criticalUserJourneys: ["ouverture-dossier", "facture-horaire", "suivi-creances"],
    },
    allowedOverrides: [
      "specialisation_progressive",
      "ajout_module_conformite",
      "masquage_modules_secondaires",
    ],
    customTriggers: [
      "hétérogénéité tres forte des pratiques",
      "attentes avancées de reporting ou fiducie",
    ],
  },
];

export function getBundleById(bundleId: string): BundleDefinition | undefined {
  return BUNDLES.find((b) => b.bundleId === bundleId);
}
