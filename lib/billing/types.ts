/**
 * SAFE — Noyau commun de facturation : types.
 *
 * Source de vérité : docs/accounting/BILLING_CORE_MODEL.md
 *
 * Tous les helpers de `lib/billing/*` consomment ces types et restent
 * purs (zéro accès Prisma). Ils sont consommés par les couches API,
 * server actions, et les écrans qui doivent agréger des KPIs.
 */

/* ───────── Buckets de valeur ───────── */

export type AmountBucket =
  | "produced"   // Travail réalisé (brut)
  | "billable"   // Décidé facturable (post ajustement, hors write-off)
  | "billed"     // Inclus dans une Invoice ISSUED+
  | "collected"; // Encaissé via PaymentAllocation

/** Ratios calculés. Tous compris dans [0, 1]. */
export interface BillingRatios {
  /** facturable / produit */
  realization: number;
  /** encaissé / facturé */
  recovery: number;
}

/* ───────── Time entry ───────── */

/**
 * Vue normalisée d'une TimeEntry pour le noyau de facturation.
 * Aligne `feeAmount ?? montant` et expose un seul champ de sortie.
 *
 * Voir `getTimeEntryBillableAmount` dans `wip.ts`.
 */
export interface BillingTimeEntry {
  id: string;
  /** Heures × taux (brut). */
  montant: number;
  /** Montant facturable réel si différent du brut. Préféré quand défini. */
  feeAmount?: number | null;
  /** Source de vérité pour le statut de facturation. */
  billingStatus?: TimeEntryBillingStatus | null;
  facturable: boolean;
  isWrittenOff: boolean;
}

/**
 * Re-export typé du `BillingStatus` Prisma.
 * Les valeurs autorisées doivent rester alignées avec `prisma/schema.prisma`.
 */
export type TimeEntryBillingStatus =
  | "NON_BILLED"
  | "READY_TO_BILL"
  | "IN_DRAFT_INVOICE"
  | "BILLED"
  | "NON_BILLABLE"
  | "WRITTEN_OFF"
  | "CANCELLED";

export type BillingClassification =
  | "produced_only"  // Existe mais pas encore facturable
  | "billable"       // Prêt à entrer dans une facture
  | "drafted"        // Dans un brouillon de facture
  | "billed"         // Émis
  | "written_off"    // Écarté
  | "non_billable";  // Travail interne

/* ───────── Forfait ───────── */

export interface BillingRegistreTache {
  id: string;
  /** Prix catalogue figé à l'ouverture de la tâche. */
  montantBase: number;
  /** Ajustement à la hausse ou à la baisse. */
  ajustement: number;
  /** Rabais explicite (positif). */
  rabais: number;
  /** = montantBase + ajustement - rabais. Stocké, à recouper avec helper. */
  montantFinal: number;
  /** "en_cours" | "complete" | "facture" */
  statut: string;
  taxable: boolean;
  invoiceLineId?: string | null;
}

/* ───────── Snapshot dossier (input pour computeWipForDossier) ───────── */

export interface DossierBillingSnapshot {
  dossierId: string;
  cabinetId: string;
  timeEntries: BillingTimeEntry[];
  registreTaches: BillingRegistreTache[];
  /** Débours payés par le cabinet, refacturables, non encore liés à une facture. */
  unbilledDisbursements: Array<{
    id: string;
    montant: number;
    taxable: boolean;
  }>;
}

export interface WipBreakdown {
  /** Heures × taux pour les TimeEntry non-facturées et non-écartées. */
  hoursValue: number;
  /** montantFinal pour RegistreTache statut != "facture". */
  forfaitValue: number;
  /** Débours payés par cabinet, refacturables, non liés à une facture émise. */
  disbursementsValue: number;
  /** Total en cours. */
  total: number;
}

/* ───────── Dépenses / débours ───────── */

export type ExpenseCategory =
  | "cabinet_expense"      // Coût du cabinet, jamais refacturé
  | "client_disbursement"  // Avance pour un dossier, refacturable
  | "ambiguous";           // À qualifier (par défaut: cabinet_expense + flag refacturable)

export interface ExpenseClassificationInput {
  /** Lien direct vers un dossier ? */
  dossierId?: string | null;
  /** Lien direct vers un client ? */
  clientId?: string | null;
  /** L'opérateur a-t-il indiqué que c'est refacturable ? */
  refacturable?: boolean;
  /** L'objet appartient-il déjà à `DeboursDossier` ? */
  isDeboursDossier?: boolean;
  /** Catégorie de la règle de catégorisation (peut indiquer "frais gouvernementaux", etc.). */
  categoryName?: string | null;
}

/* ───────── Taxes ───────── */

export type CanadianProvince =
  | "QC" | "ON" | "AB" | "BC" | "MB" | "NB" | "NS" | "NL" | "PE" | "SK" | "YT" | "NT" | "NU";

export type TaxMode = "tps_tvq" | "hst" | "tps_only" | "tps_pst" | "tps_rst" | "none";

export interface TaxRates {
  tps?: number;
  tvq?: number;
  hst?: number;
  pst?: number;
  rst?: number;
}

export interface CabinetTaxConfig {
  province: CanadianProvince;
  mode: TaxMode;
  rates: TaxRates;
  registrations?: {
    tpsNumber?: string;
    tvqNumber?: string;
    hstNumber?: string;
  };
}

export interface AppliedTaxes {
  /** Sous-total de la ligne (sans taxes). */
  base: number;
  tps: number;
  tvq: number;
  hst: number;
  pst: number;
  rst: number;
  /** Somme des taxes. */
  taxesTotal: number;
  /** base + taxesTotal */
  total: number;
}
