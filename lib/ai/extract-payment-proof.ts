import Anthropic from "@anthropic-ai/sdk";

/**
 * Extraction d'une preuve de paiement (virement Interac, reçu) par vision Claude.
 *
 * Première brique du flux « import intelligent de preuve de paiement »
 * (spec : docs/product/SPEC_IMPORT_PREUVE_PAIEMENT.md, lot L1).
 *
 * GARDE-FOUS :
 * - On n'invente JAMAIS un montant. Champ illisible => `null` + signalé dans `champsIllisibles`.
 * - L'extraction ne fait que LIRE. Aucun rapprochement, aucune écriture : ça, c'est L2/L3/L4.
 * - Réalité vérifiée (2026-07-04) : une notification Interac en AUTODÉPÔT ne contient PAS de
 *   champ message/mémo. Le n° de dossier n'y figure donc pas. `message` est un bonus, pas la base.
 */

export type ProofType = "interac_autodepot" | "interac_manuel" | "recu" | "autre";
export type OcrConfidence = "haute" | "moyenne" | "basse";

export interface PaymentProofExtraction {
  /** Montant en devise majeure (ex: 750.00). `null` si illisible. */
  montant: number | null;
  devise: string | null;
  /** Nom de l'expéditeur des fonds (« Envoyé par »). */
  expediteurNom: string | null;
  /** Courriel de l'expéditeur (« Répondre à »). Signal de matching fort. */
  expediteurCourriel: string | null;
  /** Mémo/message du payeur. Souvent absent en autodépôt. */
  message: string | null;
  /** Date du virement au format ISO AAAA-MM-JJ. */
  date: string | null;
  /** N° de référence Interac (clé d'idempotence anti-doublon). */
  referenceInterac: string | null;
  banqueSource: string | null;
  /** 4 derniers chiffres du compte destination, si visibles. */
  compteDest4Derniers: string | null;
  typePreuve: ProofType;
  confianceOcr: OcrConfidence;
  /** Champs que le modèle n'a pas pu lire de façon fiable. */
  champsIllisibles: string[];
}

const IMAGE_MEDIA_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
]);

type MediaBlock =
  | {
      type: "image";
      source: { type: "base64"; media_type: string; data: string };
    }
  | {
      type: "document";
      source: { type: "base64"; media_type: "application/pdf"; data: string };
    };

/** Construit le bloc de contenu vision selon le type de fichier. `null` si non supporté. */
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
    // Tolère « 750,00 » ou « 750.00 » au cas où le modèle renvoie une chaîne.
    const cleaned = v.replace(/\s/g, "").replace(",", ".").replace(/[^0-9.]/g, "");
    const n = Number.parseFloat(cleaned);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function asProofType(v: unknown): ProofType {
  return v === "interac_autodepot" || v === "interac_manuel" || v === "recu" || v === "autre"
    ? v
    : "autre";
}

function asOcrConfidence(v: unknown): OcrConfidence {
  return v === "haute" || v === "moyenne" || v === "basse" ? v : "basse";
}

function asStringArray(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.filter((x): x is string => typeof x === "string" && x.trim().length > 0);
}

const PROMPT = `Tu analyses une PREUVE DE PAIEMENT reçue par un cabinet d'avocats québécois (typiquement une notification de Virement Interac, parfois un reçu). Tu dois en extraire les champs de façon FACTUELLE.

RÈGLES STRICTES :
- N'invente JAMAIS une valeur. Si un champ est absent ou illisible, mets-le à null ET ajoute son nom dans "champsIllisibles".
- Le "montant" est le montant reçu, en nombre décimal (ex: 750.00), sans symbole ni séparateur de milliers.
- La "date" est celle DU VIREMENT, au format AAAA-MM-JJ (ex: « 28 juin 2026 » => "2026-06-28").
- "expediteurNom" = qui a envoyé les fonds (« Envoyé par », « de X »).
- "expediteurCourriel" = le courriel de l'expéditeur (souvent « Répondre à »). Ne mets PAS le courriel du système Interac (notify@payments.interac.ca).
- "message" = le mémo/message écrit par le payeur. ATTENTION : en autodépôt (« déposé automatiquement »), ce champ N'EXISTE PAS. Ne le fabrique pas : mets null.
- "referenceInterac" = le numéro de référence du virement (ex: "C1ArqBDEgCn7").
- "typePreuve" : "interac_autodepot" si « déposé automatiquement », "interac_manuel" si dépôt manuel/question de sécurité, "recu" pour un reçu, sinon "autre".
- "confianceOcr" : "haute" si l'image est nette et les champs clairs, "moyenne" si partiellement lisible, "basse" si difficile à lire.

Réponds UNIQUEMENT en JSON valide, format exact :
{
  "montant": 750.00,
  "devise": "CAD",
  "expediteurNom": "KEASSAHA JEREMIE TIAHOU",
  "expediteurCourriel": "exemple@courriel.com",
  "message": null,
  "date": "2026-06-28",
  "referenceInterac": "C1ArqBDEgCn7",
  "banqueSource": "TD Canada Trust",
  "compteDest4Derniers": "0126",
  "typePreuve": "interac_autodepot",
  "confianceOcr": "haute",
  "champsIllisibles": []
}`;

/**
 * Extrait les champs d'une preuve de paiement (image ou PDF).
 *
 * Retourne `null` si la clé API est absente, le type de fichier non supporté,
 * ou en cas d'échec d'appel/parsing (le caller gère le fallback saisie manuelle).
 */
export async function extractPaymentProof(params: {
  buffer: Buffer;
  mimeType: string;
}): Promise<PaymentProofExtraction | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.warn("ANTHROPIC_API_KEY manquant — extraction de preuve désactivée");
    return null;
  }

  const media = buildMediaBlock(params.buffer, params.mimeType);
  if (!media) {
    console.warn(`extractPaymentProof: type de fichier non supporté (${params.mimeType})`);
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
          // Le SDK 0.90 accepte les blocs image/document ; le typage strict du prompt
          // n'expose pas encore "document" partout, d'où le cast localisé.
          content: [media as never, { type: "text", text: PROMPT }],
        },
      ],
    });

    const text = message.content[0]?.type === "text" ? message.content[0].text : "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;

    const parsed = JSON.parse(jsonMatch[0]) as Record<string, unknown>;

    return {
      montant: asNumberOrNull(parsed.montant),
      devise: asStringOrNull(parsed.devise),
      expediteurNom: asStringOrNull(parsed.expediteurNom),
      expediteurCourriel: asStringOrNull(parsed.expediteurCourriel),
      message: asStringOrNull(parsed.message),
      date: asStringOrNull(parsed.date),
      referenceInterac: asStringOrNull(parsed.referenceInterac),
      banqueSource: asStringOrNull(parsed.banqueSource),
      compteDest4Derniers: asStringOrNull(parsed.compteDest4Derniers),
      typePreuve: asProofType(parsed.typePreuve),
      confianceOcr: asOcrConfidence(parsed.confianceOcr),
      champsIllisibles: asStringArray(parsed.champsIllisibles),
    };
  } catch (err) {
    console.error("Erreur extraction preuve de paiement:", err);
    return null;
  }
}
