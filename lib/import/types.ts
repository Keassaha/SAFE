export type DocumentType = "releve_bancaire" | "registre_clients" | "fiches_temps";

export type RawRow = Record<string, string>;

export type ParsedFile = {
  fileName: string;
  headers: string[];
  rows: RawRow[];
  titleRow?: string;
  headerRowIndex: number;
};

export type ClassificationResult = {
  type: DocumentType;
  confidence: number;
  reason: string;
};

export type ColumnMapping = Record<string, string | null>;

export type NormalizedRow<T = Record<string, unknown>> = {
  index: number;
  data: T;
  errors: FieldError[];
  warnings: string[];
};

export type FieldError = {
  field: string;
  message: string;
  value?: unknown;
};

export type PreviewResult = {
  fileName: string;
  documentType: DocumentType;
  totalRows: number;
  mapping: ColumnMapping;
  preview: NormalizedRow[];
  validCount: number;
  errorCount: number;
};

export type ImportResult = {
  fileName: string;
  documentType: DocumentType;
  totalRows: number;
  created: number;
  updated: number;
  skipped: number;
  errors: Array<{ row: number; message: string }>;
};

export type NormalizedClient = {
  raisonSociale: string;
  typeClient: "personne_physique" | "personne_morale";
  prenom?: string;
  nom?: string;
  email?: string;
  telephone?: string;
  adresse?: string;
  langue?: string;
  numeroDossier?: string;
  partieAdverse?: string;
  categorieDossier?: string;
  typeDossier?: string;
  dateOuverture?: string;
  statut?: string;
  /** Remplissage du mandat dossier (import) */
  districtJudiciaire?: string;
  tribunal?: string;
  typeCause?: string;
};

export type NormalizedTimeEntry = {
  date: string;
  clientName: string;
  numeroDossier?: string;
  description?: string;
  dureeHeures: number;
  avocatName: string;
  tauxHoraire: number;
  montant: number;
  statut?: string;
};

export type NormalizedBankTransaction = {
  date: string;
  description: string;
  amount: number;
  rawType: "debit" | "credit";
  balance?: number;
  reference?: string;
};
