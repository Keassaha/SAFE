import Anthropic from "@anthropic-ai/sdk";
import type { ParsedFile, RawRow } from "../types";

/**
 * Parser de relevé bancaire PDF (numérique ou scanné) via Claude.
 *
 * Produit le MÊME `ParsedFile` que les parsers CSV/Excel : à partir de là, tout le
 * pipeline d'import existant reprend (détection de colonnes → normalizeBankRow →
 * aperçu humain → catégorisation → dépenses). Spec : docs/product/SPEC_IMPORT_RELEVE_PDF.md (B1).
 *
 * GARDE-FOUS :
 * - Colonnes `debit`/`credit` séparées (non ambiguës) : détectées telles quelles.
 * - Jamais de montant inventé : une ligne douteuse est omise plutôt que devinée.
 * - La sûreté finale vient de l'ÉCRAN D'APERÇU (l'humain valide/corrige chaque ligne
 *   avant toute persistance). Aucune écriture aveugle.
 */

interface RawTxn {
  date?: unknown;
  description?: unknown;
  debit?: unknown;
  credit?: unknown;
  balance?: unknown;
}

function numToStr(v: unknown): string {
  if (typeof v === "number" && Number.isFinite(v)) return v.toFixed(2);
  if (typeof v === "string") {
    const cleaned = v.replace(/\s/g, "").replace(",", ".").replace(/[^0-9.]/g, "");
    const n = Number.parseFloat(cleaned);
    return Number.isFinite(n) ? n.toFixed(2) : "";
  }
  return "";
}

function str(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

const PROMPT = `Tu extrais les TRANSACTIONS d'un relevé de compte bancaire (québécois, FR ou EN). Le relevé peut faire plusieurs pages.

RÈGLES STRICTES :
- Extrais UNIQUEMENT les lignes de transaction réelles. Ignore les en-têtes, soldes d'ouverture/fermeture, sous-totaux, mentions légales, publicités.
- Pour chaque transaction : "date" (AAAA-MM-JJ), "description" (libellé tel qu'imprimé), et le montant dans "debit" OU "credit" (jamais les deux) :
  - "debit" = sortie d'argent (retrait, achat, paiement, frais). Nombre positif.
  - "credit" = entrée d'argent (dépôt, virement reçu, remboursement). Nombre positif.
- "balance" = solde courant après la transaction, si imprimé (sinon null).
- N'INVENTE RIEN. Si un montant est illisible, omets la ligne. Ne devine pas un débit/crédit incertain.
- Convertis les dates au format AAAA-MM-JJ (déduis l'année de la période du relevé si l'année manque sur la ligne).

Réponds UNIQUEMENT en JSON valide, format exact :
{
  "transactions": [
    { "date": "2026-06-03", "description": "PAIEMENT BUREAU EN GROS", "debit": 47.15, "credit": null, "balance": 3812.40 },
    { "date": "2026-06-05", "description": "DEPOT", "debit": null, "credit": 1500.00, "balance": 5312.40 }
  ]
}`;

/**
 * Extrait les transactions d'un relevé PDF et les renvoie sous forme de `ParsedFile`
 * (colonnes date/description/debit/credit/balance), prêt pour le pipeline d'import.
 *
 * Lève une erreur explicite si la clé IA est absente ou l'extraction échoue (le wizard l'affiche).
 */
export async function parsePdfBuffer(buffer: ArrayBuffer, fileName: string): Promise<ParsedFile> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("Service d'extraction IA non configuré (ANTHROPIC_API_KEY manquant).");
  }

  const data = Buffer.from(buffer).toString("base64");
  const client = new Anthropic({ apiKey });

  const message = await client.messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: 8192,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "document",
            source: { type: "base64", media_type: "application/pdf", data },
          } as never,
          { type: "text", text: PROMPT },
        ],
      },
    ],
  });

  const text = message.content[0]?.type === "text" ? message.content[0].text : "";
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Aucune transaction n'a pu être lue dans ce relevé PDF.");
  }

  let parsed: { transactions?: RawTxn[] };
  try {
    parsed = JSON.parse(jsonMatch[0]);
  } catch {
    throw new Error("Réponse d'extraction illisible pour ce relevé PDF.");
  }

  const txns = Array.isArray(parsed.transactions) ? parsed.transactions : [];
  const rows: RawRow[] = [];
  txns.forEach((t, i) => {
    const date = str(t.date);
    const description = str(t.description);
    const debit = numToStr(t.debit);
    const credit = numToStr(t.credit);
    // Ligne inexploitable (ni date, ni montant) => ignorée.
    if (!date && !debit && !credit) return;
    rows.push({
      date,
      description,
      debit,
      credit,
      balance: numToStr(t.balance),
      __sourceRowIndex: String(i),
      __rawRowText: `${date} ${description} ${debit || credit}`.trim(),
      __sourceRowKind: "data",
    });
  });

  return {
    fileName,
    headers: ["date", "description", "debit", "credit", "balance"],
    rows,
    headerRowIndex: 0,
    ignoredCount: txns.length - rows.length,
  };
}
