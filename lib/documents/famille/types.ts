/**
 * Types pour le générateur de documents — Droit familial québécois
 * Contexte, données client/dossier, options de génération.
 */

export interface GenerationContext {
  jurisdiction: string;
  documentType: string;
  documentTypeCode: string;
  applicableLaw: string[];
  language: "fr" | "en";
  district?: string;
  courtFileNumber?: string;
}

export interface ClientData {
  /** Personne physique : prénom, nom. Morale : raison sociale. */
  displayName: string;
  typeClient: "personne_physique" | "personne_morale";
  prenom?: string;
  nom?: string;
  raisonSociale?: string;
  dateNaissance?: string;
  adresse?: string;
  city?: string;
  province?: string;
  postalCode?: string;
  langue?: string;
  /** Conjoint ou autre partie si applicable (contexte divorce / garde). */
  otherPartyName?: string;
  /** Enfants : pour plans parentaux, PA, etc. */
  children?: Array<{
    prenom: string;
    nom?: string;
    dateNaissance?: string;
    custodyType?: "sole" | "shared" | "split" | "extended_access";
  }>;
  /** Régime matrimonial (société d'acquêts, séparation de biens, etc.). */
  matrimonialRegime?: string;
  /** Type de garde prévu ou demandé (pour calcul PA Annexe I). */
  custodyArrangement?: "sole" | "shared" | "split" | "extended_access" | "mixed";
}

export interface DossierData {
  intitule: string;
  type?: string;
  districtJudiciaire?: string;
  numeroDossierTribunal?: string;
  tribunalNom?: string;
  /** Résumé des faits / stratégie pour alimenter les sections narratives. */
  resumeDossier?: string;
  notesStrategieJuridique?: string;
}

export interface TemplateSectionSpec {
  id: string;
  legalRef?: string; // ex. "art. 414-426 CCQ"
  labelFr?: string;
  labelEn?: string;
  /** Si true, la section doit être rédigée par l'IA (narratif). */
  narrative?: boolean;
}

export interface GenerateOptions {
  /** Code du type de document (taxonomie). */
  documentTypeCode: string;
  /** Langue de sortie. */
  language: "fr" | "en";
  /** Données client (dossier). */
  client: ClientData;
  /** Données dossier (affaire). */
  dossier: DossierData;
  /** Sections du template à inclure / à générer. */
  sections?: TemplateSectionSpec[];
  /** Variables additionnelles (district, no dossier, etc.). */
  variables?: Record<string, string>;
  /** Ne pas inclure les sections narratives générées par IA (brouillon structure seule). */
  structureOnly?: boolean;
}

export interface GeneratedDocumentResult {
  /** Contenu texte principal (ou HTML/Markdown selon template). */
  content: string;
  /** Métadonnées pour audit (outil IA, modèle, date). */
  meta: {
    generatedAt: string;
    model?: string;
    templateCode: string;
    aiAssisted: boolean;
    disclaimerAppended: boolean;
  };
  /** Pour formulaires structurés (ex. Annexe I) : données par section/ligne. */
  structuredData?: Record<string, unknown>;
}
