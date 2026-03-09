/**
 * Normalisation du fournisseur à partir de la description bancaire brute.
 * Ex: "VIDEOTRON LTEE PREAUTORISE" -> "Vidéotron"
 */

const NORMALIZE_PATTERNS: ReadonlyArray<{ pattern: RegExp; replacement: string }> = [
  { pattern: /\s*(PREAUTORISE|PRE-AUT|RECURRING|RECUR)\s*/gi, replacement: " " },
  { pattern: /\s*(LTEE|LTD|INC|CORP|CO)\s*\.?$/gi, replacement: "" },
  { pattern: /\s+#\d+\s*/g, replacement: " " },
  { pattern: /\s*\*\s*/g, replacement: " " },
  { pattern: /\s{2,}/g, replacement: " " },
  { pattern: /^\s+|\s+$/g, replacement: "" },
];

/** Map de normalisation connue (début de description → libellé propre) */
const KNOWN_SUPPLIERS: Readonly<Record<string, string>> = {
  VIDEOTRON: "Vidéotron",
  AMZN: "Amazon",
  "AMZN MKTP": "Amazon",
  "AMZN Mktp CA": "Amazon",
  STRIPE: "Stripe",
  "STRIPE*": "Stripe",
  SOQUIJ: "SOQUIJ",
  "BUREAU EN GROS": "Bureau en Gros",
  STAPLES: "Staples",
  "POSTES CANADA": "Postes Canada",
  "POSTE CANADA": "Postes Canada",
  "CANADA POST": "Postes Canada",
  MICROSOFT: "Microsoft",
  ADOBE: "Adobe",
  CANVA: "Canva",
  DROPBOX: "Dropbox",
  BELL: "Bell",
  ROGERS: "Rogers",
  PUROLATOR: "Purolator",
  FEDEX: "FedEx",
  SQ: "Square",
  "SQ *": "Square",
};

function trimAndCollapse(s: string): string {
  let out = s;
  for (const { pattern, replacement } of NORMALIZE_PATTERNS) {
    out = out.replace(pattern, replacement);
  }
  return out.trim();
}

/**
 * Normalise une description bancaire en un nom de fournisseur lisible.
 */
export function normalizeSupplier(rawDescription: string): string {
  if (!rawDescription || typeof rawDescription !== "string") return "";
  const upper = rawDescription.toUpperCase();
  for (const [key, label] of Object.entries(KNOWN_SUPPLIERS)) {
    if (upper.includes(key) || upper.startsWith(key.replace(/\*$/, ""))) {
      return label;
    }
  }
  // Extraire le premier segment significatif (souvent le nom du fournisseur)
  const cleaned = trimAndCollapse(rawDescription);
  const firstPart = cleaned.split(/\s+/)[0] ?? cleaned;
  if (firstPart.length > 2) {
    return firstPart.charAt(0).toUpperCase() + firstPart.slice(1).toLowerCase();
  }
  return cleaned.slice(0, 50) || rawDescription.slice(0, 50);
}
