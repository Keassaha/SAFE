/**
 * Copie ESM du helper TypeScript `lib/clients/normalize-name.ts`.
 * Garder les deux fichiers synchronisés : la logique doit être identique.
 * Les tests (lib/clients/__tests__/normalize-name.test.ts) couvrent cette logique.
 */

const STOPWORDS = new Set([
  "inc",
  "incorporated",
  "incorporee",
  "ltee",
  "ltd",
  "limited",
  "limitee",
  "corp",
  "corporation",
  "co",
  "company",
  "sa",
  "sas",
  "sarl",
  "sasu",
  "sci",
  "snc",
  "scp",
  "lp",
  "llp",
  "llc",
  "pllc",
  "enr",
  "obnl",
  "asbl",
]);

export function normalizeClientName(input) {
  if (!input) return "";
  let s = input.toString();
  s = s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  s = s.replace(/['‘’ʼ`]/g, " ");
  s = s.replace(/\b([a-z](?:\.\s?[a-z])+)\.?\b/g, (m) => m.replace(/[\s.]/g, ""));
  s = s.replace(/[^a-z0-9\s]/g, " ");
  s = s
    .split(/\s+/)
    .filter((tok) => tok && !STOPWORDS.has(tok))
    .join(" ");
  return s.replace(/\s+/g, " ").trim();
}

export function clientDedupeKey(client) {
  const isPhysique = client.typeClient === "personne_physique";
  if (isPhysique) {
    const combined = [client.prenom, client.nom].filter(Boolean).join(" ");
    if (combined.trim()) {
      const tokens = normalizeClientName(combined).split(/\s+/).filter(Boolean);
      tokens.sort();
      return tokens.join(" ");
    }
  }
  if (client.raisonSociale && client.raisonSociale.trim()) {
    return normalizeClientName(client.raisonSociale);
  }
  const fallback = [client.prenom, client.nom, client.raisonSociale].filter(Boolean).join(" ");
  if (!fallback.trim()) return "";
  const tokens = normalizeClientName(fallback).split(/\s+/).filter(Boolean);
  tokens.sort();
  return tokens.join(" ");
}

export function displayClientName(c) {
  if (c.typeClient === "personne_physique") {
    const full = [c.prenom, c.nom].filter(Boolean).join(" ").trim();
    if (full) return full;
  }
  return c.raisonSociale?.trim() || [c.prenom, c.nom].filter(Boolean).join(" ").trim() || "—";
}
