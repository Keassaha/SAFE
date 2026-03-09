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
  totalRevenus: number;
  totalDepenses: number;
  totalEncaisse: number;
  totalFideicommis: number;
  soldeGlobal: number;
  nbTransactionsCeMois: number;
  totalRevenusMoisPrecedent?: number;
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
