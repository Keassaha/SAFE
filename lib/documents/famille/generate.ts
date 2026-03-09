/**
 * Orchestration de la génération de documents — Droit familial québécois
 * Hybride : template (structure) + IA (sections narratives).
 * Température 0, conformité Barreau (révision humaine obligatoire).
 */

import { getDocumentTypeByCode } from "./taxonomy";
import { AI_DISCLAIMER_FR, AI_DISCLAIMER_EN, APPLICABLE_LAW_REFS } from "./constants";
import {
  getSystemPrompt,
  buildContextXml,
  buildClientDataXml,
  buildDossierDataXml,
  buildTemplateSectionsXml,
  buildUserPrompt,
} from "./prompts";
import type { GenerateOptions, GeneratedDocumentResult } from "./types";

/**
 * Génère un document à partir du type, du contexte client/dossier et des options.
 * Sans clé API Claude : retourne un brouillon de structure + disclaimer et les prompts préparés (pour test ou appel manuel).
 * Avec clé API : appelle Claude (température 0) et retourne le contenu + disclaimer.
 */
export async function generateFamilyLawDocument(options: GenerateOptions): Promise<GeneratedDocumentResult> {
  const { documentTypeCode, language, client, dossier, sections = [], variables = {}, structureOnly } = options;

  const docType = getDocumentTypeByCode(documentTypeCode);
  if (!docType) {
    throw new Error(`Type de document inconnu: ${documentTypeCode}`);
  }

  const applicableLaw = [...APPLICABLE_LAW_REFS] as string[];
  const contextXml = buildContextXml({
    documentType: language === "fr" ? docType.nameFr : docType.nameEn,
    documentTypeCode,
    applicableLaw,
    language,
    district: options.dossier.districtJudiciaire ?? variables["DISTRICT"],
    courtFileNumber: options.dossier.numeroDossierTribunal ?? variables["FILE_NUMBER"],
  });

  const clientDataXml = buildClientDataXml(client, language);
  const dossierDataXml = buildDossierDataXml(dossier);
  const sectionsXml = buildTemplateSectionsXml(sections);

  const systemPrompt = getSystemPrompt(language);
  const userPrompt = buildUserPrompt({
    contextXml,
    clientDataXml,
    dossierDataXml,
    sectionsXml,
    language,
  });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  const disclaimer = language === "fr" ? AI_DISCLAIMER_FR : AI_DISCLAIMER_EN;

  if (!apiKey || structureOnly) {
    // Sans API ou en mode structure seule : brouillon avec disclaimer et prompts pour révision manuelle
    const placeholderBody = structureOnly
      ? getStructurePlaceholder(docType.nameFr, language)
      : `[BROUILLON — Remplacer par appel Claude API avec les prompts ci-dessous]\n\nSystem:\n${systemPrompt.slice(0, 200)}...\n\nUser (extrait):\n${userPrompt.slice(0, 400)}...`;
    return {
      content: `${placeholderBody}\n\n---\n${disclaimer}`,
      meta: {
        generatedAt: new Date().toISOString(),
        templateCode: documentTypeCode,
        aiAssisted: false,
        disclaimerAppended: true,
      },
    };
  }

  // Appel Claude API (à implémenter avec @anthropic-ai/sdk)
  // Référence : temperature = 0, max_tokens adapté au document
  try {
    const body = await callClaudeForDocument({
      systemPrompt: systemPrompt + `\n\nInclus en fin de document le disclaimer suivant (dans la langue du document): ${disclaimer}`,
      userPrompt,
      language,
      maxTokens: 8192,
    });
    return {
      content: body.endsWith(disclaimer) ? body : `${body}\n\n---\n${disclaimer}`,
      meta: {
        generatedAt: new Date().toISOString(),
        model: "claude-sonnet-4-20250514",
        templateCode: documentTypeCode,
        aiAssisted: true,
        disclaimerAppended: true,
      },
    };
  } catch (e) {
    const err = e instanceof Error ? e : new Error(String(e));
    throw new Error(`Génération document (${documentTypeCode}): ${err.message}`);
  }
}

/** Placeholder pour mode structure seule (sans IA). */
function getStructurePlaceholder(documentName: string, language: "fr" | "en"): string {
  const title = language === "fr" ? `Document : ${documentName}` : `Document: ${documentName}`;
  const intro =
    language === "fr"
      ? "Les sections suivantes sont à compléter (données client/dossier et rédaction narrative)."
      : "The following sections are to be completed (client/matter data and narrative drafting).";
  return `${title}\n\n${intro}\n\n[Sections à générer selon le type de document et les template_sections.]`;
}

/**
 * Appel générique à l'API Claude (côté serveur uniquement).
 * Utilisé par generateFamilyLawDocument et par le wizard (formData).
 */
export async function callClaude(params: {
  system: string;
  user: string;
  maxTokens?: number;
  temperature?: number;
}): Promise<string> {
  const { system, user, maxTokens = 8192, temperature = 0 } = params;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY non configurée.");
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: maxTokens,
      system,
      messages: [{ role: "user", content: user }],
      temperature,
    }),
  });
  if (!response.ok) {
    const errBody = await response.text();
    throw new Error(`Claude API: ${response.status} ${errBody}`);
  }
  const data = (await response.json()) as { content?: Array<{ type: string; text?: string }> };
  const textBlock = data.content?.find((c) => c.type === "text");
  return textBlock?.text ?? "";
}

/**
 * Appel à l'API Claude pour le flux template+dossier existant.
 */
async function callClaudeForDocument(params: {
  systemPrompt: string;
  userPrompt: string;
  language: string;
  maxTokens: number;
}): Promise<string> {
  const { systemPrompt, userPrompt, maxTokens } = params;
  // Option 1 : utiliser le SDK Anthropic
  // const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  // const msg = await anthropic.messages.create({ model: "claude-sonnet-4-20250514", max_tokens: maxTokens, system: systemPrompt, messages: [{ role: "user", content: userPrompt }] });
  // return msg.content[0].type === "text" ? msg.content[0].text : "";

  // Option 2 : fetch vers l'API REST Anthropic (sans dépendance SDK)
  return callClaude({ system: systemPrompt, user: userPrompt, maxTokens, temperature: 0 });
}
