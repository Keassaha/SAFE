/**
 * Mappage comptable : transforme le journal mono-axe de SAFE en écritures
 * double-entrée (débit/crédit) importables par un logiciel comptable externe
 * (QuickBooks / Xero / Sage). Module PUR.
 *
 * SAFE n'est pas en partie double en interne (doctrine §1) ; ce mappage produit
 * la double-entrée UNIQUEMENT à l'export, à partir du type d'écriture et de son
 * module d'origine. Le plan comptable (codes/noms) est surchargé par cabinet.
 */

import type { JournalTransactionType, JournalSourceModule } from "@prisma/client";

/** Comptes logiques utilisés par le mappage (résolus en code/nom via le plan). */
export type AccountKey =
  | "bank_admin"
  | "bank_trust"
  | "accounts_receivable"
  | "revenue_fees"
  | "tax_payable"
  /** Taxe payée sur les achats, récupérable en CTI/RTI. Actif, pas une dépense. */
  | "tax_receivable"
  | "expenses"
  | "disbursements_recoverable"
  | "trust_liability"
  | "adjustments";

export interface Account {
  code: string;
  name: string;
}

export type AccountChart = Record<AccountKey, Account>;

/**
 * Plan comptable par défaut (codes indicatifs, style cabinet juridique canadien).
 * Chaque cabinet peut surcharger les codes/noms pour coller à son logiciel.
 */
export const DEFAULT_ACCOUNT_CHART: AccountChart = {
  bank_admin: { code: "1000", name: "Banque - Administration" },
  bank_trust: { code: "1010", name: "Banque - Fidéicommis" },
  accounts_receivable: { code: "1100", name: "Comptes à recevoir" },
  revenue_fees: { code: "4000", name: "Honoraires" },
  tax_payable: { code: "2200", name: "Taxes à remettre" },
  tax_receivable: { code: "1210", name: "Taxes payées à recouvrer (CTI/RTI)" },
  expenses: { code: "5000", name: "Dépenses du cabinet" },
  disbursements_recoverable: { code: "1200", name: "Débours à recouvrer" },
  trust_liability: { code: "2100", name: "Fonds détenus en fidéicommis" },
  adjustments: { code: "5900", name: "Ajustements" },
};

/** Fusionne une surcharge partielle de cabinet avec le plan par défaut. */
export function resolveAccountChart(override?: Partial<AccountChart> | null): AccountChart {
  if (!override) return DEFAULT_ACCOUNT_CHART;
  const merged = { ...DEFAULT_ACCOUNT_CHART };
  for (const key of Object.keys(override) as AccountKey[]) {
    const o = override[key];
    if (o?.code && o?.name) merged[key] = o;
  }
  return merged;
}

/* ── Un compte par catégorie de dépense ─────────────────────────────────────
 *
 * Le cabinet classe ses dépenses dans 26 catégories, puis l'export les envoyait
 * TOUTES sur le compte unique 5000. Le travail de classement était fait, puis jeté
 * au moment précis où il servait : le comptable recevait un bloc indistinct et
 * refaisait le tri à la main.
 *
 * Les codes suivent le découpage usuel d'un cabinet juridique canadien. Ils sont
 * indicatifs et surchargeables : c'est le plan du logiciel du comptable qui fait
 * foi, pas le nôtre.
 */

export const DEFAULT_EXPENSE_ACCOUNTS: Readonly<Record<string, Account>> = {
  LOYER: { code: "5100", name: "Loyer et occupation" },
  TELEPHONE: { code: "5110", name: "Téléphonie" },
  INTERNET: { code: "5111", name: "Internet" },
  LOGICIELS: { code: "5120", name: "Logiciels et abonnements" },
  FOURNITURES: { code: "5130", name: "Fournitures de bureau" },
  IMPRESSION: { code: "5131", name: "Impression et photocopies" },
  POSTE: { code: "5132", name: "Poste et messagerie" },
  DEPLACEMENTS: { code: "5200", name: "Déplacements" },
  STATIONNEMENT: { code: "5201", name: "Stationnement" },
  VEHICULE: { code: "5210", name: "Véhicule" },
  REPAS_REPRESENTATION: { code: "5220", name: "Repas et représentation" },
  FORMATION: { code: "5300", name: "Formation" },
  SOUS_TRAITANCE: { code: "5400", name: "Sous-traitance" },
  HONORAIRES_EXT: { code: "5410", name: "Honoraires professionnels externes" },
  FRAIS_BANCAIRES: { code: "5500", name: "Frais bancaires" },
  PUBLICITE: { code: "5600", name: "Publicité et marketing" },
  ASSURANCES: { code: "5700", name: "Assurances" },
  SALAIRES: { code: "5800", name: "Salaires et rémunération" },
  DEBOURS_AVANCES: { code: "1200", name: "Débours à recouvrer" },
  HUISSIER: { code: "5420", name: "Frais d'huissier" },
  TRIBUNAL: { code: "5430", name: "Frais de tribunal" },
  REGISTRE_FONCIER: { code: "5431", name: "Registre foncier" },
  RECHERCHE_JURIDIQUE: { code: "5440", name: "Recherche juridique" },
  EXPERTS: { code: "5450", name: "Experts" },
  TRADUCTION: { code: "5460", name: "Traduction" },
  AUTRES: { code: "5900", name: "Autres dépenses" },
};

