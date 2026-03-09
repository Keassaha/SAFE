import { z } from "zod";

const prioriteEnum = z.enum(["low", "medium", "high", "urgent"]);
const statutEnum = z.enum(["a_faire", "en_cours", "terminee", "annulee"]);

export const dossierTacheSchema = z.object({
  dossierId: z.string().min(1),
  titre: z.string().min(1, "Titre requis"),
  description: z.string().optional().nullable(),
  assigneeId: z.string().optional().nullable(),
  priorite: prioriteEnum.default("medium"),
  statut: statutEnum.default("a_faire"),
  dateEcheance: z.coerce.date().optional().nullable(),
});

export type DossierTacheInput = z.infer<typeof dossierTacheSchema>;
