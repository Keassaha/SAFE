import { z } from "zod";

export const paymentSchema = z.object({
  invoiceId: z.string().min(1, "Facture requise"),
  montant: z.number().positive("Montant positif requis"),
  datePaiement: z.coerce.date(),
  mode: z.string().min(1, "Mode de paiement requis"),
  reference: z.string().optional(),
});

export type PaymentInput = z.infer<typeof paymentSchema>;
