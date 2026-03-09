/**
 * Taxonomie des types de documents — Droit familial québécois
 * 16 catégories fonctionnelles, 124+ types de documents.
 * Référence : planning/famille-document-generator.md
 */

export type DocumentCategoryCode =
  | "introductory"
  | "responses_interim"
  | "support"
  | "custody_parenting"
  | "property"
  | "settlement_consent"
  | "mediation"
  | "post_judgment"
  | "special_proceedings"
  | "client_admin"
  | "pre_litigation"
  | "tuf"
  | "declarations_affidavits"
  | "international"
  | "court_forms_generic"
  | "psychosocial";

export interface DocumentTypeRecord {
  code: string;
  nameFr: string;
  nameEn: string;
  legalBasis: string;
  standardForm: boolean;
  formRef?: string; // ex. "Formulaire I", "SJ-1326", "Annexe I"
  priority?: "high" | "medium" | "low"; // pour roadmap MVP
}

export interface DocumentCategoryRecord {
  code: DocumentCategoryCode;
  nameFr: string;
  nameEn: string;
  types: DocumentTypeRecord[];
}

export const FAMILLE_DOCUMENT_CATEGORIES: DocumentCategoryRecord[] = [
  {
    code: "introductory",
    nameFr: "Demandes introductives d'instance",
    nameEn: "Introductory proceedings",
    types: [
      { code: "demande_divorce_contestee", nameFr: "Demande en divorce (contestée)", nameEn: "Contested divorce application", legalBasis: "Divorce Act s.8; CPC art. 141, 409", standardForm: true, formRef: "Formulaire I", priority: "high" },
      { code: "demande_conjointe_divorce_accord", nameFr: "Demande conjointe en divorce sur projet d'accord", nameEn: "Joint divorce on draft agreement", legalBasis: "Divorce Act s.8; CPC art. 303", standardForm: true, formRef: "Ministry model", priority: "high" },
      { code: "demande_separation_corps", nameFr: "Demande en séparation de corps", nameEn: "Separation from bed and board", legalBasis: "CCQ art. 493-515", standardForm: false },
      { code: "demande_garde_pa_conjoints_fait", nameFr: "Demande relative à la garde/PA (conjoints de fait)", nameEn: "Custody/support for de facto spouses", legalBasis: "CCQ art. 599, 605", standardForm: true, formRef: "Ministry model" },
      { code: "demande_union_parentale_tuf", nameFr: "Demande relative à l'union parentale (TUF)", nameEn: "Parental union application", legalBasis: "CCQ art. 521.19+; SJ-1326", standardForm: true, formRef: "SJ-1326", priority: "high" },
      { code: "demande_dissolution_union_civile", nameFr: "Demande en dissolution d'union civile", nameEn: "Civil union dissolution", legalBasis: "CCQ art. 521.12-521.19", standardForm: false, priority: "high" },
      { code: "demande_reconventionnelle", nameFr: "Demande reconventionnelle", nameEn: "Cross-application", legalBasis: "CPC art. 172", standardForm: false },
      { code: "demande_nullite_mariage", nameFr: "Demande en nullité de mariage", nameEn: "Marriage annulment", legalBasis: "CCQ art. 380-390", standardForm: false },
    ],
  },
  {
    code: "responses_interim",
    nameFr: "Réponses, mesures provisoires et requêtes",
    nameEn: "Responses, interim measures and procedural motions",
    types: [
      { code: "reponse_standard", nameFr: "Réponse", nameEn: "Answer", legalBasis: "SJ-554A", standardForm: true, formRef: "SJ-554A" },
      { code: "reponse_tuf", nameFr: "Réponse (TUF)", nameEn: "TUF Answer", legalBasis: "SJ-1333", standardForm: true, formRef: "SJ-1333", priority: "high" },
      { code: "defense_au_fond", nameFr: "Défense au fond", nameEn: "Defence on the merits", legalBasis: "CPC", standardForm: false },
      { code: "contestation_ordonnances_sauvegarde", nameFr: "Contestation des ordonnances de sauvegarde", nameEn: "Contestation of safeguard orders", legalBasis: "CPC art. 49, 509", standardForm: false },
      { code: "ordonnance_sauvegarde", nameFr: "Ordonnance de sauvegarde", nameEn: "Safeguard order", legalBasis: "CPC art. 49, 509", standardForm: false, priority: "high" },
      { code: "mesures_provisoires", nameFr: "Mesures provisoires", nameEn: "Interim measures", legalBasis: "CPC art. 409-414", standardForm: false, priority: "high" },
      { code: "ordonnance_protection_civile", nameFr: "Ordonnance de protection civile", nameEn: "Civil protection order", legalBasis: "CPC art. 509-512", standardForm: false },
      { code: "provision_pour_frais", nameFr: "Provision pour frais", nameEn: "Provision for costs", legalBasis: "CCQ art. 502", standardForm: false },
      { code: "usage_exclusif_residence_familiale", nameFr: "Usage exclusif de la résidence familiale", nameEn: "Exclusive use of family residence", legalBasis: "CCQ art. 401, 410", standardForm: false },
    ],
  },
  {
    code: "support",
    nameFr: "Pensions alimentaires et soutien",
    nameEn: "Support-related documents",
    types: [
      { code: "formulaire_annexe_i", nameFr: "Formulaire de fixation des pensions alimentaires pour enfants (Annexe I)", nameEn: "Child support determination form (Annex I)", legalBasis: "Règlement fixation PA enfants", standardForm: true, formRef: "Annexe I", priority: "high" },
      { code: "formulaire_iii", nameFr: "État des revenus, dépenses et bilan (Formulaire III)", nameEn: "Income, expenses and balance sheet (Form III)", legalBasis: "RCSMF", standardForm: true, formRef: "Formulaire III", priority: "high" },
      { code: "declaration_444_cpc", nameFr: "Déclaration assermentée sous art. 444 CPC", nameEn: "Sworn declaration art. 444 CPC", legalBasis: "CPC art. 444", standardForm: false, priority: "medium" },
      { code: "demande_greffier_sj765a", nameFr: "Demande au greffe (SJ-765A)", nameEn: "Application to court clerk (SJ-765A)", legalBasis: "SJ-765A", standardForm: true, formRef: "SJ-765A" },
      { code: "exemption_loi_facilitant_pa", nameFr: "Demande d'exemption (Loi facilitant le paiement des PA)", nameEn: "Exemption request under Loi facilitant le paiement des PA", legalBasis: "Loi facilitant le paiement des pensions alimentaires", standardForm: false },
      { code: "demande_info_parent_introuvable", nameFr: "Demande d'information — parent introuvable", nameEn: "Information request for untraceable parent", legalBasis: "Loi / Règlement PA", standardForm: false },
    ],
  },
  {
    code: "custody_parenting",
    nameFr: "Garde, accès et parentalité",
    nameEn: "Child custody, access and parenting",
    types: [
      { code: "plan_parental", nameFr: "Plan parental", nameEn: "Parenting plan", legalBasis: "Divorce Act s. 7.1-7.5; CCQ art. 605", standardForm: false, priority: "high" },
      { code: "formulaire_iv_consentement", nameFr: "Consentement à l'évaluation psychosociale (Formulaire IV)", nameEn: "Psychosocial assessment consent (Form IV)", legalBasis: "RCSMF", standardForm: true, formRef: "Formulaire IV" },
      { code: "formulaire_v_ordonnance", nameFr: "Ordonnance d'évaluation psychosociale type (Formulaire V)", nameEn: "Standard psychosocial order (Form V)", legalBasis: "RCSMF", standardForm: true, formRef: "Formulaire V" },
      { code: "formulaire_vi_ordonnance_etendue", nameFr: "Ordonnance psychosociale élargie — accès institutionnel (Formulaire VI)", nameEn: "Extended order with institutional access (Form VI)", legalBasis: "RCSMF", standardForm: true, formRef: "Formulaire VI" },
      { code: "avis_superviseurs_acces_annexe_a", nameFr: "Avis aux superviseurs des droits d'accès (Annexe A RCSMF art. 37)", nameEn: "Notice to access rights supervisors (Annex A)", legalBasis: "RCSMF art. 37", standardForm: true, formRef: "Annexe A" },
    ],
  },
  {
    code: "international",
    nameFr: "Dossiers internationaux",
    nameEn: "International cases",
    types: [
      { code: "hague_retour_enfant_aj132a", nameFr: "Demande de retour d'enfant (Convention de La Haye) — AJ-132A", nameEn: "Hague return of child — AJ-132A", legalBasis: "Convention de La Haye", standardForm: true, formRef: "AJ-132A" },
      { code: "hague_droits_acces_aj142a", nameFr: "Demande d'assistance aux droits d'accès — AJ-142A", nameEn: "Hague access rights assistance — AJ-142A", legalBasis: "Convention de La Haye", standardForm: true, formRef: "AJ-142A" },
    ],
  },
  {
    code: "property",
    nameFr: "Partage du patrimoine et régimes",
    nameEn: "Property division documents",
    types: [
      { code: "calcul_patrimoine_familial_mtl", nameFr: "Calcul patrimoine familial (District de Montréal — Excel)", nameEn: "Family patrimony calculation (Montreal district)", legalBasis: "CCQ art. 414-426", standardForm: true },
      { code: "societe_acquets_mtl", nameFr: "État société d'acquêts (District de Montréal — Excel)", nameEn: "Partnership of acquests statement (Montreal)", legalBasis: "CCQ", standardForm: true },
      { code: "sj1329_patrimoine_union_parentale", nameFr: "Énoncé préliminaire patrimoine union parentale (SJ-1329)", nameEn: "Preliminary statement parental union patrimony (SJ-1329)", legalBasis: "TUF; SJ-1329", standardForm: true, formRef: "SJ-1329", priority: "high" },
      { code: "prestation_compensatoire", nameFr: "Demande de prestation compensatoire", nameEn: "Compensatory allowance application", legalBasis: "CCQ art. 427-430", standardForm: false },
      { code: "renonciation_partage_patrimoine", nameFr: "Renonciation au partage du patrimoine", nameEn: "Renunciation of patrimony partition", legalBasis: "CCQ", standardForm: false },
    ],
  },
  {
    code: "settlement_consent",
    nameFr: "Transactions et consentements",
    nameEn: "Settlement, mediation and consent documents",
    types: [
      { code: "projet_accord", nameFr: "Projet d'accord (divorce conjoint)", nameEn: "Draft agreement (joint divorce)", legalBasis: "CPC art. 303", standardForm: false, priority: "high" },
      { code: "consentement_a_jugement", nameFr: "Consentement à jugement", nameEn: "Consent to judgment", legalBasis: "CPC", standardForm: false, priority: "high" },
      { code: "transaction", nameFr: "Transaction", nameEn: "Settlement agreement", legalBasis: "CCQ art. 2631-2637", standardForm: false },
      { code: "declaration_jointe_dossier_complet", nameFr: "Déclaration conjointe — dossier complet", nameEn: "Joint declaration of complete file", legalBasis: "CPC", standardForm: false },
      { code: "inscription_sur_consentement", nameFr: "Inscription sur consentement", nameEn: "Consent inscription", legalBasis: "CPC", standardForm: false },
    ],
  },
  {
    code: "mediation",
    nameFr: "Médiation",
    nameEn: "Mediation",
    types: [
      { code: "attestation_participation_417", nameFr: "Attestation de participation — séance information parentale et médiation (art. 417 CPC)", nameEn: "Participation attestation parenting and mediation session", legalBasis: "CPC art. 417", standardForm: false },
      { code: "rapport_mediateur", nameFr: "Rapport du médiateur", nameEn: "Mediator report", legalBasis: "CPC / usages", standardForm: false },
      { code: "resume_entente_mediation", nameFr: "Résumé des ententes de médiation", nameEn: "Summary of mediation agreements", legalBasis: "CPC", standardForm: false },
    ],
  },
  {
    code: "post_judgment",
    nameFr: "Post-jugement et exécution",
    nameEn: "Post-judgment and special proceedings",
    types: [
      { code: "demande_modification", nameFr: "Demande en modification", nameEn: "Application to vary", legalBasis: "Divorce Act s. 17; CCQ art. 612", standardForm: false },
      { code: "execution_forcee", nameFr: "Demande d'exécution forcée", nameEn: "Forced execution application", legalBasis: "CPC", standardForm: false },
      { code: "outrage_tribunal", nameFr: "Requête en outrage au tribunal", nameEn: "Contempt of court motion", legalBasis: "CPC", standardForm: false },
      { code: "examen_post_judgment_sj137a", nameFr: "Examen post-jugement (SJ-137A)", nameEn: "Post-judgment examination (SJ-137A)", legalBasis: "SJ-137A", standardForm: true, formRef: "SJ-137A" },
      { code: "depens_sj286a", nameFr: "État des dépens (SJ-286A)", nameEn: "Bill of costs (SJ-286A)", legalBasis: "SJ-286A", standardForm: true, formRef: "SJ-286A" },
    ],
  },
  {
    code: "special_proceedings",
    nameFr: "Procédures spéciales",
    nameEn: "Special proceedings",
    types: [
      { code: "adoption", nameFr: "Demande d'adoption", nameEn: "Adoption application", legalBasis: "CCQ art. 559-576", standardForm: false },
      { code: "changement_nom", nameFr: "Changement de nom", nameEn: "Name change", legalBasis: "CCQ art. 57-64", standardForm: false },
      { code: "decheance_autorite_parentale", nameFr: "Déchéance de l'autorité parentale", nameEn: "Deprivation of parental authority", legalBasis: "CCQ art. 606-612", standardForm: false },
      { code: "tutelle_mineur", nameFr: "Tutelle du mineur", nameEn: "Tutorship of minors", legalBasis: "CCQ", standardForm: false },
      { code: "filiation", nameFr: "Contestation / établissement de filiation", nameEn: "Filiation dispute", legalBasis: "CCQ", standardForm: false },
      { code: "gestation_pour_autrui", nameFr: "Demande en gestation pour autrui", nameEn: "Surrogacy application", legalBasis: "CCQ", standardForm: false },
      { code: "autorisation_soins", nameFr: "Autorisation de soins (mineur)", nameEn: "Authorization of care", legalBasis: "CCQ", standardForm: false },
      { code: "emancipation_mineur", nameFr: "Émancipation du mineur", nameEn: "Minor emancipation", legalBasis: "CCQ", standardForm: false },
    ],
  },
  {
    code: "client_admin",
    nameFr: "Gestion client et administration",
    nameEn: "Client management and administrative",
    types: [
      { code: "contrat_mandat", nameFr: "Contrat de mandat", nameEn: "Retainer agreement", legalBasis: "CCQ / usages", standardForm: false },
      { code: "lettre_engagement", nameFr: "Lettre d'engagement", nameEn: "Engagement letter", legalBasis: "Usages", standardForm: false },
      { code: "lettre_desengagement", nameFr: "Lettre de désengagement", nameEn: "Disengagement letter", legalBasis: "Usages", standardForm: false },
      { code: "avis_retrait", nameFr: "Avis de retrait", nameEn: "Notice of withdrawal", legalBasis: "CPC / déontologie", standardForm: false },
      { code: "releve_frais_detaille", nameFr: "Relevé de frais détaillé", nameEn: "Detailed fee statement", legalBasis: "Usages", standardForm: false },
    ],
  },
  {
    code: "pre_litigation",
    nameFr: "Pré-contentieux",
    nameEn: "Pre-litigation documents",
    types: [
      { code: "mise_en_demeure", nameFr: "Mise en demeure", nameEn: "Formal demand / notice", legalBasis: "CCQ / usages", standardForm: false, priority: "high" },
      { code: "lettre_negociation", nameFr: "Lettre de négociation", nameEn: "Negotiation letter", legalBasis: "Usages", standardForm: false },
      { code: "avis_cessation_cohabitation", nameFr: "Avis de cessation de cohabitation", nameEn: "Notice of cessation of cohabitation", legalBasis: "CCQ / usages", standardForm: false },
    ],
  },
  {
    code: "tuf",
    nameFr: "Tribunal unifié de la famille (TUF)",
    nameEn: "Unified Family Court (TUF)",
    types: [
      { code: "tuf_demande_union_parentale_sj1326", nameFr: "Demande union parentale (SJ-1326)", nameEn: "Parental union application (SJ-1326)", legalBasis: "SJ-1326", standardForm: true, formRef: "SJ-1326", priority: "high" },
      { code: "tuf_reponse_sj1333", nameFr: "Réponse TUF (SJ-1333)", nameEn: "TUF Answer (SJ-1333)", legalBasis: "SJ-1333", standardForm: true, formRef: "SJ-1333", priority: "high" },
      { code: "tuf_patrimoine_union_sj1329", nameFr: "Énoncé patrimoine union parentale (SJ-1329)", nameEn: "Parental union patrimony statement (SJ-1329)", legalBasis: "SJ-1329", standardForm: true, formRef: "SJ-1329", priority: "high" },
      { code: "tuf_adhesion_volontaire", nameFr: "Adhésion volontaire à l'union parentale", nameEn: "Voluntary adhesion to parental union", legalBasis: "TUF", standardForm: false },
      { code: "tuf_retrait_union", nameFr: "Retrait d'union parentale", nameEn: "Withdrawal from parental union", legalBasis: "TUF", standardForm: false },
    ],
  },
  {
    code: "declarations_affidavits",
    nameFr: "Déclarations et affidavits",
    nameEn: "Declarations and affidavits",
    types: [
      { code: "affidavit_general_sj1139a", nameFr: "Affidavit général (SJ-1139A)", nameEn: "General affidavit (SJ-1139A)", legalBasis: "SJ-1139A", standardForm: true, formRef: "SJ-1139A" },
      { code: "declaration_autre_ordonnances_sj1214", nameFr: "Déclaration — autres ordonnances et instances (SJ-1214)", nameEn: "Disclosure of other orders/proceedings (SJ-1214)", legalBasis: "SJ-1214", standardForm: true, formRef: "SJ-1214" },
    ],
  },
  {
    code: "court_forms_generic",
    nameFr: "Formulaires judiciaires génériques",
    nameEn: "Generic court forms",
    types: [
      { code: "formulaire_ii_certificat_naissance", nameFr: "Certificat de naissance (Formulaire II)", nameEn: "Birth registration certificate (Form II)", legalBasis: "RCSMF", standardForm: true, formRef: "Formulaire II" },
      { code: "formulaire_vii_jugement_divorce", nameFr: "Jugement de divorce (Formulaire VII)", nameEn: "Divorce judgment (Form VII)", legalBasis: "RCSMF", standardForm: true, formRef: "Formulaire VII" },
      { code: "formulaire_viii_certificat_divorce", nameFr: "Certificat de divorce (Formulaire VIII)", nameEn: "Divorce certificate (Form VIII)", legalBasis: "RCSMF", standardForm: true, formRef: "Formulaire VIII" },
    ],
  },
  {
    code: "psychosocial",
    nameFr: "Évaluations psychosociales",
    nameEn: "Psychosocial assessments",
    types: [
      { code: "formulaire_iv_psychosocial", nameFr: "Formulaire IV — Consentement psychosocial", nameEn: "Form IV — Psychosocial consent", legalBasis: "RCSMF", standardForm: true, formRef: "Formulaire IV" },
      { code: "formulaire_v_psychosocial", nameFr: "Formulaire V — Ordonnance psychosociale type", nameEn: "Form V — Standard psychosocial order", legalBasis: "RCSMF", standardForm: true, formRef: "Formulaire V" },
      { code: "formulaire_vi_psychosocial", nameFr: "Formulaire VI — Ordonnance psychosociale élargie", nameEn: "Form VI — Extended psychosocial order", legalBasis: "RCSMF", standardForm: true, formRef: "Formulaire VI" },
    ],
  },
];

