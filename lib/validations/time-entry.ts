import { z } from "zod";

const timeEntryStatutEnum = z.enum(["brouillon", "valide", "facture"]);

const timeEntrySchemaBase = z.object({
  dossierId: z.string().min(1).optional().nullable(),
  clientId: z.string().min(1).optional().nullable(),
  userId: z.string().min(1, "Utilisateur requis"),
  date: z.coerce.date(),
  dureeMinutes: z.number().int().positive("Durée positive requise"),
  description: z.string().optional(),
  typeActivite: z.string().optional(),
  facturable: z.boolean().optional().default(true),
  statut: timeEntryStatutEnum.optional().default("brouillon"),
  tauxHoraire: z.number().min(0, "Taux horaire invalide"),
});

export const timeEntrySchema = timeEntrySchemaBase.refine(
  (data) => !!data.dossierId || !!data.clientId,
  { message: "Le dossier ou le client est requis", path: ["dossierId"] }
);

export const timeEntryCreateSchema = timeEntrySchema;

export const timeEntryUpdateSchema = timeEntrySchemaBase.partial().extend({
  dossierId: z.string().min(1).optional().nullable(),
  clientId: z.string().min(1).optional().nullable(),
  userId: z.string().min(1).optional(),
  date: z.coerce.date().optional(),
  dureeMinutes: z.number().int().positive().optional(),
  tauxHoraire: z.number().min(0).optional(),
});

export type TimeEntryInput = z.infer<typeof timeEntrySchema>;
export type TimeEntryCreateInput = z.infer<typeof timeEntryCreateSchema>;
export type TimeEntryUpdateInput = z.infer<typeof timeEntryUpdateSchema>;
