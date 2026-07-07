import Anthropic from "@anthropic-ai/sdk";

/**
 * Extraction d'un reçu de dépense (facture fournisseur, reçu de caisse) par vision Claude.
 *
 * Pendant, côté dépense, de `extract-payment-proof.ts`.
 * Spec : docs/product/SPEC_IMPORT_RECU_DEPENSE.md (lot R1).
 *
 * GARDE-FOUS :
 * - On n'invente JAMAIS un montant. Champ illisible => `null` + signalé dans `champsIllisibles`.
 * - TPS/TVQ = uniquement ce qui est IMPRIMÉ sur le reçu. On ne recalcule pas à l'aveugle.
 * - L'extraction ne fait que LIRE. La catégorisation et l'écriture, c'est R2/R3/R4.
 */

export type ReceiptType = "recu" | "facture" | "autre";
export type OcrConfidence = "haute" | "moyenne" | "basse";

export interface ExpenseReceiptExtraction {
  /** Nom du fournisseur/commerçant tel qu'imprimé. */
  fournisseur: string | null;
  /** Date de la dépense au format ISO AAAA-MM-JJ. */
  date: string | null;
  /** Montant total payé (toutes taxes comprises). `null` si illisible. */
  montantTtc: number | null;
  /** TPS/GST imprimée sur le reçu, sinon null. */
  tps: number | null;
  /** TVQ/QST imprimée sur le reçu, sinon null. */
  tvq: number | null;
  /** Sous-total avant taxes, si imprimé. */
  montantHt: number | null;
  devise: string | null;
  /** N° de reçu/facture, si présent (aide à l'anti-doublon). */
  numeroRecu: string | null;
  typePiece: ReceiptType;
  confianceOcr: OcrConfidence;
  champsIllisibles: string[];
}

const IMAGE_MEDIA_TYPES = new Set(["image/png", "image/jpeg", "image/gif", "image/webp"]);

type MediaBlock =
  | { type: "image"; source: { type: "base64"; media_type: string; data: string } }
  | { type: "document"; source: { type: "base64"; media_type: "application/pdf"; data: string } };

function buildMediaBlock(buffer: Buffer, mimeType: string): MediaBlock | null {
  const data = buffer.toString("base64");
  if (mimeType === "application/pdf") {
    return { type: "document", source: { type: "base64", media_type: "application/pdf", data } };
  }
  if (IMAGE_MEDIA_TYPES.has(mimeType)) {
    return { type: "image", source: { type: "base64", media_type: mimeType, data } };
  }
  return null;
}

function asStringOrNull(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t.length > 0 ? t : null;
}

function asNumberOrNull(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const cleaned = v.replace(/\s/g, "").replace(",", ".").replace(/[^0-9.]/g, "");
    const n = Number.parseFloat(cleaned);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function asReceiptType(v: unknown): ReceiptType {
  return v === "recu" || v === "facture" || v === "autre" ? v : "autre";
}

function asOcrConfidence(v: unknown): OcrConfidence {
  return v === "haute" || v === "moyenne" || v === "basse" ? v : "basse";
}

function asStringArray(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.filter((x): x is string => typeof x === "string" && x.trim().length > 0);
}

const PROMPT = `Tu analyses un REÇU ou une FACTURE fournisseur d'un cabinet d'avocats québécois, pour enregistrer une DÉPENSE. Tu extrais les champs de façon FACTUELLE.

RÈGLES STRICTES :
- N'invente JAMAIS une valeur. Si un champ est absent ou illisible, mets-le à null ET ajoute son nom dans "champsIllisibles".
- "montantTtc" = total payé toutes taxes comprises, en nombre décimal (ex: 47.15), sans symbole.
- "tps" (TPS/GST) et "tvq" (TVQ/QST) = UNIQUEMENT si elles sont imprimées sur le reçu. Ne les calcule/déduis JAMAIS toi-même : si non imprimées, mets null.
- "montantHt" = sous-total avant taxes, seulement s'il est imprimé.
- "fournisseur" = nom du commerçant/fournisseur tel qu'imprimé.
- "date" = date de la dépense, au format AAAA-MM-JJ.
- "numeroRecu" = numéro de reçu ou de facture s'il existe.
- "typePiece" : "recu" (reçu de caisse), "facture" (facture fournisseur), sinon "autre".
- "confianceOcr" : "haute" si net et clair, "moyenne" si partiel, "basse" si difficile à lire.

Réponds UNIQUEMENT en JSON valide, format exact :
{
  "fournisseur": "Bureau en Gros",
  "date": "2026-07-02",
  "montantTtc": 47.15,
  "tps": 2.05,
  "tvq": 4.09,
  "montantHt": 41.01,
  "devise": "CAD",
  "numeroRecu": "A-102934",
  "typePiece": "recu",
  "confianceOcr": "haute",
  "champsIllisibles": []
}`;

/**
 * Extrait les champs d'un reçu de dépense (image ou PDF).
 * Retourne `null` si clé API absente, type non supporté, ou échec (le caller gère).
 */
export async function extractExpenseReceipt(params: {
  buffer: Buffer;
  mimeType: string;
}): Promise<ExpenseReceiptExtraction | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.warn("ANTHROPIC_API_KEY manquant — extraction de reçu désactivée");
    return null;
  }

  const media = buildMediaBlock(params.buffer, params.mimeType);
  if (!media) {
    console.warn(`extractExpenseReceipt: type de fichier non supporté (${params.mimeType})`);
    return null;
  }

  const client = new Anthropic({ apiKey });

  try {
    const message = await client.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 512,
      messages: [
        {
          role: "user",
          content: [media as never, { type: "text", text: PROMPT }],
        },
      ],
    });

    const text = message.content[0]?.type === "text" ? message.content[0].text : "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;

    const parsed = JSON.parse(jsonMatch[0]) as Record<string, unknown>;

    return {
      fournisseur: asStringOrNull(parsed.fournisseur),
      date: asStringOrNull(parsed.date),
      montantTtc: asNumberOrNull(parsed.montantTtc),
      tps: asNumberOrNull(parsed.tps),
      tvq: asNumberOrNull(parsed.tvq),
      montantHt: asNumberOrNull(parsed.montantHt),
      devise: asStringOrNull(parsed.devise),
      numeroRecu: asStringOrNull(parsed.numeroRecu),
      typePiece: asReceiptType(parsed.typePiece),
      confianceOcr: asOcrConfidence(parsed.confianceOcr),
      champsIllisibles: asStringArray(parsed.champsIllisibles),
    };
  } catch (err) {
    console.error("Erreur extraction reçu de dépense:", err);
    return null;
  }
}
