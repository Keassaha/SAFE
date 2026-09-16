import Anthropic from "@anthropic-ai/sdk";

/**
 * Extraction d'une FACTURE PASSÉE (déposée en vrac par un cabinet qui arrive avec
 * sa clientèle) par vision Claude.
 *
 * Priorité 2 du chantier « un cabinet arrive avec sa clientèle » — voir
 * docs/journal/2026-09-15_entree_client_et_reprise_historique.md et le plan
 * `reprise des factures passées ». Calqué sur `extract-payment-proof.ts`.
 *
 * GARDE-FOUS :
 * - On n'invente JAMAIS un montant, une date ou un taux. Champ illisible => `null`
 *   + signalé dans `champsIllisibles`.
 * - L'extraction ne fait que LIRE. Aucun rapprochement client/dossier, aucune
 *   écriture, et surtout AUCUN statut de paiement : celui-ci se demande à l'écran,
 *   jamais ne se devine (doctrine du lot).
 */

export type OcrConfidence = "haute" | "moyenne" | "basse";

export interface PastInvoiceLigneExtraction {
  description: string;
  /** Date de la prestation, ISO AAAA-MM-JJ. `null` si non mentionnée sur la facture. */
  date: string | null;
  montant: number | null;
  /** Heures travaillées, si la facture est horaire et que le nombre d'heures est imprimé. */
  heures: number | null;
  /** Taux horaire, si imprimé. `null` pour une ligne forfaitaire ou si illisible. */
  tauxHoraire: number | null;
}

export interface PastInvoiceExtraction {
  numeroFacture: string | null;
  clientNom: string | null;
  /** Objet du mandat tel que mentionné sur la facture (ex: « Bail commercial, rue Laurier »). */
  dossierIntitule: string | null;
  /** Date d'émission de la facture, ISO AAAA-MM-JJ. */
  dateEmission: string | null;
  montantTotal: number | null;
  lignes: PastInvoiceLigneExtraction[];
  confianceOcr: OcrConfidence;
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
    const cleaned = v.replace(/\s/g, "").replace(",", ".").replace(/[^0-9.-]/g, "");
    const n = Number.parseFloat(cleaned);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function asOcrConfidence(v: unknown): OcrConfidence {
  return v === "haute" || v === "moyenne" || v === "basse" ? v : "basse";
}

function asStringArray(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.filter((x): x is string => typeof x === "string" && x.trim().length > 0);
}

function asLignes(v: unknown): PastInvoiceLigneExtraction[] {
  if (!Array.isArray(v)) return [];
  return v
    .map((raw): PastInvoiceLigneExtraction | null => {
      if (typeof raw !== "object" || raw === null) return null;
      const r = raw as Record<string, unknown>;
      const description = asStringOrNull(r.description);
      if (!description) return null;
      return {
        description,
        date: asStringOrNull(r.date),
        montant: asNumberOrNull(r.montant),
        heures: asNumberOrNull(r.heures),
        tauxHoraire: asNumberOrNull(r.tauxHoraire),
      };
    })
    .filter((l): l is PastInvoiceLigneExtraction => l !== null);
}

const PROMPT = `Tu analyses une FACTURE PASSÉE émise par un cabinet d'avocats québécois, déposée pour reprendre son historique dans un nouveau logiciel. Tu dois en extraire les champs de façon FACTUELLE.

RÈGLES STRICTES :
- N'invente JAMAIS une valeur. Si un champ est absent ou illisible, mets-le à null ET ajoute son nom dans "champsIllisibles".
- N'invente JAMAIS un statut de paiement. Ne le déduis pas d'une mention « payé » ou d'un tampon : ignore-le complètement, ce n'est pas demandé ici.
- "numeroFacture" = le numéro tel qu'imprimé sur la facture (ex: "F-2026-011").
- "clientNom" = le nom du client facturé (personne ou entreprise), tel qu'écrit.
- "dossierIntitule" = l'objet du mandat mentionné (ex: « Bail commercial, rue Laurier », « Séparation de corps »). null si aucun objet n'est mentionné.
- "dateEmission" = la date d'émission de la facture, au format AAAA-MM-JJ.
- "montantTotal" = le montant total de la facture, en nombre décimal, sans symbole ni séparateur de milliers.
- "lignes" = chaque ligne de prestation listée (description, date de la prestation si présente, montant de la ligne). Si la facture est horaire, remplis aussi "heures" et "tauxHoraire" quand ils sont imprimés. Si l'un des deux est illisible mais que le montant (sous-total de la ligne) l'est, garde le montant lisible, mets le champ manquant à null, et ajoute-le à "champsIllisibles" — ne laisse jamais une ligne sans montant si le sous-total de la ligne est imprimé. Pour une ligne forfaitaire (pas d'heures), laisse "heures" et "tauxHoraire" à null : ce n'est pas un champ illisible, il n'existe simplement pas sur ce type de ligne.
- "confianceOcr" : "haute" si le document est net et les champs clairs, "moyenne" si partiellement lisible, "basse" si difficile à lire.

Réponds UNIQUEMENT en JSON valide, format exact :
{
  "numeroFacture": "F-2026-011",
  "clientNom": "Société Kaboré et fils",
  "dossierIntitule": "Bail commercial, rue Laurier",
  "dateEmission": "2026-03-08",
  "montantTotal": 2875.00,
  "lignes": [
    { "description": "Étude du bail et des avenants", "date": "2026-02-24", "montant": 805.00, "heures": 1.75, "tauxHoraire": 460.00 }
  ],
  "confianceOcr": "haute",
  "champsIllisibles": []
}`;

/**
 * Extrait les champs d'une facture passée (image ou PDF).
 *
 * Retourne `null` si la clé API est absente, le type de fichier non supporté,
 * ou en cas d'échec d'appel/parsing (le caller gère le fallback saisie manuelle).
 */
export async function extractPastInvoice(params: {
  buffer: Buffer;
  mimeType: string;
}): Promise<PastInvoiceExtraction | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.warn("ANTHROPIC_API_KEY manquant — extraction de facture passée désactivée");
    return null;
  }

  const media = buildMediaBlock(params.buffer, params.mimeType);
  if (!media) {
    console.warn(`extractPastInvoice: type de fichier non supporté (${params.mimeType})`);
    return null;
  }

  const client = new Anthropic({ apiKey });

  try {
    const message = await client.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 1024,
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
      numeroFacture: asStringOrNull(parsed.numeroFacture),
      clientNom: asStringOrNull(parsed.clientNom),
      dossierIntitule: asStringOrNull(parsed.dossierIntitule),
      dateEmission: asStringOrNull(parsed.dateEmission),
      montantTotal: asNumberOrNull(parsed.montantTotal),
      lignes: asLignes(parsed.lignes),
      confianceOcr: asOcrConfidence(parsed.confianceOcr),
      champsIllisibles: asStringArray(parsed.champsIllisibles),
    };
  } catch (err) {
    console.error("Erreur extraction facture passée:", err);
    return null;
  }
}
