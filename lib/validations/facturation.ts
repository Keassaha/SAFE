import { z } from "zod";

export const creerFactureDepuisTempsSchema = z
  .object({
    clientId: z.string().min(1, "Client requis"),
    dossierId: z.string().optional().nullable(),
    timeEntryIds: z.array(z.string().min(1)).default([]),
    expenseIds: z.array(z.string().min(1)).optional().default([]),
  })
  .refine(
    (data) => data.timeEntryIds.length > 0 || (data.expenseIds?.length ?? 0) > 0,
    { message: "Au moins une fiche de temps ou un débours requis" }
  );

export type CreerFactureDepuisTempsInput = z.infer<typeof creerFactureDepuisTempsSchema>;

export const facturationHonorairesQuerySchema = z.object({
  clientId: z.string().optional(),
  dossierId: z.string().optional(),
  userId: z.string().optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  q: z.string().max(200).optional(),
});

export type FacturationHonorairesQueryInput = z.infer<typeof facturationHonorairesQuerySchema>;

export const invoiceItemUpdateSchema = z.object({
  id: z.string().optional(),
  description: z.string().min(1),
  date: z.coerce.date(),
  hours: z.number().min(0).optional().nullable(),
  rate: z.number().min(0).optional().nullable(),
  amount: z.number().min(0),
  type: z.enum(["honoraires", "debours_taxable", "debours_non_taxable", "frais_rappel", "interets", "rabais"]),
  timeEntryId: z.string().optional().nullable(),
  userId: z.string().optional().nullable(),
  professionalDisplayName: z.string().optional().nullable(),
  parentItemId: z.string().optional().nullable(),
  parentLineId: z.string().optional().nullable(),
  validationComment: z.string().max(2000).optional().nullable(),
});

export const patchFactureSchema = z.object({
  dateEmission: z.coerce.date().optional(),
  dateEcheance: z.coerce.date().optional(),
  tauxInteret: z.number().min(0).optional().nullable(),
  dateLimiteInterets: z.coerce.date().optional().nullable(),
  items: z.array(invoiceItemUpdateSchema).optional(),
});

export type PatchFactureInput = z.infer<typeof patchFactureSchema>;

/** Ligne de facture unifiée (module billing) */
const lineTypeEnum = z.enum([
  "fee",
  "expense",
  "adjustment",
  "interest",
  "credit",
  "trust_application",
]);
const sourceTypeEnum = z.enum([
  "time_entry",
  "expense",
  "manual",
  "interest_run",
  "credit_note",
  "trust",
]);

export const invoiceLineSchema = z.object({
  id: z.string().optional(),
  lineType: lineTypeEnum.optional().default("fee"),
  sourceType: sourceTypeEnum.optional().default("manual"),
  sourceId: z.string().optional().nullable(),
  matterId: z.string().optional().nullable(),
  serviceDate: z.coerce.date().optional().nullable(),
  description: z.string().min(1),
  quantity: z.number().min(0).default(1),
  unitRate: z.number().min(0).optional().nullable(),
  lineSubtotal: z.number(),
  taxable: z.boolean().default(true),
  gstAmount: z.number().min(0).optional().default(0),
  qstAmount: z.number().min(0).optional().default(0),
  lineTotal: z.number().optional(),
  sortOrder: z.number().int().min(0).optional().default(0),
});

export const createOrUpdateInvoiceSchema = z.object({
  clientId: z.string().min(1),
  primaryMatterId: z.string().optional().nullable(),
  invoiceDate: z.coerce.date(),
  dueDate: z.coerce.date(),
  currency: z.string().max(3).optional().default("CAD"),
  clientNote: z.string().optional().nullable(),
  internalNote: z.string().optional().nullable(),
  lines: z.array(invoiceLineSchema).optional().default([]),
});

/** Paiement */
export const createPaymentSchema = z.object({
  clientId: z.string().min(1),
  paymentDate: z.coerce.date(),
  amount: z.number().positive(),
  paymentMethod: z.enum([
    "cash",
    "cheque",
    "e_transfer",
    "card",
    "bank_transfer",
    "trust",
    "other",
  ]).optional().default("other"),
  referenceNumber: z.string().optional().nullable(),
  sourceAccountType: z.enum(["operating", "trust", "external"]).optional().default("operating"),
  note: z.string().optional().nullable(),
  invoiceId: z.string().optional().nullable(),
  allocatedAmount: z.number().min(0).optional(),
});

/** Modification d'un paiement (champs modifiables uniquement) */
export const patchPaymentSchema = z.object({
  paymentDate: z.coerce.date().optional(),
  amount: z.number().positive().optional(),
  paymentMethod: z.enum([
    "cash",
    "cheque",
    "e_transfer",
    "card",
    "bank_transfer",
    "trust",
    "other",
  ]).optional(),
  referenceNumber: z.string().optional().nullable(),
  sourceAccountType: z.enum(["operating", "trust", "external"]).optional(),
  note: z.string().optional().nullable(),
});

export type PatchPaymentInput = z.infer<typeof patchPaymentSchema>;

/** Allocations d'un paiement */
export const paymentAllocationsSchema = z.object({
  paymentId: z.string().min(1),
  allocations: z.array(
    z.object({
      invoiceId: z.string().min(1),
      allocatedAmount: z.number().positive(),
    })
  ),
}).refine(
  (data) => {
    const total = data.allocations.reduce((s, a) => s + a.allocatedAmount, 0);
    return total > 0;
  },
  { message: "Au moins une allocation avec montant > 0" }
);

/** Note de crédit */
export const createCreditNoteSchema = z.object({
  invoiceId: z.string().min(1),
  reason: z.string().optional().nullable(),
  creditAmount: z.number().positive().optional(),
  creditFull: z.boolean().optional().default(false),
});

/** Application d'une note de crédit */
export const applyCreditNoteSchema = z.object({
  creditNoteId: z.string().min(1),
  invoiceId: z.string().min(1),
  appliedAmount: z.number().positive(),
});

/** Relance */
export const createReminderSchema = z.object({
  invoiceId: z.string().min(1),
  reminderType: z.enum(["reminder_1", "reminder_2", "final_notice", "interest_notice"]),
  channel: z.enum(["email", "manual", "printed"]).optional().default("manual"),
  note: z.string().optional().nullable(),
});
