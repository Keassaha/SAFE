import { z } from "zod";

const dossierStatutEnum = z.enum(["ouvert", "actif", "en_attente", "cloture", "archive"]);
const dossierTypeEnum = z.enum([
  "droit_famille",
  "litige_civil",
  "criminel",
  "immigration",
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
  intitule: z.string().optional().nullable().transform((v) => (v != null && v.trim() !== "" ? v.trim() : undefined)),
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
    (v) => (v === "" || v === undefined ? null : Number(v)),
    z.number().positive().nullable()
  ),
  dateOuverture: z.coerce.date().optional(),
  dateCloture: z.coerce.date().optional().nullable(),
  retentionJusqua: z.coerce.date().optional().nullable(),
});

export type DossierInput = z.infer<typeof dossierSchema>;
