import { z } from "zod";

const typeEnum = z.enum(["audience", "reunion_client", "echeance", "depot"]);

export const dossierEvenementSchema = z.object({
  dossierId: z.string().min(1),
  type: typeEnum,
  titre: z.string().min(1, "Titre requis"),
  date: z.coerce.date(),
  lieu: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export type DossierEvenementInput = z.infer<typeof dossierEvenementSchema>;