/**
 * Compte de dépense d'une catégorie. Retombe sur le compte général quand la
 * catégorie est absente ou inconnue : mieux vaut un export exact sur un compte
 * fourre-tout qu'un export qui échoue.
 */
export function expenseAccountFor(
  categoryCode: string | null | undefined,
  chart: AccountChart,
  override?: Readonly<Record<string, Account>> | null,
): Account {
  if (!categoryCode) return chart.expenses;
  return override?.[categoryCode] ?? DEFAULT_EXPENSE_ACCOUNTS[categoryCode] ?? chart.expenses;
}

/** Une règle de double-entrée : compte débité, compte crédité, et montant. */
export interface DoubleEntryRule {
  debit: AccountKey;
  credit: AccountKey;
  amount: number;
}

/**
 * Dérive la règle double-entrée d'une écriture SAFE.
 * `montantEntree`/`montantSortie` : un seul est non nul pour les flux normaux ;
 * pour AJUSTEMENT/CORRECTION la direction dépend du champ non nul et du module.
 */
export function deriveDoubleEntry(entry: {
  typeTransaction: JournalTransactionType;
  sourceModule: JournalSourceModule;
  montantEntree: number;
  montantSortie: number;
}): DoubleEntryRule {
  const entree = entry.montantEntree;
  const sortie = entry.montantSortie;

  switch (entry.typeTransaction) {
    case "FACTURE":
      // Créance reconnue : Dr Comptes à recevoir / Cr Honoraires (montant HT facturé).
      return { debit: "accounts_receivable", credit: "revenue_fees", amount: entree };
    case "PAIEMENT":
      // Encaissement : Dr Banque admin / Cr Comptes à recevoir.
      return { debit: "bank_admin", credit: "accounts_receivable", amount: entree };
    case "DEPENSE":
      // Dépense : Dr Dépenses / Cr Banque admin.
      return { debit: "expenses", credit: "bank_admin", amount: sortie };
    case "DEBOURS":
      // Débours avancé par le cabinet : Dr Débours à recouvrer / Cr Banque admin.
      return { debit: "disbursements_recoverable", credit: "bank_admin", amount: sortie };
    case "DEPOT_FIDEICOMMIS":
      // Dépôt fidéicommis : Dr Banque fidéicommis / Cr Fonds détenus.
      return { debit: "bank_trust", credit: "trust_liability", amount: entree };
    case "RETRAIT_FIDEICOMMIS":
      // Retrait fidéicommis : Dr Fonds détenus / Cr Banque fidéicommis.
      return { debit: "trust_liability", credit: "bank_trust", amount: sortie };
    case "AJUSTEMENT":
    case "CORRECTION": {
      // Direction selon le champ non nul ; comptes selon le module (fidéicommis ou admin).
      const isTrust = entry.sourceModule === "FIDEICOMMIS";
      const bank: AccountKey = isTrust ? "bank_trust" : "bank_admin";
      const contra: AccountKey = isTrust ? "trust_liability" : "adjustments";
      if (entree > 0) return { debit: bank, credit: contra, amount: entree };
      return { debit: contra, credit: bank, amount: sortie };
    }
    default: {
      // Exhaustivité : tout nouveau type doit être mappé explicitement.
      const fallbackAmount = entree > 0 ? entree : sortie;
      return { debit: "adjustments", credit: "bank_admin", amount: fallbackAmount };
    }
  }
}
