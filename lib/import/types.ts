export type DocumentType =
  | "releve_bancaire"
  | "registre_clients"
  | "fiches_temps"
  | "migration_comptable";

/**
 * Une ligne brute issue du parser. Les clés non préfixées par `__`
 * correspondent aux entêtes du fichier source. Les clés préfixées
 * sont des métadonnées de provenance ajoutées par le parser et
 * ignorées par les détecteurs de colonnes.
 */
export type RawRow = Record<string, string> & {
  __sheetName?: string;
  __sourceRowIndex?: string;
  __rowFingerprint?: string;
  __rawRowText?: string;
  /** "data" | "summary" | "blank" | "comment" — set par le parser quand il peut le détecter */
  __sourceRowKind?: string;
};

export type ParsedFile = {
  fileName: string;
  headers: string[];
  rows: RawRow[];
  titleRow?: string;
  headerRowIndex: number;
  /** Feuille active pour les fichiers Excel multi-onglets. */
  sheetName?: string;
  /** Liste des autres feuilles disponibles, signalée à l'opérateur. */
  availableSheets?: string[];
  /** Lignes ignorées par le parser (vides, lignes de total avant l'entête, commentaires). */
  ignoredCount?: number;
};

export type ClassificationResult = {
  type: DocumentType;
  confidence: number;
  reason: string;
};

export type ColumnMapping = Record<string, string | null>;

export type RowSeverity = "ok" | "warning" | "blocked";

export type NormalizedRow<T = Record<string, unknown>> = {
  index: number;
  data: T;
  errors: FieldError[];
  warnings: string[];
  /** Calculé à partir des errors/warnings; permet à l'UI et à l'action de décider rapidement. */
  severity?: RowSeverity;
  /** True quand le parser ou le normalizer pense que c'est une ligne de total / sous-total / report. */
  isSummaryRow?: boolean;
  /** Empreinte stable de la ligne pour détection de doublons / idempotence. */
  rowFingerprint?: string;
  /** Index de la ligne dans le fichier source (entête comprise). */
  sourceRowIndex?: number;
  /** Nom de la feuille source si applicable. */
  sheetName?: string;
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

/**
 * Preview enrichi pour la migration comptable. Donne à l'opérateur les chiffres
 * dont il a besoin pour décider d'écrire au journal ou pas.
 */
export type AccountingPreviewBreakdown = {
  cleanCount: number;        // ok ET non-summary ET non-duplicate
  warningCount: number;      // warnings non bloquants
  blockedCount: number;      // erreurs bloquantes
  summaryCount: number;      // lignes total/sous-total/report
  duplicateCount: number;    // doublons probables dans le même lot
  willImportCount: number;   // ce qui serait écrit au journal si l'utilisateur valide
  willSkipCount: number;     // tout le reste
};

export type AccountingPreviewResult = PreviewResult & {
  breakdown: AccountingPreviewBreakdown;
  sheetName?: string;
  availableSheets?: string[];
};

export type ImportResult = {
  fileName: string;
  documentType: DocumentType;
  totalRows: number;
  created: number;
  updated: number;
  skipped: number;
  errors: Array<{ row: number; message: string }>;
  /** Détail décisionnel pour la migration comptable. Optionnel pour ne pas casser l'existant. */
  accountingBreakdown?: AccountingPreviewBreakdown & {
    importHistoryId?: string;
  };
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

/**
 * Sortie normalisée d'une ligne de migration comptable.
 * Représente un événement comptable atomique potentiellement écriturable
 * dans `JournalGeneralEntry`.
 */
export type AccountingDirection = "IN" | "OUT" | "UNKNOWN";

export type NormalizedAccountingEntry = {
  /** Date ISO (YYYY-MM-DD) si parsable. */
  date: string;
  description: string;
  reference?: string;
  clientName?: string;
  numeroDossier?: string;
  categorie?: string;
  compte?: string;
  /** Montant absolu lorsque calculable (>= 0). */
  amount: number;
  debit?: number;
  credit?: number;
  /** Sens financier dérivé pour pouvoir écrire dans `montantEntree` / `montantSortie`. */
  direction: AccountingDirection;
  balance?: number;
  /** Module source brut tel que trouvé dans le fichier (libre, normalisé en UPPERCASE). */
  sourceModule?: string;
  /** Type de transaction brut tel que trouvé dans le fichier (libre, normalisé en UPPERCASE). */
  typeTransaction?: string;
  /** Métadonnées de provenance — utile pour le debug humain. */
  sheetName?: string;
  sourceRowIndex?: number;
  rowFingerprint?: string;
  /** "data" | "summary" | "opening_balance" | "comment" */
  sourceRowKind?: "data" | "summary" | "opening_balance" | "comment";
  /** Texte brut concaténé de la ligne pour l'audit. */
  rawRowText?: string;
};
