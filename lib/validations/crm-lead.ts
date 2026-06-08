import { z } from "zod";

/**
 * Validation pour la création/édition d'un Lead CRM (Console SAFE Inc.).
 * Aligné sur le modèle Prisma Lead.
 */

export const crmProvinceEnum = z.enum(["QC", "ON", "NB", "MB", "BC", "AB", "AUTRE"]);
export const crmLangueEnum = z.enum(["FR", "EN", "BILINGUE"]);
export const tailleCabinetEnum = z.enum([
  "SOLO",
  "DEUX_CINQ",
  "SIX_DIX",
  "ONZE_VINGT",
  "VINGT_UN_CINQUANTE",
  "PLUS_CINQUANTE",
]);
export const modeFacturationEnum = z.enum(["HORAIRE", "FORFAIT", "MIXTE"]);
export const sourceLeadEnum = z.enum([
  "LINKEDIN_DM_WARM",
  "LINKEDIN_DM_COLD",
  "LINKEDIN_POST",
  "SEO_ORGANIC",
  "SEO_LOCAL_BUSINESS",
  "REFERRAL",
  "AUDIT_GRATUIT",
  "EMAIL",
  "FACEBOOK_GROUP",
  "RECRUITMENT_AGENCY",
  "OFFLINE",
]);

export const createLeadSchema = z.object({
  raisonSociale: z.string().min(2, "Nom du cabinet requis (min. 2 caractères)"),
  province: crmProvinceEnum,
  ville: z.string().optional().or(z.literal("")),
  langue: crmLangueEnum.default("FR"),
  siteWeb: z.string().url("URL invalide").optional().or(z.literal("")),
  linkedinUrl: z.string().url("URL invalide").optional().or(z.literal("")),
  tailleCabinet: tailleCabinetEnum,
  domainesPratique: z.array(z.string()).default([]),
  modeFacturation: modeFacturationEnum.optional(),
  aTrustAccounting: z.boolean().default(false),
  logicielActuel: z.string().optional().or(z.literal("")),
  nbAvocatsEstime: z.coerce.number().int().min(0).optional(),
  sourceLead: sourceLeadEnum,
  notesPrivees: z.string().optional().or(z.literal("")),
});

export type CreateLeadInput = z.infer<typeof createLeadSchema>;

/**
 * Calcule le score firmographique (0-40) selon les règles de la spec CRM.
 * Les dimensions engagement (0-40) et enrichissement (0-20) se calculent
 * plus tard quand des activités et contacts existent.
 */
export function computeFirmographicScore(input: {
  province: string;
  tailleCabinet: string;
  aTrustAccounting: boolean;
  domainesPratique: string[];
}): number {
  let score = 0;

  if (input.province === "QC") score += 10;

  if (["DEUX_CINQ", "SIX_DIX", "ONZE_VINGT"].includes(input.tailleCabinet)) {
    score += 20;
  } else if (input.tailleCabinet === "SOLO") {
    score += 10;
  }

  if (input.aTrustAccounting) score += 5;

  const domaines = input.domainesPratique.map((d) => d.toLowerCase());
  if (domaines.some((d) => d.includes("famille") || d.includes("immobilier"))) {
    score += 5;
  }

  return Math.min(40, score);
}
