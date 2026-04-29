import type { DocumentType, ClassificationResult } from "./types";

const RELEVE_KEYWORDS = [
  "solde", "balance", "débit", "debit", "crédit", "credit",
  "retrait", "withdrawal", "deposit", "dépôt", "relevé", "releve",
  "statement", "scotia", "desjardins", "banque", "bank",
];

const REGISTRE_KEYWORDS = [
  "courriel", "email", "adresse", "téléphone", "telephone",
  "partie_adverse", "partie adverse", "catégorie_dossier",
  "categorie_dossier", "type_dossier", "date_ouverture",
  "langue", "n0_dossier",
];

const FICHES_TEMPS_KEYWORDS = [
  "temps (h)", "temps(h)", "heures", "durée", "duree", "duration",
  "avocat", "avocate", "lawyer", "taux $/h", "taux", "montant ($)",
  "fiche de temps", "état", "etat", "facturable", "non facturée",
  "non facturee",
];

/**
 * Indices d'une migration comptable structurée.
 * On cherche des marqueurs qui distinguent un vrai journal comptable
 * d'un simple relevé bancaire (qui partage débit/crédit).
 */
const MIGRATION_KEYWORDS = [
  "compte", "account", "no compte", "n° compte", "numero compte",
  "journal", "ledger", "grand livre", "general ledger", "gl",
  "écriture", "ecriture", "entry",
  "type transaction", "type_transaction", "transaction type",
  "source module", "source_module", "module source",
  "categorie", "catégorie", "category",
  "no dossier", "numero dossier", "n° dossier",
  "client", "tiers", "fournisseur",
  "écritures comptables", "ecritures comptables",
  "balance d'ouverture", "opening balance", "solde initial",
];

/** Marqueurs qui penchent fortement contre une migration comptable. */
const PURE_BANK_MARKERS = ["scotia", "desjardins", "rbc", "td canada", "bmo", "bmo bank"];

function normalizeStr(s: string): string {
  return s.toLowerCase().replace(/[_\s]+/g, " ").trim();
}

function scoreKeywords(inputs: string[], keywords: string[]): number {
  const normalized = inputs.map(normalizeStr);
  let hits = 0;
  for (const kw of keywords) {
    if (normalized.some((n) => n.includes(kw))) hits++;
  }
  return hits;
}

export function classifyByFileName(fileName: string): DocumentType | null {
  const lower = fileName.toLowerCase();
  if (/(grand[\s-]?livre|ledger|journal[\s-]?comptable|migration[\s-]?compt|\bgl[\s_-]|gl[_\s-]?export|comptab|chart[\s-]?of[\s-]?accounts)/i.test(lower)) {
    return "migration_comptable";
  }
  if (/relev[eé]|statement|scotia|desjardins|banque|bank/.test(lower)) return "releve_bancaire";
  if (/registre|client/i.test(lower) && !lower.includes("temps")) return "registre_clients";
  if (/fiche.*temps|time.*sheet|timesheet|temps/i.test(lower)) return "fiches_temps";
  return null;
}

export function classifyDocument(
  fileName: string,
  headers: string[],
  titleRow?: string,
): ClassificationResult {
  const ext = fileName.split(".").pop()?.toLowerCase() ?? "";
  const isPdf = ext === "pdf";

  if (isPdf) {
    return { type: "releve_bancaire", confidence: 0.85, reason: "Fichier PDF (relevé de compte)" };
  }

  const allInputs = [...headers, ...(titleRow ? [titleRow] : [])];

  const releveScore = scoreKeywords(allInputs, RELEVE_KEYWORDS);
  const registreScore = scoreKeywords(allInputs, REGISTRE_KEYWORDS);
  const tempsScore = scoreKeywords(allInputs, FICHES_TEMPS_KEYWORDS);
  const migrationScore = scoreKeywords(allInputs, MIGRATION_KEYWORDS);

  // Bonus migration: présence simultanée de débit ET crédit ET d'un autre marqueur structurant.
  const hasDebitAndCredit =
    allInputs.some((h) => /(d[ée]bit)/i.test(h)) && allInputs.some((h) => /(cr[ée]dit)/i.test(h));
  const hasJournalMarker = allInputs.some((h) =>
    /(journal|ledger|compte|account|no\s*dossier|num[ée]ro\s*dossier|categorie|cat[ée]gorie|type\s*transaction|source\s*module)/i.test(h),
  );
  const migrationBonus = hasDebitAndCredit && hasJournalMarker ? 4 : 0;

  // Malus: pur relevé bancaire (mention banque + pas de marqueurs comptables structurants).
  const looksLikePureBank = PURE_BANK_MARKERS.some((m) =>
    allInputs.some((h) => h.toLowerCase().includes(m)),
  ) && !hasJournalMarker;

  const fileNameType = classifyByFileName(fileName);

  const scores: Array<{ type: DocumentType; score: number }> = [
    {
      type: "releve_bancaire",
      score: releveScore + (fileNameType === "releve_bancaire" ? 3 : 0) + (looksLikePureBank ? 2 : 0),
    },
    { type: "registre_clients", score: registreScore + (fileNameType === "registre_clients" ? 3 : 0) },
    { type: "fiches_temps", score: tempsScore + (fileNameType === "fiches_temps" ? 3 : 0) },
    {
      type: "migration_comptable",
      score: migrationScore + migrationBonus + (fileNameType === "migration_comptable" ? 3 : 0),
    },
  ];

  scores.sort((a, b) => b.score - a.score);
  const best = scores[0]!;
  const second = scores[1]!;

  const confidence = best.score === 0
    ? 0.3
    : Math.min(0.95, 0.5 + (best.score - second.score) * 0.1 + best.score * 0.05);

  const reasons: Record<DocumentType, string> = {
    releve_bancaire: "Colonnes de relevé bancaire détectées",
    registre_clients: "Colonnes de registre clients détectées",
    fiches_temps: "Colonnes de fiches de temps détectées",
    migration_comptable: "Colonnes de migration comptable détectées (journal, comptes, débit/crédit, etc.)",
  };

  return {
    type: best.type,
    confidence,
    reason: reasons[best.type],
  };
}
