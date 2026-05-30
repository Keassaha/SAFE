/**
 * Normalise un nom de client pour la détection de doublons.
 *
 * Le résultat doit être stable et insensible à :
 *  - majuscules / minuscules
 *  - accents (é, è, à, ç, etc.)
 *  - espaces multiples / espaces autour
 *  - ponctuation usuelle (virgules, points, tirets, apostrophes…)
 *  - abréviations courantes des formes juridiques (Inc., Ltée, Ltd., Corp., S.A., SAS…)
 *
 * Deux clients dont les noms produisent la même clé sont considérés identiques.
 *
 * @example
 *   normalizeClientName("Acme Inc.")       // "acme"
 *   normalizeClientName("ACME, Inc")        // "acme"
 *   normalizeClientName("Café  Du  Coin")   // "cafe du coin"
 *   normalizeClientName("Société Générale") // "societe generale"
 */
export function normalizeClientName(input: string | null | undefined): string {
  if (!input) return "";
  let s = input.toString();

  // 1. Lowercase + strip diacritics (é → e, ç → c).
  s = s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

  // 2. Remove typographic apostrophes / quotes (Marie d'Or → Marie d Or).
  s = s.replace(/['‘’ʼ`]/g, " ");

  // 3a. Join dotted abbreviations like "S.A.", "L.L.P.", "B.V." into a single
  //     token ("sa", "llp", "bv") so step 4 can match them in STOPWORDS.
  s = s.replace(/\b([a-z](?:\.\s?[a-z])+)\.?\b/g, (m) => m.replace(/[\s.]/g, ""));

  // 3b. Replace remaining non-alphanumeric chars (except spaces) with a space.
  //     Catches dots, commas, slashes, parens, hyphens, etc.
  s = s.replace(/[^a-z0-9\s]/g, " ");

  // 4. Strip well-known legal-form abbreviations as standalone tokens.
  //    These are noise for duplicate detection (Acme Inc. == Acme).
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
  s = s
    .split(/\s+/)
    .filter((tok) => tok && !STOPWORDS.has(tok))
    .join(" ");

  // 5. Collapse runs of whitespace and trim.
  return s.replace(/\s+/g, " ").trim();
}

/**
 * Libellé d'affichage d'un client, robuste aux personnes physiques.
 *
 * `raisonSociale` est `null` pour les personnes physiques : on retombe alors
 * sur `prénom + nom`. Source de vérité unique pour tous les écrans (facturation,
 * temps, dossiers) afin qu'aucune personne physique n'apparaisse "vide".
 *
 * @example
 *   clientDisplayName({ raisonSociale: "Acme Inc." })            // "Acme Inc."
 *   clientDisplayName({ prenom: "Marie", nom: "Tremblay" })       // "Marie Tremblay"
 *   clientDisplayName({})                                          // "—"
 */
export function clientDisplayName(
  client: {
    raisonSociale?: string | null;
    prenom?: string | null;
    nom?: string | null;
  },
  fallback = "—",
): string {
  if (client.raisonSociale && client.raisonSociale.trim()) {
    return client.raisonSociale.trim();
  }
  const personne = [client.prenom, client.nom].filter(Boolean).join(" ").trim();
  return personne || fallback;
}

/**
 * Calcule la clé de doublon canonique pour un client.
 *
 * Pour une personne physique on combine prénom + nom (ordre alphabétique des
 * tokens, pour absorber l'inversion "Marie Tremblay" / "Tremblay Marie").
 * Pour une personne morale on utilise la raison sociale.
 * En dernier recours on retombe sur n'importe lequel des champs disponibles.
 */
export function clientDedupeKey(client: {
  typeClient?: string | null;
  raisonSociale?: string | null;
  prenom?: string | null;
  nom?: string | null;
}): string {
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
  // Fallback: any name we can find.
  const fallback = [client.prenom, client.nom, client.raisonSociale].filter(Boolean).join(" ");
  if (!fallback.trim()) return "";
  const tokens = normalizeClientName(fallback).split(/\s+/).filter(Boolean);
  tokens.sort();
  return tokens.join(" ");
}
