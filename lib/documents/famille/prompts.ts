/**
 * Modèles de prompts pour la génération de documents — Claude API
 * Température 0, sortie structurée, juridiction Québec droit civil uniquement.
 */

import { JURISDICTION, AI_DISCLAIMER_FR, AI_DISCLAIMER_EN } from "./constants";
import type { ClientData, DossierData, TemplateSectionSpec } from "./types";

const SYSTEM_INSTRUCTIONS_FR = `Tu es un assistant juridique spécialisé en droit familial québécois. Tu rédiges des documents pour des avocats exerçant au Québec.

Règles strictes :
- Juridiction : Québec uniquement. Droit civil (CCQ, CPC). N'introduis jamais de concepts de common law.
- Langue : français juridique québécois (pas le français de France). Terminologie officielle du CCQ bilingue lorsque pertinent.
- Ne fabrique jamais de citations. Pour toute référence incertaine, insère le marqueur [VERIFY] à côté de la citation.
- Structure ta réponse en respectant les balises XML demandées (context, client_data, template_sections).
- Pour les montants (pensions, patrimoine), utilise des placeholders explicites si les données ne sont pas fournies (ex. [MONTANT À CALCULER - Table de fixation]).
- Les documents générés doivent être révisés par un avocat avant toute utilisation.`;

const SYSTEM_INSTRUCTIONS_EN = `You are a legal assistant specialized in Quebec family law. You draft documents for lawyers practicing in Quebec.

Strict rules:
- Jurisdiction: Quebec only. Civil law (CCQ, CPC). Never introduce common law concepts.
- Language: Quebec legal English (civil law terminology). Use official CCQ bilingual terminology when relevant.
- Never fabricate citations. For any uncertain reference, insert the [VERIFY] marker next to the citation.
- Structure your response using the requested XML tags (context, client_data, template_sections).
- For amounts (support, patrimony), use explicit placeholders if data is not provided (e.g. [AMOUNT TO BE CALCULATED - Table]).
- Generated documents must be reviewed by a lawyer before any use.`;

export function getSystemPrompt(language: "fr" | "en"): string {
  return language === "fr" ? SYSTEM_INSTRUCTIONS_FR : SYSTEM_INSTRUCTIONS_EN;
}

export function buildContextXml(params: {
  documentType: string;
  documentTypeCode: string;
  applicableLaw: string[];
  language: "fr" | "en";
  district?: string;
  courtFileNumber?: string;
}): string {
  const { documentType, documentTypeCode, applicableLaw, language, district, courtFileNumber } = params;
  const districtLine = district ? `  <district>${district}</district>` : "";
  const fileLine = courtFileNumber ? `  <court_file_number>${courtFileNumber}</court_file_number>` : "";
  return `<context>
  <jurisdiction>${JURISDICTION}</jurisdiction>
  <document_type>${documentType}</document_type>
  <document_type_code>${documentTypeCode}</document_type_code>
  <applicable_law>${applicableLaw.join("; ")}</applicable_law>
  <language>${language}</language>
${districtLine}
${fileLine}
</context>`;
}

export function buildClientDataXml(client: ClientData, language: "fr" | "en"): string {
  const children =
    client.children && client.children.length > 0
      ? client.children
          .map(
            (c) =>
              `    <child><prenom>${c.prenom}</prenom>${c.nom ? `<nom>${c.nom}</nom>` : ""}${c.dateNaissance ? `<date_naissance>${c.dateNaissance}</date_naissance>` : ""}${c.custodyType ? `<custody_type>${c.custodyType}</custody_type>` : ""}</child>`
          )
          .join("\n")
      : "";
  return `<client_data>
  <display_name>${client.displayName}</display_name>
  <type_client>${client.typeClient}</type_client>
  ${client.prenom ? `<prenom>${client.prenom}</prenom>` : ""}
  ${client.nom ? `<nom>${client.nom}</nom>` : ""}
  ${client.raisonSociale ? `<raison_sociale>${client.raisonSociale}</raison_sociale>` : ""}
  ${client.dateNaissance ? `<date_naissance>${client.dateNaissance}</date_naissance>` : ""}
  ${client.adresse ? `<adresse>${client.adresse}</adresse>` : ""}
  ${client.matrimonialRegime ? `<matrimonial_regime>${client.matrimonialRegime}</matrimonial_regime>` : ""}
  ${client.custodyArrangement ? `<custody_arrangement>${client.custodyArrangement}</custody_arrangement>` : ""}
  ${client.otherPartyName ? `<other_party_name>${client.otherPartyName}</other_party_name>` : ""}
  ${children ? `<children>\n${children}\n  </children>` : ""}
</client_data>`;
}

export function buildDossierDataXml(dossier: DossierData): string {
  return `<dossier_data>
  <intitule>${dossier.intitule}</intitule>
  ${dossier.type ? `<type>${dossier.type}</type>` : ""}
  ${dossier.districtJudiciaire ? `<district>${dossier.districtJudiciaire}</district>` : ""}
  ${dossier.numeroDossierTribunal ? `<numero_tribunal>${dossier.numeroDossierTribunal}</numero_tribunal>` : ""}
  ${dossier.resumeDossier ? `<resume_dossier>${dossier.resumeDossier}</resume_dossier>` : ""}
  ${dossier.notesStrategieJuridique ? `<notes_strategie>${dossier.notesStrategieJuridique}</notes_strategie>` : ""}
</dossier_data>`;
}

export function buildTemplateSectionsXml(sections: TemplateSectionSpec[]): string {
  if (sections.length === 0) return "";
  const sectionLines = sections
    .map(
      (s) =>
        `  <section id="${s.id}"${s.legalRef ? ` legal_ref="${s.legalRef}"` : ""}${s.narrative ? ' narrative="true"' : ""}>${s.labelFr ?? s.labelEn ?? ""}</section>`
    )
    .join("\n");
  return `<template_sections>\n${sectionLines}\n</template_sections>`;
}

/** Construit le bloc de prompt utilisateur pour une génération narrative (partie rédigée par l'IA). */
export function buildUserPrompt(params: {
  contextXml: string;
  clientDataXml: string;
  dossierDataXml: string;
  sectionsXml: string;
  language: "fr" | "en";
  narrativeInstruction?: string;
}): string {
  const { contextXml, clientDataXml, dossierDataXml, sectionsXml, language, narrativeInstruction } = params;
  const instruction =
    narrativeInstruction ??
    (language === "fr"
      ? "Rédige les sections demandées en respectant le contexte et les données client/dossier. Inclus uniquement le contenu juridique demandé, sans répéter les balises XML dans le corps du texte."
      : "Draft the requested sections according to the context and client/matter data. Include only the requested legal content, without repeating XML tags in the body.");
  return `${contextXml}

${clientDataXml}

${dossierDataXml}

${sectionsXml}

${instruction}`;
}
