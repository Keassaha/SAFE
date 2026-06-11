/**
 * Types pour le module Journal Général.
 * Registre central append-only des transactions financières.
 */

import type { JournalTransactionType, JournalSourceModule } from "@prisma/client";

export type { JournalTransactionType, JournalSourceModule };

export interface JournalEntryCreateInput {
  cabinetId: string;
  dateTransaction: Date;
  typeTransaction: JournalTransactionType;
  reference?: string | null;
  clientId?: string | null;
  dossierId?: string | null;
  description: string;
  categorie?: string | null;
  montantEntree: number;
  montantSortie: number;
  sourceModule: JournalSourceModule;
  sourceId?: string | null;
  utilisateurId?: string | null;
}

export interface JournalFiltersInput {
  cabinetId: string;
  dateFrom?: Date | null;
  dateTo?: Date | null;
  clientId?: string | null;
  dossierId?: string | null;
  typeTransaction?: JournalTransactionType | null;
  categorie?: string | null;
  sourceModule?: JournalSourceModule | null;
  utilisateurId?: string | null;
  montantMin?: number | null;
  montantMax?: number | null;
  entreesOnly?: boolean;
  sortiesOnly?: boolean;
  search?: string | null;
}

export interface JournalListParams extends JournalFiltersInput {
  page?: number;
  pageSize?: number;
  orderBy?: "dateTransaction" | "createdAt";
  orderDir?: "asc" | "desc";
}

export interface JournalEntryRow {
  id: string;
  dateTransaction: Date;
  typeTransaction: JournalTransactionType;
  reference: string | null;
  clientId: string | null;
  clientName: string | null;
  dossierId: string | null;
  dossierLabel: string | null;
  description: string;
  categorie: string | null;
  montantEntree: number;
  montantSortie: number;
  solde: number;
  sourceModule: JournalSourceModule;
  sourceId: string | null;
  utilisateurId: string | null;
  utilisateurName: string | null;
  createdAt: Date;
}

export interface JournalKpiData {
  /** Total FACTURÉ sur la période (factures émises). N'est PAS du cash. */
  totalFacture: number;
  /** Total ENCAISSÉ sur la période (paiements reçus en compte d'administration). Cash entré. */
  totalEncaisse: number;
  /** Dépenses + débours payés par le cabinet sur la période. Cash sorti. */
  totalDepenses: number;
  /** Comptes à recevoir : somme des soldes dus des factures ouvertes (point dans le temps). */
  comptesARecevoir: number;
  /**
   * Solde opérationnel ESTIMÉ : cash réellement entré/sorti du compte d'administration.
   * = encaissements + ajustements/corrections cash − dépenses − débours.
   * EXCLUT les FACTURE (créances, pas du cash) ET le fidéicommis (argent du client).
   */
  soldeOperationnelEstime: number;
  /** Solde du compte en fidéicommis (argent du client) — JAMAIS agrégé au solde du cabinet. */
  soldeFideicommis: number;
  /** Nombre d'écritures sur la période. */
  nbTransactionsCeMois: number;
  /** Comparatifs période précédente (optionnels). */
  totalFactureMoisPrecedent?: number;
  totalDepensesMoisPrecedent?: number;
}

export const JOURNAL_TRANSACTION_TYPE_LABELS: Record<JournalTransactionType, string> = {
  FACTURE: "Facture",
  PAIEMENT: "Paiement",
  DEPOT_FIDEICOMMIS: "Dépôt fidéicommis",
  RETRAIT_FIDEICOMMIS: "Retrait fidéicommis",
  DEBOURS: "Débours",
  DEPENSE: "Dépense",
  AJUSTEMENT: "Ajustement",
  CORRECTION: "Correction",
};

export const JOURNAL_SOURCE_MODULE_LABELS: Record<JournalSourceModule, string> = {
  FACTURATION: "Facturation",
  PAIEMENTS: "Paiements",
  FIDEICOMMIS: "Fidéicommis",
  DEPENSES: "Dépenses",
  DEBOURS: "Débours",
  IMPORT_BANCAIRE: "Import bancaire",
  AJUSTEMENT_MANUEL: "Ajustement manuel",
  CORRECTION_SYSTEME: "Correction système",
};
