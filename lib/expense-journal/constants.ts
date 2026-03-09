/**
 * Catégories de dépenses par défaut pour le journal des dépenses (cabinet).
 * Distinct des débours refacturables clients.
 */

export const DEFAULT_EXPENSE_CATEGORIES: ReadonlyArray<{
  name: string;
  code: string;
  sortOrder: number;
}> = [
  { name: "Loyer / bureau", code: "LOYER", sortOrder: 1 },
  { name: "Téléphone", code: "TELEPHONE", sortOrder: 2 },
  { name: "Internet", code: "INTERNET", sortOrder: 3 },
  { name: "Logiciels / abonnements", code: "LOGICIELS", sortOrder: 4 },
  { name: "Fournitures de bureau", code: "FOURNITURES", sortOrder: 5 },
  { name: "Impression / photocopies", code: "IMPRESSION", sortOrder: 6 },
  { name: "Poste / messagerie", code: "POSTE", sortOrder: 7 },
  { name: "Déplacements", code: "DEPLACEMENTS", sortOrder: 8 },
  { name: "Stationnement", code: "STATIONNEMENT", sortOrder: 9 },
  { name: "Formation", code: "FORMATION", sortOrder: 10 },
  { name: "Sous-traitance", code: "SOUS_TRAITANCE", sortOrder: 11 },
  { name: "Honoraires professionnels externes", code: "HONORAIRES_EXT", sortOrder: 12 },
  { name: "Frais bancaires", code: "FRAIS_BANCAIRES", sortOrder: 13 },
  { name: "Publicité / marketing", code: "PUBLICITE", sortOrder: 14 },
  { name: "Assurances", code: "ASSURANCES", sortOrder: 15 },
  { name: "Salaires / rémunération", code: "SALAIRES", sortOrder: 16 },
  { name: "Débours avancés", code: "DEBOURS_AVANCES", sortOrder: 17 },
  { name: "Frais d'huissier", code: "HUISSIER", sortOrder: 18 },
  { name: "Frais tribunal", code: "TRIBUNAL", sortOrder: 19 },
  { name: "Registre foncier", code: "REGISTRE_FONCIER", sortOrder: 20 },
  { name: "Recherche juridique", code: "RECHERCHE_JURIDIQUE", sortOrder: 21 },
  { name: "Experts", code: "EXPERTS", sortOrder: 22 },
  { name: "Traduction", code: "TRADUCTION", sortOrder: 23 },
  { name: "Autres", code: "AUTRES", sortOrder: 99 },
];

/** Règles système initiales (fournisseur → catégorie) pour l'apprentissage */
export const SYSTEM_SUPPLIER_CATEGORY_MAP: Readonly<Record<string, string>> = {
  VIDEOTRON: "Internet",
  BELL: "Téléphone",
  ROGERS: "Internet",
  SOQUIJ: "Recherche juridique",
  LEXIS: "Recherche juridique",
  CANLII: "Recherche juridique",
  "BUREAU EN GROS": "Fournitures de bureau",
  STAPLES: "Fournitures de bureau",
  "POSTES CANADA": "Poste / messagerie",
  PUROLATOR: "Poste / messagerie",
  FEDEX: "Poste / messagerie",
  AMAZON: "Fournitures de bureau",
  CANVA: "Logiciels / abonnements",
  MICROSOFT: "Logiciels / abonnements",
  ADOBE: "Logiciels / abonnements",
  DROPBOX: "Logiciels / abonnements",
  REGISTRE: "Registre foncier",
  STRIPE: "Frais bancaires",
};

/** Colonnes possibles pour le mapping d'import (relevé bancaire) */
export const BANK_COLUMN_ALIASES: Readonly<Record<string, string[]>> = {
  date: ["date", "transaction date", "date opération", "date operation", "trans date", "posting date"],
  description: [
    "description",
    "memo",
    "details",
    "libellé",
    "libelle",
    "narrative",
    "transaction",
    "payee",
    "name",
  ],
  amount: ["amount", "montant", "transaction amount", "debit/credit", "somme"],
  debit: ["debit", "débit", "depense", "withdrawal"],
  credit: ["credit", "crédit", "deposit", "revenu"],
  balance: ["balance", "solde", "running balance"],
  reference: ["reference", "ref", "référence", "numero", "number", "id", "no"],
};
