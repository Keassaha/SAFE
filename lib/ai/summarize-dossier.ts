import Anthropic from "@anthropic-ai/sdk";

/** Données structurées d'un dossier fournies à l'IA pour le résumé. */
export interface DossierSummaryInput {
  intitule: string;
  type: string | null;
  sousType: string | null;
  statut: string;
  clientNom: string;
  dateOuverture: string | null;
  tribunal: string | null;
  numeroDossierTribunal: string | null;
  modeFacturation: string | null;
  /** Champs spécifiques au domaine (immigration, immobilier...) déjà aplatis en libellés. */
  champsDomaine: { label: string; valeur: string }[];
  taches: { titre: string; statut: string; echeance: string | null }[];
  pieces: { titre: string; statut: string }[];
  procedures: { type: string; date: string | null; statut: string }[];
  jugements: { type: string; date: string | null }[];
  notes: string[];
  /** Extraits de texte des documents (nom + aperçu). */
  documents: { nom: string; type: string | null; extrait: string }[];
}

/** Résumé structuré produit par l'IA. */
export interface DossierSummary {
  synthese: string;
  parties: string[];
  etatAvancement: string;
  echeances: { date: string | null; libelle: string }[];
  piecesCles: string[];
  prochainesActions: string[];
  pointsAttention: string[];
  incertitudes: string[];
  /** Version prose (enregistrable dans Dossier.resumeDossier). */
  resumeTexte: string;
}

function asStringArray(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.filter((x): x is string => typeof x === "string" && x.trim().length > 0);
}

function asEcheances(v: unknown): { date: string | null; libelle: string }[] {
  if (!Array.isArray(v)) return [];
  return v
    .map((e) => {
      const obj = e as { date?: unknown; libelle?: unknown };
      const libelle = typeof obj?.libelle === "string" ? obj.libelle : null;
      if (!libelle) return null;
      return { date: typeof obj?.date === "string" ? obj.date : null, libelle };
    })
    .filter((x): x is { date: string | null; libelle: string } => x !== null);
}

/**
 * Génère un résumé structuré d'un dossier à partir de ses données et pièces.
 *
 * GARDE-FOUS (conformité Barreau) :
 * - Résumé FACTUEL uniquement : aucun conseil ni stratégie juridique.
 * - Toute incertitude est explicitement marquée (champ `incertitudes`).
 * - Validation humaine obligatoire avant tout usage.
 *
 * Retourne `null` si la clé API est absente ou en cas d'échec (le caller gère).
 */
export async function summarizeDossier(input: DossierSummaryInput): Promise<DossierSummary | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.warn("ANTHROPIC_API_KEY manquant — résumé IA désactivé");
    return null;
  }

  const client = new Anthropic({ apiKey });

  const section = (title: string, lines: string[]) =>
    lines.length ? `${title}\n${lines.map((l) => `- ${l}`).join("\n")}` : "";

  const docsStr = input.documents
    .map(
      (d, i) =>
        `Document ${i + 1} — ${d.nom}${d.type ? ` (${d.type})` : ""}\n"""\n${d.extrait.slice(0, 1500)}\n"""`,
    )
    .join("\n\n");

  const contexte = [
    `INTITULÉ: ${input.intitule}`,
    `CLIENT: ${input.clientNom}`,
    input.type ? `TYPE: ${input.type}${input.sousType ? ` / ${input.sousType}` : ""}` : "",
    `STATUT: ${input.statut}`,
    input.dateOuverture ? `OUVERTURE: ${input.dateOuverture}` : "",
    input.tribunal ? `TRIBUNAL: ${input.tribunal}${input.numeroDossierTribunal ? ` (#${input.numeroDossierTribunal})` : ""}` : "",
    section("CHAMPS SPÉCIFIQUES:", input.champsDomaine.map((c) => `${c.label}: ${c.valeur}`)),
    section("TÂCHES:", input.taches.map((t) => `${t.titre} [${t.statut}]${t.echeance ? ` échéance ${t.echeance}` : ""}`)),
    section("PIÈCES:", input.pieces.map((p) => `${p.titre} [${p.statut}]`)),
    section("PROCÉDURES:", input.procedures.map((p) => `${p.type}${p.date ? ` (${p.date})` : ""} [${p.statut}]`)),
    section("JUGEMENTS:", input.jugements.map((j) => `${j.type}${j.date ? ` (${j.date})` : ""}`)),
    section("NOTES:", input.notes),
  ]
    .filter(Boolean)
    .join("\n");

  const prompt = `Tu es un assistant de synthèse pour un cabinet d'avocats québécois. Tu produis un résumé FACTUEL d'un dossier à partir de ses données et de ses pièces.

RÈGLES STRICTES :
- Résume uniquement des FAITS présents dans les données fournies. N'invente rien.
- NE DONNE JAMAIS de conseil juridique, d'opinion ni de stratégie. Tu décris, tu ne recommandes pas d'action juridique.
- Les "prochaines actions" sont uniquement administratives/organisationnelles (ex: « obtenir la pièce X manquante », « confirmer la date d'audience »), jamais juridiques.
- Si une information est absente, incertaine ou contradictoire, indique-le dans "incertitudes". Ne comble pas les trous.
- Écris en français, ton neutre et professionnel.

DONNÉES DU DOSSIER :
${contexte}

${docsStr ? `EXTRAITS DE DOCUMENTS :\n${docsStr}` : "(aucun extrait de document disponible)"}

Réponds UNIQUEMENT en JSON valide, format exact :
{
  "synthese": "2 à 4 phrases résumant l'objet et la situation du dossier",
  "parties": ["partie 1", "partie 2"],
  "etatAvancement": "1 à 2 phrases sur l'état d'avancement actuel",
  "echeances": [{"date": "AAAA-MM-JJ ou null", "libelle": "description de l'échéance"}],
  "piecesCles": ["pièce/document important 1"],
  "prochainesActions": ["action administrative 1"],
  "pointsAttention": ["élément à surveiller (ex: pièce manquante, échéance proche)"],
  "incertitudes": ["information manquante ou non confirmée"],
  "resumeTexte": "version prose du résumé en 1 paragraphe, enregistrable dans le dossier"
}`;

  try {
    const message = await client.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 1500,
      messages: [{ role: "user", content: prompt }],
    });

    const text = message.content[0]?.type === "text" ? message.content[0].text : "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;

    const parsed = JSON.parse(jsonMatch[0]) as Record<string, unknown>;

    return {
      synthese: typeof parsed.synthese === "string" ? parsed.synthese : "",
      parties: asStringArray(parsed.parties),
      etatAvancement: typeof parsed.etatAvancement === "string" ? parsed.etatAvancement : "",
      echeances: asEcheances(parsed.echeances),
      piecesCles: asStringArray(parsed.piecesCles),
      prochainesActions: asStringArray(parsed.prochainesActions),
      pointsAttention: asStringArray(parsed.pointsAttention),
      incertitudes: asStringArray(parsed.incertitudes),
      resumeTexte: typeof parsed.resumeTexte === "string" ? parsed.resumeTexte : "",
    };
  } catch (err) {
    console.error("Erreur résumé IA dossier:", err);
    return null;
  }
}
