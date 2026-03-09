import { z } from "zod";

export const invoiceSchema = z.object({
  clientId: z.string().min(1, "Client requis"),
  dateEmission: z.coerce.date(),
  dateEcheance: z.coerce.date(),
  tauxInteret: z.number().min(0).optional().nullable(),
  dateLimiteInterets: z.coerce.date().optional().nullable(),
});

export const invoiceLineSchema = z.object({
  description: z.string().min(1, "Description requise"),
  quantite: z.number().positive("Quantité positive"),
  tauxUnitaire: z.number().min(0, "Taux invalide"),
});

export type InvoiceInput = z.infer<typeof invoiceSchema>;
export type InvoiceLineInput = z.infer<typeof invoiceLineSchema>;
