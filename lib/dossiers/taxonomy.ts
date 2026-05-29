/**
 * Taxonomie de dossiers configurable par cabinet (Sujets → préfixes,
 * sous-matières bilingues). Module PUR : aucun accès base ni I/O.
 *
 * Voir docs/product/SPEC_LOT3_PREFIXES_SUJETS_SOUSMATIERES.md.
 *
 * Stockage : `Cabinet.config.dossierTaxonomy` (JSON). Si absent/malformé, le
 * lecteur retourne `null` et l'appelant retombe sur la numérotation legacy
 * `AAAA-NNN` — donc aucune régression pour les cabinets non configurés.
 */

export interface DossierSubmatter {
  labelFr: string;
  labelEn: string;
}

export interface DossierSubject {
  /** Code interne stable, ex. "IMM". Sert de clé pour les sous-matières. */
  code: string;
  /** Préfixe injecté dans le numéro de dossier, ex. "IMM" → 2026-IMM-00001. */
  prefix: string;
  labelFr: string;
  labelEn: string;
}

export interface DossierNumberingConfig {
  /** Largeur de la séquence (zéros de padding). Email Aaliyah : 5. */
  seqWidth: number;
  /** "prefix" = compteur indépendant par préfixe ; "year" = global par année. */
  scope: "prefix" | "year";
}

export interface DossierTaxonomy {
  numbering: DossierNumberingConfig;
  subjects: DossierSubject[];
  /** Sous-matières indexées par `subject.code`. Un sujet peut ne pas en avoir. */
  submatters: Record<string, DossierSubmatter[]>;
}

export const DEFAULT_NUMBERING: DossierNumberingConfig = { seqWidth: 5, scope: "prefix" };

/** Libellé d'un élément selon la locale (fallback FR). */
export function localizedLabel(item: { labelFr: string; labelEn: string }, locale: string): string {
  return locale?.toLowerCase().startsWith("en") ? item.labelEn || item.labelFr : item.labelFr;
}

export function getSubjectByCode(taxonomy: DossierTaxonomy, code: string | null | undefined): DossierSubject | null {
  if (!code) return null;
  return taxonomy.subjects.find((s) => s.code === code) ?? null;
}

/** Sous-matières d'un sujet (jamais undefined). */
export function submattersForSubject(taxonomy: DossierTaxonomy, code: string | null | undefined): DossierSubmatter[] {
  if (!code) return [];
  return taxonomy.submatters[code] ?? [];
}

/* ─────────────────────────── Parsing défensif ─────────────────────────── */

function isStr(v: unknown): v is string {
  return typeof v === "string" && v.length > 0;
}

function parseSubject(raw: unknown): DossierSubject | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if (!isStr(o.code) || !isStr(o.prefix)) return null;
  const labelFr = isStr(o.labelFr) ? o.labelFr : o.code;
  const labelEn = isStr(o.labelEn) ? o.labelEn : labelFr;
  return { code: o.code, prefix: o.prefix, labelFr, labelEn };
}

function parseSubmatter(raw: unknown): DossierSubmatter | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const labelFr = isStr(o.labelFr) ? o.labelFr : isStr(o.labelEn) ? o.labelEn : null;
  if (!labelFr) return null;
  const labelEn = isStr(o.labelEn) ? o.labelEn : labelFr;
  return { labelFr, labelEn };
}

/**
 * Lit `dossierTaxonomy` depuis l'objet config déjà parsé (JSON.parse en amont).
 * Retourne `null` si absent/malformé → numérotation legacy.
 */
export function parseDossierTaxonomy(config: unknown): DossierTaxonomy | null {
  if (!config || typeof config !== "object") return null;
  const root = (config as Record<string, unknown>).dossierTaxonomy;
  if (!root || typeof root !== "object") return null;
  const r = root as Record<string, unknown>;

  const subjects = Array.isArray(r.subjects)
    ? r.subjects.map(parseSubject).filter((s): s is DossierSubject => s !== null)
    : [];
  if (subjects.length === 0) return null; // taxonomie inutilisable

  const submatters: Record<string, DossierSubmatter[]> = {};
  if (r.submatters && typeof r.submatters === "object") {
    for (const [code, list] of Object.entries(r.submatters as Record<string, unknown>)) {
      if (!Array.isArray(list)) continue;
      submatters[code] = list.map(parseSubmatter).filter((s): s is DossierSubmatter => s !== null);
    }
  }

  const numRaw = (r.numbering && typeof r.numbering === "object" ? r.numbering : {}) as Record<string, unknown>;
  const seqWidth = typeof numRaw.seqWidth === "number" && numRaw.seqWidth > 0 ? Math.floor(numRaw.seqWidth) : DEFAULT_NUMBERING.seqWidth;
  const scope = numRaw.scope === "year" ? "year" : "prefix";

  return { numbering: { seqWidth, scope }, subjects, submatters };
}

/* ──────────────────── Catalogue Derisier (email Aaliyah) ──────────────────── */

