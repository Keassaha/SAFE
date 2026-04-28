/**
 * SAFE — Dérivation des profils canoniques à partir des réponses brutes de l'audit.
 *
 * Source mappage: docs/audit/AUDIT_SCHEMA_CANONIQUE.md.
 * Lis lib/audit-gratuit/questions.ts pour la forme exacte des réponses.
 *
 * Hypothèse documentée: le champ `domaines_pratique` est un texte libre. On
 * extrait les disciplines via des mots-clés FR/EN. Quand le moteur évoluera,
 * on pourra remplacer ce parser par des cases à cocher structurées.
 */

import type { AuditSnapshot, DerivedAuditProfiles } from "./types";

export type Province =
  | "QC" | "ON" | "AB" | "BC" | "MB" | "NB" | "NS" | "PE" | "NL" | "SK" | "YT" | "NT" | "NU";

export type Discipline =
  | "famille" | "immobilier" | "immigration" | "affaires"
  | "travail" | "criminel" | "civil" | "successions" | "generaliste";

export type BillingPrimary = "horaire" | "forfait" | "mixte" | "commission";
export type TeamSizeBand = "1" | "2" | "3plus";
export type PracticeMixType = "single_specialty" | "dual_specialty" | "hybrid_multi_practice";
export type BillingComplexityLevel = "simple_hourly" | "simple_flat_fee" | "mixed_standard" | "advanced_custom";
export type DelegationLevel = "none" | "low" | "medium" | "high";
export type AdminLoadLevel = "low" | "medium" | "high";
export type MigrationComplexity = "low" | "medium" | "high";
export type TrustRegime = "b1r5-qc" | "bylaw9-lso" | "other-province" | "none";

const DISCIPLINE_KEYWORDS: Array<{ discipline: Discipline; patterns: RegExp[] }> = [
  { discipline: "immobilier",  patterns: [/immobilier/i, /real\s*estate/i, /achat\s*-\s*vente/i, /condo/i] },
  { discipline: "immigration", patterns: [/immigration/i, /ircc/i, /express\s*entry/i, /visa/i, /parrainage/i] },
  { discipline: "famille",     patterns: [/famill/i, /divorce/i, /garde/i, /pension\s*aliment/i, /family/i] },
  { discipline: "affaires",    patterns: [/affaires?/i, /business/i, /corporat/i, /pme/i, /commercial/i, /contrats?/i, /soci[ée]t[ée]s?/i] },
  { discipline: "travail",     patterns: [/travail/i, /employment/i, /labour/i, /labor/i, /rh\b/i] },
  { discipline: "criminel",    patterns: [/criminel/i, /criminal/i, /penal/i] },
  { discipline: "civil",       patterns: [/civil/i, /litige/i, /litigation/i] },
  { discipline: "successions", patterns: [/succession/i, /testament/i, /estate(?!.*real)/i, /probate/i, /mandat/i] },
];

function pickProvince(answers: Record<string, unknown>): Province {
  const loc = answers.localisation as { province?: string } | undefined;
  const p = String(loc?.province || "QC").toUpperCase() as Province;
  return p;
}

function pickLocale(province: Province, langues: unknown): "fr" | "en" {
  const arr = Array.isArray(langues) ? langues.map(String) : [];
  const onlyEn = arr.length > 0 && arr.every((v) => v === "en");
  if (onlyEn) return "en";
  if (province === "ON" && !arr.includes("fr")) return "en";
  return "fr";
}

function parseDisciplines(text: string): { primary: Discipline[]; secondary: Discipline[] } {
  const found: Discipline[] = [];
  for (const { discipline, patterns } of DISCIPLINE_KEYWORDS) {
    if (patterns.some((re) => re.test(text))) found.push(discipline);
  }
  if (found.length === 0) return { primary: ["generaliste"], secondary: [] };
  return { primary: found.slice(0, 2), secondary: found.slice(2) };
}

function practiceMixType(primary: Discipline[], secondary: Discipline[]): PracticeMixType {
  const total = primary.length + secondary.length;
  if (total >= 3) return "hybrid_multi_practice";
  if (total === 2) return "dual_specialty";
  return "single_specialty";
}

function billingComplexity(primary: BillingPrimary, hasSecondary: boolean): BillingComplexityLevel {
  if (primary === "commission") return "advanced_custom";
  if (primary === "mixte" || hasSecondary) return "mixed_standard";
  if (primary === "forfait") return "simple_flat_fee";
  return "simple_hourly";
}

function delegationLevel(answers: Record<string, unknown>): DelegationLevel {
  const adjoint = String(answers.adjoint_statut || "");
  const compt = String(answers.comptable_statut || "");
  const others = Array.isArray(answers.autres_roles) ? answers.autres_roles.map(String) : [];
  const hasAdjoint = ["tp", "pt", "partage"].includes(adjoint);
  const hasComptable = ["int_tp", "int_pt", "externe"].includes(compt);
  const hasOthers = others.some((v) => v !== "aucun");
  const score = (hasAdjoint ? 1 : 0) + (hasComptable ? 1 : 0) + (hasOthers ? 1 : 0);
  if (score >= 3) return "high";
  if (score === 2) return "medium";
  if (score === 1) return "low";
  return "none";
}

