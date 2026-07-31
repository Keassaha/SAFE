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

/**
 * Motif réglementaire du retrait. Le règlement ne permet que trois retraits du
 * compte général en fidéicommis au Québec (B-1 r.5 art. 56) et cinq en Ontario
 * (By-Law 9 s. 9(1)). Le motif est donc obligatoire : c'est ce qui rend le retrait
 * licite, et c'est « l'objet pour lequel le débours est effectué » de l'art. 38(2)f.
 */
export const trustWithdrawalMotiveSchema = z.enum([
  "REMISE_CLIENT_OU_TIERS",
  "HONORAIRES_DEBOURS_FACTURES",
  "TRANSFERT_AUTRE_FIDEICOMMIS",
  "DEPOT_PAR_INADVERTANCE",
]);
export type TrustWithdrawalMotiveInput = z.infer<typeof trustWithdrawalMotiveSchema>;

/**
 * Modes de retrait admis. `ESPECES` est volontairement ABSENT : l'art. 57 QC
 * interdit tout retrait en espèces d'un compte général en fidéicommis, et la
 * s. 11(a) ON interdit les chèques payables à « cash » ou au porteur. Le refus est
 * aussi appliqué côté service : le schéma est une commodité, pas le garde-fou.
 */
export const trustWithdrawalModeSchema = z.enum(["CHEQUE", "VIREMENT", "INTERAC", "AUTRE"]);

export const retraitBodySchema = z
  .object({
    clientId: z.string().min(1, "Client obligatoire"),
    dossierId: z.string().min(1, "Dossier obligatoire"),
    montant: z.number().positive("Le montant doit être strictement positif"),
    dateTransaction: z.coerce.date(),
    motive: trustWithdrawalMotiveSchema,
    factureId: z.string().optional().nullable(),
    modePaiement: trustWithdrawalModeSchema.optional().nullable(),
    reference: z.string().max(200).optional().nullable(),
    description: z.string().max(2000).optional().nullable(),
  })
  .refine((v) => v.motive !== "HONORAIRES_DEBOURS_FACTURES" || Boolean(v.factureId), {
    message:
      "Un retrait pour honoraires et débours doit être rattaché à une facture émise et envoyée (art. 56(2) B-1 r.5 / s. 9(1)3 By-Law 9).",
    path: ["factureId"],
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