const IMM_SUBMATTERS: DossierSubmatter[] = [
  { labelEn: "Humanitarian Application", labelFr: "Demande humanitaire" },
  { labelEn: "Sponsorship", labelFr: "Parrainage" },
  { labelEn: "Work Permit", labelFr: "Permis de travail" },
  { labelEn: "Visitor Visa", labelFr: "Permis de séjour" },
  { labelEn: "Study Permit", labelFr: "Permis d'étude" },
  { labelEn: "Immigration Appeals", labelFr: "Demande d'appel" },
  { labelEn: "Express Entry", labelFr: "Entrée express" },
  { labelEn: "Provincial Nominee", labelFr: "Programmes provinciaux" },
  { labelEn: "PR Pilot Projects", labelFr: "PR Pilot Projects" },
  { labelEn: "Refugee Claim Forms", labelFr: "Refugee Claim Forms" },
  { labelEn: "Refugee Claim Representation", labelFr: "Refugee Claim Representation" },
  { labelEn: "Invitation Letter", labelFr: "Lettre d'invitation" },
  { labelEn: "Student Support Affidavit", labelFr: "Déclaration solennelle pour étudiant" },
  { labelEn: "Complex Affidavits", labelFr: "Déclaration solennelle complexe" },
  { labelEn: "Submission letter response to immigration without follow-up", labelFr: "Réponse de soumission à l'immigration sans suivi" },
  { labelEn: "Submission letter response to immigration with follow-up", labelFr: "Réponse de soumission à l'immigration avec suivi" },
  { labelEn: "Temporary Resident Permit", labelFr: "Permis de séjour temporaire" },
  { labelEn: "Citizenship Application", labelFr: "Demande de citoyenneté" },
  { labelEn: "Humanitarian Sponsorship", labelFr: "Parrainage humanitaire" },
  { labelEn: "US Waiver", labelFr: "US Waiver" },
  { labelEn: "Procuration / Proxy", labelFr: "Procuration" },
  { labelEn: "Travel Documents / Declaration in Lieu of Guarantor", labelFr: "Documents de voyage / Déclaration tenant lieu de répondant" },
  { labelEn: "Travel Documents / Declaration in Lieu of Guarantor (1 form)", labelFr: "Documents de voyage / Déclaration tenant lieu de répondant (1 formulaire)" },
  { labelEn: "Travel Documents / Application and Declaration in Lieu of Guarantor (Respondent)", labelFr: "Documents de voyage / Demande et déclaration tenant lieu de répondant" },
  { labelEn: "Consultation", labelFr: "Consultation" },
];

const RE_SUBMATTERS: DossierSubmatter[] = [
  { labelEn: "Purchase Residential", labelFr: "Achat résidentiel" },
  { labelEn: "Purchase Commercial", labelFr: "Achat commercial" },
  { labelEn: "Sale", labelFr: "Vente" },
  { labelEn: "Sale Commercial", labelFr: "Vente commerciale" },
  { labelEn: "Condo Certificate Consultation", labelFr: "Consultation certificat de copropriété" },
  { labelEn: "Refinance", labelFr: "Refinancement" },
  { labelEn: "Express Closing", labelFr: "Fermeture expresse" },
];

const AS_SUBMATTERS: DossierSubmatter[] = [
  { labelEn: "Notarization", labelFr: "Document notarié" },
  { labelEn: "Cease and Desist Letters", labelFr: "Lettres de cessation et d'abstention" },
  { labelEn: "Demand Letters", labelFr: "Mise en demeure" },
  { labelEn: "Incorporation", labelFr: "Incorporation" },
  { labelEn: "Divorce opinion letter", labelFr: "Lettre d'opinion de divorce" },
  { labelEn: "Commercial lease", labelFr: "Bail commercial" },
  { labelEn: "Employment contract", labelFr: "Contrat d'employé" },
  { labelEn: "Wills", labelFr: "Testaments" },
];

/**
 * Catalogue exact de l'email Aaliyah (2026-05) + 9e sujet « Autres services »
 * (décision Q1). Source d'autorité pour le script de configuration Derisier.
 */
export const DERISIER_DOSSIER_TAXONOMY: DossierTaxonomy = {
  numbering: { seqWidth: 5, scope: "prefix" },
  subjects: [
    { code: "RE", prefix: "RE", labelEn: "Real Estate", labelFr: "Immobilier" },
    { code: "LAO", prefix: "LAO", labelEn: "Legal Aid Ontario", labelFr: "Aide juridique Ontario" },
    { code: "IMM", prefix: "IMM", labelEn: "Immigration", labelFr: "Immigration" },
    { code: "BS", prefix: "BS", labelEn: "Brief Service", labelFr: "Service ponctuel" },
    { code: "MIS", prefix: "MIS", labelEn: "Miscellaneous", labelFr: "Divers" },
    { code: "WE", prefix: "WE", labelEn: "Wills & Estates", labelFr: "Testaments & successions" },
    { code: "FA", prefix: "FA", labelEn: "Family", labelFr: "Famille" },
    { code: "BU", prefix: "BU", labelEn: "Business", labelFr: "Affaires" },
    { code: "AS", prefix: "AS", labelEn: "Other Services", labelFr: "Autres services" },
  ],
  submatters: {
    IMM: IMM_SUBMATTERS,
    RE: RE_SUBMATTERS,
    AS: AS_SUBMATTERS,
  },
};
