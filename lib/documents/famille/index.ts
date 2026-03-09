/**
 * Module générateur de documents — Droit familial québécois
 * Taxonomie 124 types, templates, prompts Claude, génération hybride template + IA.
 */

export {
  FAMILLE_DOCUMENT_CATEGORIES,
  ALL_FAMILLE_DOCUMENT_TYPES,
  PRIORITY_DOCUMENT_CODES,
  getDocumentTypeByCode,
  getCategoryForDocumentCode,
} from "./taxonomy";
export type {
  DocumentCategoryCode,
  DocumentCategoryRecord,
  DocumentTypeRecord,
  DocumentTypeWithCategory,
} from "./taxonomy";

export { JURISDICTION, AI_DISCLAIMER_FR, AI_DISCLAIMER_EN, SUPPORT_BASIC_DEDUCTION_2025 } from "./constants";
export type { GenerateOptions, GeneratedDocumentResult, ClientData, DossierData } from "./types";
export { generateFamilyLawDocument } from "./generate";
// Server Action : importer depuis "@/lib/documents/famille/actions" pour usage dans formulaires / client
export type { GenerateDocumentResult } from "./actions";
