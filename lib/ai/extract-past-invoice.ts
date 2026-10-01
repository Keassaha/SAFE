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

/**
 * Honoraires (le travail de l'avocat) ou débours (une somme que le cabinet a
 * avancée pour le client : timbres, huissier, frais de greffe). Les deux ne se
 * rangent pas au même endroit et ne se taxent pas pareil, d'où la distinction
 * dès la lecture. Dans le doute, honoraire : un débours inventé ferait sortir
 * une somme que le cabinet n'a jamais avancée.
 */
export type NatureLigne = "honoraire" | "debours";

export interface PastInvoiceLigneExtraction {
  description: string;
  /** Date de la prestation, ISO AAAA-MM-JJ. `null` si non mentionnée sur la facture. */
  date: string | null;
  montant: number | null;
  /** Heures travaillées, si la facture est horaire et que le nombre d'heures est imprimé. */
  heures: number | null;
  /** Taux horaire, si imprimé. `null` pour une ligne forfaitaire ou si illisible. */
  tauxHoraire: number | null;
  nature: NatureLigne;
}

export interface PastInvoiceExtraction {
  numeroFacture: string | null;
  clientNom: string | null;
  /**
   * Coordonnées du CLIENT, telles qu'imprimées sous son nom (« Facturé à »).
   * Facultatives : une facture ne les porte pas toujours, et leur absence n'est
   * pas un champ illisible. Ajoutées pour « Reprendre un client » (2026-10-01).
   */
  clientAdresse?: string | null;
  clientCourriel?: string | null;
  clientTelephone?: string | null;
  /** Objet du mandat tel que mentionné sur la facture (ex: « Bail commercial, rue Laurier »). */
  dossierIntitule: string | null;
  /** Date d'émission de la facture, ISO AAAA-MM-JJ. */
  dateEmission: string | null;
  /** Total de la facture, taxes comprises. C'est LE chiffre qui fait foi. */
  montantTotal: number | null;
  /** TPS/GST imprimée. `null` si la facture n'en montre pas ou si elle est illisible. */
  tps: number | null;
  /** TVQ/QST (ou HST en Ontario) imprimée. */
  tvq: number | null;
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

/** Défaut volontaire : honoraire. Un débours inventé sortirait une somme jamais avancée. */
function asNature(v: unknown): NatureLigne {
  return v === "debours" ? "debours" : "honoraire";
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
        nature: asNature(r.nature),
      };
    })
    .filter((l): l is PastInvoiceLigneExtraction => l !== null);
}

