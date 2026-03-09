import { z } from "zod";

const now = new Date();
const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
const oneYearLater = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());

export const tempsQuerySchema = z.object({
  dateFrom: z.coerce.date().min(oneYearAgo).max(oneYearLater).optional(),
  dateTo: z.coerce.date().min(oneYearAgo).max(oneYearLater).optional(),
  dossierId: z.string().min(1).optional(),
  userId: z.string().min(1).optional(),
  facturable: z.enum(["true", "false"]).optional().transform((v) => v === "true" ? true : v === "false" ? false : undefined),
  facture: z.enum(["true", "false"]).optional().transform((v) => v === "true" ? true : v === "false" ? false : undefined),
  statut: z.enum(["brouillon", "valide", "facture"]).optional(),
  q: z.string().max(200).optional(),
});

export type TempsQueryInput = z.infer<typeof tempsQuerySchema>;