export type DocumentTypeWithCategory = DocumentTypeRecord & { categoryCode: DocumentCategoryCode };

/** Liste plate de tous les types de documents (pour recherche / sélection). */
export const ALL_FAMILLE_DOCUMENT_TYPES: DocumentTypeWithCategory[] =
  FAMILLE_DOCUMENT_CATEGORIES.flatMap((cat) =>
    cat.types.map((t) => ({ ...t, categoryCode: cat.code }))
  );

/** Types prioritaires pour le MVP (Formulaire I, Annexe I, etc.). */
export const PRIORITY_DOCUMENT_CODES: string[] = [
  "demande_divorce_contestee",
  "formulaire_annexe_i",
  "formulaire_iii",
  "ordonnance_sauvegarde",
  "mesures_provisoires",
  "plan_parental",
  "projet_accord",
  "consentement_a_jugement",
  "mise_en_demeure",
  "demande_union_parentale_tuf",
  "demande_dissolution_union_civile",
  "tuf_demande_union_parentale_sj1326",
  "tuf_reponse_sj1333",
  "tuf_patrimoine_union_sj1329",
];

/** Retourne un type de document par code. */
export function getDocumentTypeByCode(code: string): DocumentTypeRecord | undefined {
  for (const cat of FAMILLE_DOCUMENT_CATEGORIES) {
    const found = cat.types.find((t) => t.code === code);
    if (found) return found;
  }
  return undefined;
}

/** Retourne la catégorie d'un type. */
export function getCategoryForDocumentCode(code: string): DocumentCategoryRecord | undefined {
  return FAMILLE_DOCUMENT_CATEGORIES.find((cat) =>
    cat.types.some((t) => t.code === code)
  );
}
