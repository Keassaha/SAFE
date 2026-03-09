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

  const fileNameType = classifyByFileName(fileName);

  const scores: Array<{ type: DocumentType; score: number }> = [
    { type: "releve_bancaire", score: releveScore + (fileNameType === "releve_bancaire" ? 3 : 0) },
    { type: "registre_clients", score: registreScore + (fileNameType === "registre_clients" ? 3 : 0) },
    { type: "fiches_temps", score: tempsScore + (fileNameType === "fiches_temps" ? 3 : 0) },
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
  };

  return {
    type: best.type,
    confidence,
    reason: reasons[best.type],
  };
}
