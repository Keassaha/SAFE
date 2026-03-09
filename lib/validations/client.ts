import { z } from "zod";

export const typeClientEnum = z.enum(["personne_physique", "personne_morale"]);

export const clientSchema = z.object({
  raisonSociale: z.string().min(1, "Raison sociale requise"),
  typeClient: typeClientEnum.optional().default("personne_morale"),
  prenom: z.string().optional(),
  nom: z.string().optional(),
  dateNaissance: z.coerce.date().optional().nullable(),
  numeroRegistreEntreprise: z.string().optional(),
  contact: z.string().optional(),
  email: z.string().email("Email invalide").optional().or(z.literal("")),
  emailSecondaire: z.string().email().optional().or(z.literal("")),
  telephone: z.string().optional(),
  telephoneSecondaire: z.string().optional(),
  adresse: z.string().optional(),
  addressLine1: z.string().optional(),
  addressLine2: z.string().optional(),
  city: z.string().optional(),
  province: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().optional(),
  preferredContactMethod: z.enum(["email", "phone", "mail"]).optional(),
  langue: z.string().optional(),
  consentementCollecteAt: z.coerce.date().optional().nullable(),
  finalitesConsentement: z.string().optional().nullable(),
  retentionJusqua: z.coerce.date().optional().nullable(),
  notesConfidentielles: z.string().optional().nullable(),
  assignedLawyerId: z.string().optional(),
  representationType: z.enum(["plaintiff", "defendant", "advisor"]).optional(),
  retainerSigned: z.coerce.boolean().optional(),
  retainerDate: z.coerce.date().optional().nullable(),
  billingContactName: z.string().optional(),
  billingEmail: z.string().optional(),
  billingAddress: z.string().optional(),
  paymentTerms: z.string().optional(),
  preferredPaymentMethod: z.enum(["card", "transfer", "trust", "cheque"]).optional(),
  conflictChecked: z.coerce.boolean().optional(),
  conflictCheckDate: z.coerce.date().optional().nullable(),
  conflictNotes: z.string().optional(),
});

export type ClientInput = z.infer<typeof clientSchema>;
