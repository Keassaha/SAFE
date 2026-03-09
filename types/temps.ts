import type { TimeEntry, TimeEntryStatut } from "@prisma/client";

export type { TimeEntryStatut };

export interface TimeEntryWithRelations extends TimeEntry {
  dossier: { id: string; intitule: string; numeroDossier: string | null; reference: string | null; client: { raisonSociale: string } };
  user: { id: string; nom: string };
  invoiceLines: { id: string }[];
}

export interface TimeEntryFilters {
  dateFrom?: string;
  dateTo?: string;
  dossierId?: string;
  userId?: string;
  facturable?: boolean;
  facture?: boolean;
  statut?: TimeEntryStatut;
  q?: string;
}
