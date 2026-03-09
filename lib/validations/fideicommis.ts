import { z } from "zod";

export const trustModePaiementSchema = z.enum([
  "CHEQUE",
  "VIREMENT",
  "INTERAC",
  "ESPECES",
  "AUTRE",
]);
export type TrustModePaiementInput = z.infer<typeof trustModePaiementSchema>;

export const depotBodySchema = z.object({
  clientId: z.string().min(1, "Client obligatoire"),
  dossierId: z.string().min(1, "Dossier obligatoire"),
  montant: z.number().positive("Le montant doit être strictement positif"),
  dateTransaction: z.coerce.date(),
  modePaiement: trustModePaiementSchema,
  reference: z.string().max(200).optional().nullable(),
  description: z.string().max(2000).optional().nullable(),
});
export type DepotBodyInput = z.infer<typeof depotBodySchema>;

export const retraitBodySchema = z.object({
  clientId: z.string().min(1, "Client obligatoire"),
  dossierId: z.string().min(1, "Dossier obligatoire"),
  montant: z.number().positive("Le montant doit être strictement positif"),
  dateTransaction: z.coerce.date(),
  factureId: z.string().optional().nullable(),
  modePaiement: trustModePaiementSchema.optional().nullable(),
  reference: z.string().max(200).optional().nullable(),
  description: z.string().max(2000).optional().nullable(),
});
export type RetraitBodyInput = z.infer<typeof retraitBodySchema>;

export const correctionBodySchema = z.object({
  clientId: z.string().min(1, "Client obligatoire"),
  dossierId: z.string().min(1, "Dossier obligatoire"),
  montant: z.number(),
  dateTransaction: z.coerce.date(),
  correctionOfId: z.string().min(1, "Transaction à corriger obligatoire"),
  description: z.string().min(1, "Raison de la correction obligatoire"),
  reference: z.string().max(200).optional().nullable(),
});
export type CorrectionBodyInput = z.infer<typeof correctionBodySchema>;

export const transactionsQuerySchema = z.object({
  clientId: z.string().optional(),
  dossierId: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(500).optional().default(100),
  cursor: z.string().optional(),
});
export type TransactionsQueryInput = z.infer<typeof transactionsQuerySchema>;

export const soldeQuerySchema = z.object({
  dossierId: z.string().optional(),
});
export type SoldeQueryInput = z.infer<typeof soldeQuerySchema>;

export const releveQuerySchema = z.object({
  mois: z.coerce.number().int().min(1).max(12),
  annee: z.coerce.number().int().min(2000).max(2100),
  clientId: z.string().optional(),
  dossierId: z.string().optional(),
});
export type ReleveQueryInput = z.infer<typeof releveQuerySchema>;
