/**
 * Types pour le module Journal Général.
 * Registre central append-only des transactions financières.
 */

import type {
  JournalTransactionType,
  JournalSourceModule,
  JournalCorrectionMotive,
} from "@prisma/client";

export type { JournalTransactionType, JournalSourceModule, JournalCorrectionMotive };

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
  /**
   * Réservé aux CONTREPASSATIONS : identifiant de l'écriture que celle-ci annule.
   * Doctrine: docs/accounting/DOCTRINE_ANNULATION_CORRECTION.md §1.1.
   */
  annuleId?: string | null;
  motifCode?: JournalCorrectionMotive | null;
  motifTexte?: string | null;
}

/**
 * Portée d'une liste d'écritures.
 *  - `actives`     : ce que le cabinet doit voir et ce qui compte dans les totaux.
 *                    Exclut les écritures annulées ET leurs contrepassations.
 *  - `corrections` : le registre des corrections (doctrine §3). Uniquement les
 *                    contrepassations, chacune portant son motif.
 *  - `toutes`      : la vue opposable, rien n'est masqué. C'est elle qui part à
 *                    l'inspection et à l'export comptable.
 */
export type JournalPortee = "actives" | "corrections" | "toutes";

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
  /** Défaut `actives` : une liste sans portée explicite ne montre jamais d'annulé. */
  portee?: JournalPortee | null;
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
  // `solde` a été RETIRÉ de cette ligne. La colonne existe encore en base, mais elle
  // est fausse dès qu'une écriture est antidatée, et un solde courant n'a de toute
  // façon aucun sens sur une liste filtrable, paginée et triable dans les deux sens.
  // Le solde courant réglementaire vit dans le REGISTRE (art. 38), où les lignes sont
  // complètes et chronologiques ; les indicateurs passent par `kpi.ts`.
  sourceModule: JournalSourceModule;
  sourceId: string | null;
  utilisateurId: string | null;
  utilisateurName: string | null;
  createdAt: Date;
  /** Renseigné sur une CONTREPASSATION : l'écriture qu'elle neutralise. */
  annuleId: string | null;
  motifCode: JournalCorrectionMotive | null;
  motifTexte: string | null;
  /**
   * Vrai si une autre écriture annule celle-ci. Sert à la vue Corrections, qui
   * affiche la ligne d'origine à côté de sa contrepassation.
   */
  estAnnulee: boolean;
  /**
   * Vrai si le cabinet peut annuler cette ligne d'ici. Faux pour tout ce qui vient
   * d'un module métier : ça s'annule dans le module, jamais au journal (doctrine §5).
   */
  annulable: boolean;
}

/** Libellés des motifs (doctrine §2). Liste fermée, en français de cabinet. */
export const JOURNAL_MOTIVE_LABELS: Record<JournalCorrectionMotive, string> = {
  ERREUR_SAISIE: "Erreur de saisie",
  MAUVAIS_TYPE: "Mauvais type d'écriture",
  DOUBLON: "Écriture en double",
  MONTANT_ERRONE: "Montant erroné",
  TRANSACTION_ANNULEE: "Transaction annulée par la banque ou le client",
  MAUVAIS_DOSSIER: "Rattachée au mauvais client ou dossier",
  AUTRE: "Autre, à préciser",
};

export interface JournalKpiData {
  /** Total FACTURÉ sur la période (factures émises). N'est PAS du cash. */
  totalFacture: number;
  /** Total ENCAISSÉ sur la période (paiements reçus en compte d'administration). Cash entré. */
  totalEncaisse: number;
  /** Dépenses + débours payés par le cabinet sur la période. Cash sorti. */
  totalDepenses: number;
  /** Comptes à recevoir : somme des soldes dus des factures ouvertes (point dans le temps). */
  comptesARecevoir: number;
  /** Débours à récupérer : Σ débours payés par le cabinet, refacturables, non encore recouvrés/radiés. */
  deboursARecuperer: number;
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
