import Anthropic from "@anthropic-ai/sdk";

export interface DossierCandidate {
  id: string;
  intitule: string;
  clientNom: string;
  type?: string | null;
  numeroDossier?: string | null;
}

export interface ClassificationResult {
  dossierId: string | null;
  clientNom: string;
  dossierIntitule: string;
  documentType: "note" | "lettre" | "contrat" | "procedure" | "requete" | "autre";
  confidence: number; // 0-100
  reasoning: string;
  suggestedTitre: string;
}

/**
 * Classifie un document en utilisant Claude API.
 * Retourne une suggestion de dossier + type de document.
 * Toujours validation humaine obligatoire avant d'appliquer.
 */
export async function classifyDocument(params: {
  filename: string;
  mimeType: string;
  textContent?: string; // Texte extrait du fichier (PDF, TXT, etc.)
  dossiers: DossierCandidate[];
}): Promise<ClassificationResult | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.warn("ANTHROPIC_API_KEY manquant — classification IA désactivée");
    return null;
  }

  const { filename, mimeType, textContent, dossiers } = params;

  if (dossiers.length === 0) return null;

  const client = new Anthropic({ apiKey });

  // Construire la liste des dossiers pour le prompt
  const dossiersStr = dossiers
    .map(
      (d, i) =>
        `${i + 1}. ID: ${d.id} | Client: ${d.clientNom} | Dossier: ${d.intitule}${
          d.numeroDossier ? ` (#${d.numeroDossier})` : ""
        }${d.type ? ` | Type: ${d.type}` : ""}`
    )
    .join("\n");

  // Extraire un aperçu du contenu (max 2000 chars pour garder le prompt court)
  const contentPreview = textContent
    ? textContent.slice(0, 2000) + (textContent.length > 2000 ? "\n[... tronqué]" : "")
    : "(contenu non disponible — classification par nom de fichier uniquement)";

  const prompt = `Tu es un assistant de classement pour un cabinet d'avocats québécois.
On vient d'uploader un document et tu dois suggérer dans quel dossier le classer.

FICHIER: ${filename}
TYPE MIME: ${mimeType}

APERÇU DU CONTENU:
${contentPreview}

DOSSIERS DISPONIBLES:
${dossiersStr}

TÂCHE: Analyse le nom du fichier et son contenu pour suggérer:
1. Le dossier le plus approprié (donne l'ID exact)
2. Le type de document parmi: note, lettre, contrat, procedure, requete, autre
3. Un titre suggéré pour ce document (court, descriptif)
4. Ta confiance en % (0-100)
5. Une courte explication (1 phrase)

Réponds UNIQUEMENT en JSON valide, format exact:
{
  "dossierId": "l'id du dossier ou null si aucun ne correspond",
  "documentType": "note|lettre|contrat|procedure|requete|autre",
  "suggestedTitre": "titre court du document",
  "confidence": 85,
  "reasoning": "courte explication"
}`;

  try {
    const message = await client.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 512,
      messages: [{ role: "user", content: prompt }],
    });

    const text =
      message.content[0].type === "text" ? message.content[0].text : "";

    // Parser le JSON retourné par Claude
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;

    const parsed = JSON.parse(jsonMatch[0]);

    // Trouver le dossier correspondant
    const matchedDossier = dossiers.find((d) => d.id === parsed.dossierId);

    return {
      dossierId: parsed.dossierId ?? null,
      clientNom: matchedDossier?.clientNom ?? "Inconnu",
      dossierIntitule: matchedDossier?.intitule ?? "Dossier inconnu",
      documentType: parsed.documentType ?? "autre",
      confidence: Math.min(100, Math.max(0, parsed.confidence ?? 50)),
      reasoning: parsed.reasoning ?? "",
      suggestedTitre: parsed.suggestedTitre ?? filename,
    };
  } catch (err) {
    console.error("Erreur classification IA:", err);
    return null;
  }
}

/**
 * Extrait le texte d'un fichier PDF (côté serveur uniquement)
 */
export async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  try {
    // pdf-parse doit être importé dynamiquement pour éviter les erreurs SSR
    const pdfModule = await import("pdf-parse");
    const fn = (pdfModule as unknown as { default: (b: Buffer) => Promise<{text: string}> }).default ?? (pdfModule as unknown as (b: Buffer) => Promise<{text: string}>);
    const data = await fn(buffer);
    return data.text.slice(0, 5000); // Limiter à 5000 chars
  } catch {
    return "";
  }
}
