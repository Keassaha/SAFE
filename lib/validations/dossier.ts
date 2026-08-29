import { z } from "zod";

const dossierStatutEnum = z.enum(["ouvert", "actif", "en_attente", "cloture", "archive"]);
const dossierTypeEnum = z.enum([
  "droit_famille",
  "litige_civil",
  "criminel",
  "immigration",
  "immobilier",
  "corporate",
  "autre",
]);
const modeFacturationEnum = z.enum(["horaire", "forfait", "retainer", "contingent"]);

export const dossierSchema = z.object({
  clientId: z.string().min(1, "Client requis"),
  avocatResponsableId: z.string().optional().nullable(),
  assistantJuridiqueId: z.string().optional().nullable(),
  reference: z.string().optional().nullable().transform((v) => (v != null && v.trim() !== "" ? v.trim() : undefined)),
  numeroDossier: z
    .string()
    .optional()
    .nullable()
    .refine(
      (v) =>
        v == null ||
        (typeof v === "string" && (v.trim() === "" || /^\d{4}-\d+$/.test(v.trim()))),
      { message: "Format attendu : AAAA-NNN (ex. 2025-777)" }
    )
    .transform((v) =>
      v != null && typeof v === "string" && v.trim() !== "" ? v.trim() : undefined
    ),
  /**
   * OBLIGATOIRE depuis le 2026-08-27, décision CEO.
   *
   * Il était `optional().nullable()`, ce qui CONTREDISAIT le schéma Prisma où
   * la colonne est `intitule String`, donc NOT NULL. Le serveur comblait le
   * vide en écrivant « Dossier », et les fiches s'intitulaient « 2026-050 —
   * Dossier » : un numéro suivi d'un mot qui n'apprend rien.
   *
   * Trois caractères au minimum : « M. » ou « c. » ne sont pas des intitulés,
   * et un espace seul passait la validation précédente.
   *
   * Aucune migration de base n'est requise, la colonne l'exigeait déjà.
   */
  intitule: z
    .string({ required_error: "L'intitulé du dossier est obligatoire." })
    .transform((v) => v.trim())
    .pipe(
      z
        .string()
        .min(3, "L'intitulé doit compter au moins trois caractères.")
        .max(200, "L'intitulé ne peut pas dépasser 200 caractères."),
    ),
  statut: dossierStatutEnum.default("actif"),
  type: z.preprocess(
    (v) => (v === "" || v === undefined ? null : v),
    dossierTypeEnum.nullable()
  ),
  descriptionConfidentielle: z.string().optional().nullable(),
  resumeDossier: z.string().optional().nullable(),
  notesStrategieJuridique: z.string().optional().nullable(),
  tribunalNom: z.string().optional().nullable(),
  districtJudiciaire: z.string().optional().nullable(),
  numeroDossierTribunal: z.string().optional().nullable(),
  nomJuge: z.string().optional().nullable(),
  modeFacturation: z.preprocess(
    (v) => (v === "" || v === undefined ? null : v),
    modeFacturationEnum.nullable()
  ),
  tauxHoraire: z.preprocess(
    (v) => (v === "" || v === undefined || v === null ? null : Number(v)),
    z.number().positive().nullable()
  ),
  dateOuverture: z.coerce.date().optional(),
  dateCloture: z.coerce.date().optional().nullable(),
  retentionJusqua: z.coerce.date().optional().nullable(),
});

export type DossierInput = z.infer<typeof dossierSchema>;