const PROMPT = `Tu analyses une FACTURE PASSÉE émise par un cabinet d'avocats québécois, déposée pour reprendre son historique dans un nouveau logiciel. Tu dois en extraire les champs de façon FACTUELLE.

RÈGLES STRICTES :
- N'invente JAMAIS une valeur. Si un champ est absent ou illisible, mets-le à null ET ajoute son nom dans "champsIllisibles".
- N'invente JAMAIS un statut de paiement. Ne le déduis pas d'une mention « payé » ou d'un tampon : ignore-le complètement, ce n'est pas demandé ici.
- "numeroFacture" = le numéro tel qu'imprimé sur la facture (ex: "F-2026-011").
- "clientNom" = le nom du CLIENT FACTURÉ, celui qui doit payer. ATTENTION, c'est le piège le plus fréquent : le nom le plus gros et le plus haut de la page est celui du CABINET qui émet la facture, pas celui du client. Le client se trouve sous une mention du genre « Facturé à », « Client », « Destinataire », « À l'attention de », souvent avec son adresse. Ne prends JAMAIS pour un client une ligne d'en-tête de cabinet (un nom suivi de « Avocats », « Avocat », « Notaires », « S.E.N.C.R.L. », « s.a. », d'une ville seule, d'un numéro de permis ou du Barreau). Si tu n'es pas certain d'avoir le client et non l'émetteur, mets null et ajoute "clientNom" à "champsIllisibles".
- "clientAdresse", "clientCourriel", "clientTelephone" = les coordonnées DU CLIENT, imprimées avec son nom dans le bloc « Facturé à ». L'adresse sur une seule ligne, telle qu'imprimée. ATTENTION : l'adresse, le téléphone et le courriel du CABINET figurent presque toujours en en-tête ou en pied de page ; ne les prends JAMAIS. Si une coordonnée du client n'est pas imprimée, ou si tu n'es pas certain qu'elle est celle du client, mets null. Ne les ajoute PAS à "champsIllisibles" : une facture ne les porte pas toujours, ce n'est pas une illisibilité.
- "dossierIntitule" = l'objet du mandat mentionné (ex: « Bail commercial, rue Laurier », « Séparation de corps »). null si aucun objet n'est mentionné.
- "dateEmission" = la date d'émission de la facture, au format AAAA-MM-JJ.
- "montantTotal" = le montant TOTAL de la facture, taxes comprises, celui que le client devait payer. En nombre décimal, sans symbole ni séparateur de milliers.
- "tps" et "tvq" = les taxes imprimées sur la facture (TPS/GST d'un côté, TVQ/QST ou HST de l'autre), si elles y figurent. Si la facture ne montre aucune taxe, ou si elles sont illisibles, mets null et ajoute "taxes" à "champsIllisibles". Ne les calcule JAMAIS toi-même : elles se lisent ou elles n'existent pas.
- "lignes" = chaque ligne de prestation listée (description, date de la prestation si présente, montant de la ligne). Si la facture est horaire, remplis aussi "heures" et "tauxHoraire" quand ils sont imprimés. Si l'un des deux est illisible mais que le montant (sous-total de la ligne) l'est, garde le montant lisible, mets le champ manquant à null, et ajoute-le à "champsIllisibles" — ne laisse jamais une ligne sans montant si le sous-total de la ligne est imprimé. Pour une ligne forfaitaire (pas d'heures), laisse "heures" et "tauxHoraire" à null : ce n'est pas un champ illisible, il n'existe simplement pas sur ce type de ligne.
- "nature" de chaque ligne : "debours" si la ligne est une somme AVANCÉE par le cabinet pour le client plutôt que du travail facturé. Sont des débours : timbres et frais de poste, frais de greffe et de cour, droits de dépôt, signification et frais d'huissier, registre foncier, registre des entreprises (REQ), recherche SOQUIJ, photocopies facturées à l'unité, expertise, traduction, déplacement, frais gouvernementaux. Une facture regroupe souvent ces lignes sous un intertitre « Débours », « Déboursés » ou « Frais » : sers-t'en. Tout le reste est "honoraire". Dans le doute, mets "honoraire" : inventer un débours ferait sortir des registres une somme que le cabinet n'a jamais avancée.
- "confianceOcr" : "haute" si le document est net et les champs clairs, "moyenne" si partiellement lisible, "basse" si difficile à lire.

Réponds UNIQUEMENT en JSON valide, format exact :
{
  "numeroFacture": "F-2026-011",
  "clientNom": "Société Kaboré et fils",
  "clientAdresse": "1200, boulevard Saint-Laurent, Ottawa (Ontario) K1G 3V5",
  "clientCourriel": null,
  "clientTelephone": "613 555-0117",
  "dossierIntitule": "Bail commercial, rue Laurier",
  "dateEmission": "2026-03-08",
  "montantTotal": 2875.00,
  "tps": 125.00,
  "tvq": 249.38,
  "lignes": [
    { "description": "Étude du bail et des avenants", "date": "2026-02-24", "montant": 805.00, "heures": 1.75, "tauxHoraire": 460.00, "nature": "honoraire" },
    { "description": "Frais de greffe", "date": "2026-02-26", "montant": 128.00, "heures": null, "tauxHoraire": null, "nature": "debours" }
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
      clientAdresse: asStringOrNull(parsed.clientAdresse),
      clientCourriel: asStringOrNull(parsed.clientCourriel),
      clientTelephone: asStringOrNull(parsed.clientTelephone),
      dossierIntitule: asStringOrNull(parsed.dossierIntitule),
      dateEmission: asStringOrNull(parsed.dateEmission),
      montantTotal: asNumberOrNull(parsed.montantTotal),
      tps: asNumberOrNull(parsed.tps),
      tvq: asNumberOrNull(parsed.tvq),
      lignes: asLignes(parsed.lignes),
      confianceOcr: asOcrConfidence(parsed.confianceOcr),
      champsIllisibles: asStringArray(parsed.champsIllisibles),
    };
  } catch (err) {
    console.error("Erreur extraction facture passée:", err);
    return null;
  }
}
