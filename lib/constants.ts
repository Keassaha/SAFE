import type { TimeEntryStatut } from "@prisma/client";

export const TIME_ACTIVITY_TYPES = [
  { value: "consultation", label: "Consultation" },
  { value: "recherche", label: "Recherche" },
  { value: "redaction", label: "Rédaction" },
  { value: "plaidoirie", label: "Plaidoirie" },
  { value: "reunion", label: "Réunion" },
  { value: "correspondance", label: "Correspondance" },
  { value: "autre", label: "Autre" },
] as const;

export const TIME_ENTRY_STATUT: Record<TimeEntryStatut, string> = {
  brouillon: "Brouillon",
  valide: "Validé",
  facture: "Facturé",
};

export const ROUNDING_OPTIONS = [6, 15, 30] as const;
export const DEFAULT_ROUNDING_MINUTES = 6;
