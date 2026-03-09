/**
 * Types pour LexTrack — tableau de production / salle de commandement dossier juridique.
 * Alignés sur le modèle Prisma DossierActe et les enums LexTrack*.
 */

export type LexTrackPhaseIndex = 0 | 1 | 2 | 3;

export const LEXTRACK_PHASES = [
  "Instruction",
  "Mise en état",
  "Plaidoiries",
  "Délibéré",
] as const;

export type LexTrackPhaseLabel = (typeof LEXTRACK_PHASES)[number];

export const LEXTRACK_ACTE_TYPES = [
  "analyse",
  "acte",
  "recherche",
  "admin",
  "audience",
  "echeance",
] as const;

export type LexTrackActeType = (typeof LEXTRACK_ACTE_TYPES)[number];

export const LEXTRACK_STATUTS = ["todo", "inprogress", "upcoming", "done"] as const;

export type LexTrackStatut = (typeof LEXTRACK_STATUTS)[number];

export const LEXTRACK_PRIORITES = ["basse", "moyenne", "haute", "critique"] as const;

export type LexTrackPriorite = (typeof LEXTRACK_PRIORITES)[number];

export interface LexTrackLawyer {
  id: string;
  name: string;
  initials: string;
  role: string;
  color: string;
}

export interface LexTrackTask {
  id: string;
  lawyerId: string;
  phase: LexTrackPhaseIndex;
  title: string;
  type: LexTrackActeType;
  status: LexTrackStatut;
  deadline: string; // ISO date
  priority: LexTrackPriorite;
  desc: string;
  tags: string[];
}