function adminLoadLevel(v: unknown): AdminLoadLevel {
  switch (String(v)) {
    case "lt2": return "low";
    case "2_5": return "low";
    case "6_10": return "medium";
    case "gt10": return "high";
    default: return "medium";
  }
}

function trustRegime(province: Province, fideUsage: string): TrustRegime {
  const active = ["actif", "peu", "bientot"].includes(fideUsage);
  if (!active) return "none";
  if (province === "QC") return "b1r5-qc";
  if (province === "ON") return "bylaw9-lso";
  return "other-province";
}

function migrationComplexity(answers: Record<string, unknown>): MigrationComplexity {
  const soft = String(answers.logiciel_actuel || "");
  const cases = String(answers.dossiers_actifs || "");
  if (soft === "aucun" || soft === "" || soft.startsWith("other:")) return "low";
  if (["pclaw", "jurisevolution", "clio", "jurisconcept"].includes(soft)) {
    if (cases === "76_150" || cases === "gt150") return "high";
    return "medium";
  }
  return "medium";
}

function teamSizeBand(v: unknown): TeamSizeBand {
  const s = String(v || "1");
  if (s === "2") return "2";
  if (s === "3plus") return "3plus";
  return "1";
}

export function deriveAuditProfiles(answers: Record<string, unknown>): DerivedAuditProfiles {
  const province = pickProvince(answers);
  const langues = answers.langues;
  const locale = pickLocale(province, langues);
  const teamSize = teamSizeBand(answers.nb_utilisateurs);
  const billingPrimary = (String(answers.mode_facturation || "horaire") as BillingPrimary);
  const fideUsage = String(answers.fideicommis_usage || "non");
  const aideJur = String(answers.aide_juridique || "non");
  const tx = String(answers.domaines_pratique || "");
  const { primary: practicesPrimary, secondary: practicesSecondary } = parseDisciplines(tx);
  const mixType = practiceMixType(practicesPrimary, practicesSecondary);
  const billingComplex = billingComplexity(billingPrimary, mixType !== "single_specialty");

  const cabinetProfile = {
    jurisdictionPrimary: province,
    teamSizeBand: teamSize,
    localeDefault: locale,
    growthStage: String(answers.evolution || "stable"),
    formeJuridique: String(answers.forme_juridique || ""),
  };

  const practiceProfile = {
    primaryPractices: practicesPrimary,
    secondaryPractices: practicesSecondary,
    practiceMixType: mixType,
    clientMix: String(answers.type_clientele || "particuliers"),
    languages: Array.isArray(langues) ? langues.map(String) : [],
    casesActiveBand: String(answers.dossiers_actifs || "lt10"),
    newCasesBand: String(answers.nouveaux_mois || "lt5"),
  };

  const billingProfile = {
    billingPrimary,
    billingSecondary: null as string | null,
    billingComplexityLevel: billingComplex,
    hourlyRateBand: String(answers.taux_horaire || ""),
    delaiPaiement: String(answers.delai_paiement || "inconnu"),
  };

  const complianceProfile = {
    trustRequired: ["actif", "peu", "bientot"].includes(fideUsage),
    trustUsage: fideUsage,
    trustRegime: trustRegime(province, fideUsage),
    privacyRegime: province === "QC" ? "loi25" : "pipeda",
    aideJuridique: aideJur,
    specialRegimes: [
      ...(practicesPrimary.includes("immobilier") && province === "ON" ? ["fintrac"] : []),
      ...(practicesPrimary.includes("immigration") ? ["pipeda-immigration"] : []),
    ] as string[],
  };

  const operationsProfile = {
    adminLoadLevel: adminLoadLevel(answers.heures_admin),
    delegationLevel: delegationLevel(answers),
    primaryOperator: String(answers.utilisateur_principal || "moi"),
    arVisibilityLevel: String(answers.visibilite_creances || "manuel"),
    automationDream: String(answers.automatisation_reve || ""),
  };

  const migrationProfile = {
    incumbentStack: String(answers.logiciel_actuel || ""),
    satisfactionScore: Number(answers.satisfaction || 0),
    migrationComplexity: migrationComplexity(answers),
    urgencyLevel: String(answers.urgence || "info"),
  };

  return {
    cabinetProfile,
    practiceProfile,
    billingProfile,
    complianceProfile,
    operationsProfile,
    migrationProfile,
  };
}

export function buildAuditSnapshot(
  answers: Record<string, unknown>,
  source = "audit_gratuit_v2",
  auditId?: string,
): AuditSnapshot {
  return {
    auditId,
    source,
    answers,
    profiles: deriveAuditProfiles(answers),
  };
}
