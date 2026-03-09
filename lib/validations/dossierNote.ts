import { z } from "zod";

export const dossierNoteSchema = z.object({
  dossierId: z.string().min(1),
  content: z.string().min(1, "Le contenu de la note est requis").max(10000),
});

export type DossierNoteInput = z.infer<typeof dossierNoteSchema>;
