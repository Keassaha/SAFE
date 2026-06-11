/**
 * ⚠️ RÉFÉRENTIEL PROVISOIRE — types de documents requis + durées de conservation.
 *
 * À RÉCONCILIER avec la source canonique de la KB :
 *   ~/Desktop/Delivery Syst/knowledge-base/modules-safe/documents/archivage-retention.md
 *   (+ types-par-domaine.md · reglementation/quebec · reglementation/ontario)
 *
 * Ce fichier KB n'était pas téléchargeable d'iCloud au moment du build (2026-06-10).
 * Les valeurs ci-dessous sont des MINIMA PRUDENTS basés sur des obligations connues
 * (Barreau du Québec B-1 r.5, ARC, Loi 25, LSO By-Law 9). Chaque entrée porte sa base
 * légale. NE PAS présenter comme vérité réglementaire avant réconciliation KB.
 *
 * Important : la LOGIQUE du moteur (couverture, états, preuve) est INDÉPENDANTE de
 * ces valeurs. Seul ce tableau bouge à la réconciliation, pas le moteur.
 */

export interface RetentionRequirement {
  /** Clé normalisée attendue dans DocumentRetentionPolicy.documentType. */
  documentType: string;
  /** Libellé lisible (FR). */
  label: string;
  /** Durée minimale de conservation (années), défaut. */
  minYears: number;
  /** Override de durée par province (ex. fidéicommis ON = 10 ans). */
  minYearsByProvince?: Record<string, number>;
  /** Base légale (provisoire, à confirmer KB). */
  legalBasis: string;
  /** Provinces où ce type est requis ("all" = partout). */
  provinces: "all" | string[];
  /** Formes alternatives acceptées (seront normalisées) pour le matching. */
  aliases?: string[];
}

export const RETENTION_REQUIREMENTS: readonly RetentionRequirement[] = [
  {
    documentType: "mandat_engagement",
    label: "Mandat / convention d'honoraires",
    minYears: 7,
    legalBasis: "Barreau — dossier client (provisoire)",
    provinces: "all",
    aliases: ["mandat", "convention_honoraires", "lettre_mandat", "engagement"],
  },
  {
    documentType: "correspondance",
    label: "Correspondance du dossier",
    minYears: 7,
    legalBasis: "Barreau — dossier client (provisoire)",
    provinces: "all",
    aliases: ["courriels", "lettres"],
  },
  {
    documentType: "piece_identite",
    label: "Vérification d'identité (KYC)",
    minYears: 7,
    legalBasis: "Loi 25 / vérification d'identité (provisoire)",
    provinces: "all",
    aliases: ["identite", "kyc", "verification_identite", "piece_d_identite"],
  },
  {
    documentType: "contrat",
    label: "Contrats et ententes",
    minYears: 7,
    legalBasis: "Dossier client (provisoire)",
    provinces: "all",
    aliases: ["entente", "contrats"],
  },
  {
    documentType: "document_judiciaire",
    label: "Actes de procédure et jugements",
    minYears: 7,
    legalBasis: "Dossier client (provisoire)",
    provinces: "all",
    aliases: ["actes_procedure", "jugement", "procedure"],
  },
  {
    documentType: "comptabilite_dossier",
    label: "Comptabilité du dossier (factures, déboursés)",
    minYears: 7,
    legalBasis: "ARC ~6 ans + marge / Barreau (provisoire)",
    provinces: "all",
    aliases: ["factures", "debourses", "comptabilite"],
  },
  {
    documentType: "fideicommis",
    label: "Registres et relevés de fidéicommis",
    minYears: 7,
    minYearsByProvince: { ON: 10 },
    legalBasis: "B-1 r.5 (QC) / By-Law 9 §22 (ON) (provisoire)",
    provinces: "all",
    aliases: ["fiducie", "trust", "registre_fideicommis"],
  },
];

/**
 * Normalise une chaîne de type de document pour un matching tolérant
 * (minuscules, sans accents, séparateurs unifiés en "_").
 */
export function normalizeDocType(raw: string): string {
  const decomposed = raw.normalize("NFD");
  let stripped = "";
  for (const ch of decomposed) {
    const code = ch.codePointAt(0) ?? 0;
    // Ignore les marques diacritiques combinantes (U+0300–U+036F).
    if (code >= 0x300 && code <= 0x36f) continue;
    stripped += ch;
  }
  return stripped
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

/** Normalise une province en code majuscule (ex. " qc " -> "QC"). */
export function normalizeProvince(p: string | null | undefined): string | null {
  if (!p) return null;
  const v = p.trim().toUpperCase();
  return v.length > 0 ? v : null;
}

/** Liste des exigences applicables à une province donnée. */
export function requirementsForProvince(province: string | null): RetentionRequirement[] {
  const prov = normalizeProvince(province);
  return RETENTION_REQUIREMENTS.filter(
    (r) => r.provinces === "all" || (prov !== null && r.provinces.includes(prov)),
  );
}

/** Durée minimale applicable pour une exigence dans une province. */
export function minYearsFor(req: RetentionRequirement, province: string | null): number {
  const prov = normalizeProvince(province);
  if (prov && req.minYearsByProvince?.[prov] !== undefined) {
    return req.minYearsByProvince[prov];
  }
  return req.minYears;
}
