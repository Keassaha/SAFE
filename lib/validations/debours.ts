import { z } from "zod";

export const deboursDossierSchema = z.object({
  dossierId: z.string().min(1, "Dossier requis"),
  clientId: z.string().min(1, "Client requis"),
  deboursTypeId: z.string().optional().nullable(),
  description: z.string().min(1, "Description requise").max(2000),
  quantite: z.number().min(0.001, "Quantité doit être supérieure à 0").default(1),
  montant: z.number().min(0.01, "Montant doit être supérieur à 0"),
  taxable: z.boolean().default(false),
  date: z.coerce.date(),
  payeParCabinet: z.boolean().default(true),
  refacturable: z.boolean().default(true),
});

export type DeboursDossierInput = z.infer<typeof deboursDossierSchema>;
