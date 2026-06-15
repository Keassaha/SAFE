/**
 * Profil comptable du cabinet (doctrine §10 + SOP §4-5). Module PUR.
 *
 * À partir des réponses du questionnaire d'onboarding comptable, dérive le profil
 * A/B/C/D et les drapeaux d'activation conditionnelle des modules. Objectif : ne
 * montrer que ce qui est pertinent et activer les bons contrôles selon le cabinet.
 */

export type CabinetSize = "solo" | "2_5" | "6_plus";
export type BillingMethod = "horaire" | "forfait" | "mixte" | "contingence";
export type TaxFrequency = "mensuelle" | "trimestrielle" | "annuelle";
export type AccountingSoftware = "quickbooks" | "xero" | "sage" | "autre" | "aucun";
export type ComplexityLevel = "simplifie" | "standard" | "avance";
export type ExportFormat = "quickbooks" | "xero" | "sage" | "generic";

/** Réponses du questionnaire d'onboarding comptable (SOP §4). */
export interface AccountingProfileInput {
  province: string; // "QC" | "ON" | ...
  taille: CabinetSize;
  fideicommisPresent: boolean;
  fideicommisActif: boolean;
  methodeFacturation: BillingMethod;
  inscritTpsTvq: boolean;
  frequenceTaxes: TaxFrequency | null;
  comptableExterne: boolean;
  logicielComptable: AccountingSoftware;
  besoinExportMensuel: boolean;
  besoinRapprochement: boolean;
  niveau?: ComplexityLevel; // optionnel : dérivé si absent
}

export type AccountingProfile = "A" | "B" | "C" | "D";

export interface AccountingProfileFeatures {
  /** Afficher le module fidéicommis. */
  trustModule: boolean;
  /** Le fidéicommis est utilisé activement. */
  trustActive: boolean;
  /** Rapprochement mensuel exigé. */
  reconciliationRequired: boolean;
  /** Rôles & permissions (saisie adjoint / validation avocat). */
  roles: boolean;
  /** Catégories comptables avancées. */
  advancedCategories: boolean;
  /** Multi-utilisateurs. */
  multiUser: boolean;
  /** Export mensuel attendu. */
  monthlyExport: boolean;
  /** Format d'export par défaut, déduit du logiciel du comptable. */
  exportFormat: ExportFormat;
}

export interface AccountingProfileConfig {
  profil: AccountingProfile;
  niveau: ComplexityLevel;
  features: AccountingProfileFeatures;
}

function softwareToExportFormat(s: AccountingSoftware): ExportFormat {
  if (s === "quickbooks" || s === "xero" || s === "sage") return s;
  return "generic";
}

/**
 * Dérive le profil A/B/C/D et les drapeaux d'activation.
 *   A — solo sans fidéicommis actif
 *   B — solo avec fidéicommis
 *   C — petit cabinet (2-5) avec personnel administratif
 *   D — cabinet plus structuré (6+)
 */
export function deriveAccountingProfile(input: AccountingProfileInput): AccountingProfileConfig {
  let profil: AccountingProfile;
  if (input.taille === "6_plus") profil = "D";
  else if (input.taille === "2_5") profil = "C";
  else profil = input.fideicommisActif ? "B" : "A";

  const niveau: ComplexityLevel =
    input.niveau ?? (profil === "D" ? "avance" : profil === "A" ? "simplifie" : "standard");

  const isStructured = profil === "C" || profil === "D";

  const features: AccountingProfileFeatures = {
    trustModule: input.fideicommisPresent,
    trustActive: input.fideicommisActif,
    // Le rapprochement n'a de sens que si le fidéicommis est actif. Il est alors
    // exigé si le cabinet le demande, ou d'office pour les cabinets structurés.
    reconciliationRequired:
      input.fideicommisActif && (input.besoinRapprochement || isStructured),
    roles: isStructured,
    advancedCategories: profil === "D",
    multiUser: isStructured,
    monthlyExport: input.besoinExportMensuel || input.comptableExterne,
    exportFormat: softwareToExportFormat(input.logicielComptable),
  };

  return { profil, niveau, features };
}
