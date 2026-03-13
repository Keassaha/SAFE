"use server";

/**
 * Server Actions pour la génération de documents droit familial
 * Charge client/dossier depuis la base, appelle le générateur, optionnellement enregistre le document.
 * + Génération depuis le wizard (template + formData + instructions IA).
 */

import { prisma } from "@/lib/db";
import { generateFamilyLawDocument, callClaude } from "./generate";
import { createDocumentRecord, prepareStorageForUpload } from "@/lib/services/document";
import { getDocumentTypeByCode } from "./taxonomy";
import { AI_DISCLAIMER_FR } from "./constants";
import type { ClientData, DossierData, GenerateOptions } from "./types";

export type GenerateWithFormDataResult =
  | { ok: true; content: string }
  | { ok: false; error: string };

/**
 * Génère un document à partir des données du wizard (catégorie, template, champs, instructions IA).
 * Utilisé par SafeDocGeneratorWizard.
 */
export async function generateDocumentWithFormData(params: {
  template: { name: string; form: string; ref: string };
  formData: Record<string, unknown>;
  customInstructions?: string;
}): Promise<GenerateWithFormDataResult> {
  const { template, formData, customInstructions } = params;

  const systemPrompt = `Tu es un avocat québécois spécialisé en droit familial. Tu rédiges des documents juridiques professionnels en français juridique québécois.

RÈGLES STRICTES :
- Utilise exclusivement la terminologie du droit civil québécois (CCQ, CPC, Loi sur le divorce)
- Ne JAMAIS inventer de références jurisprudentielles — marque [VÉRIFIER] si incertain
- Format standard québécois : CANADA / PROVINCE DE QUÉBEC / COUR SUPÉRIEURE / Chambre de la famille
- Distingue le français juridique québécois du français de France
- Température 0 : précision maximale, aucune créativité dans les références légales`;

  const userPrompt = `Génère le document suivant :

TYPE : ${template.name}
FORMULAIRE : ${template.form}
RÉFÉRENCES : ${template.ref}

DONNÉES DU DOSSIER :
${JSON.stringify(formData, null, 2)}

${customInstructions ? `INSTRUCTIONS SPÉCIFIQUES :\n${customInstructions}` : ""}

Génère le document complet en format professionnel. Inclus :
1. En-tête du tribunal (si procédure judiciaire)
2. Identification des parties
3. Exposé des faits
4. Fondements juridiques avec articles précis
5. Conclusions recherchées
6. Date et signature
7. En fin de document, ajoute l'avertissement : « Ce document a été préparé avec l'assistance d'outils d'intelligence artificielle et doit être révisé par un professionnel du droit avant toute utilisation. »`;

  try {
    const text = await callClaude({
      system: systemPrompt,
      user: userPrompt,
      maxTokens: 4000,
      temperature: 0,
    });
    const withDisclaimer = text.includes(AI_DISCLAIMER_FR)
      ? text
      : `${text}\n\n---\n${AI_DISCLAIMER_FR}`;
    return { ok: true, content: withDisclaimer };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return { ok: false, error: message };
  }
}

export type GenerateDocumentResult =
  | { ok: true; content: string; documentId?: string }
  | { ok: false; error: string };

/**
 * Génère un document droit familial pour un dossier existant.
 * Si saveToDossier est true, crée l'enregistrement Document et écrit le fichier (texte) dans le stockage.
 */
export async function generateDocumentForDossier(params: {
  cabinetId: string;
  userId: string;
  dossierId: string;
  documentTypeCode: string;
  language: "fr" | "en";
  saveToDossier?: boolean;
}): Promise<GenerateDocumentResult> {
  const { cabinetId, userId, dossierId, documentTypeCode, language, saveToDossier } = params;

  const dossier = await prisma.dossier.findFirst({
    where: { id: dossierId, cabinetId },
    include: { client: true },
  });
  if (!dossier) return { ok: false, error: "Dossier introuvable." };

  const docType = getDocumentTypeByCode(documentTypeCode);
  if (!docType) return { ok: false, error: `Type de document inconnu: ${documentTypeCode}.` };

  const client = dossier.client;
  const displayName =
    client.typeClient === "personne_physique" && (client.prenom || client.nom)
      ? [client.nom, client.prenom].filter(Boolean).join(", ")
      : client.raisonSociale ?? "";

  const clientData: ClientData = {
    displayName,
    typeClient: client.typeClient as "personne_physique" | "personne_morale",
    prenom: client.prenom ?? undefined,
    nom: client.nom ?? undefined,
    raisonSociale: client.raisonSociale ?? undefined,
    dateNaissance: client.dateNaissance?.toISOString().slice(0, 10),
    adresse: client.adresse ?? client.addressLine1 ?? undefined,
    city: client.city ?? undefined,
    province: client.province ?? undefined,
    postalCode: client.postalCode ?? undefined,
    langue: client.langue ?? undefined,
    matrimonialRegime: undefined, // à enrichir depuis un champ dossier/client si disponible
  };

  const dossierData: DossierData = {
    intitule: dossier.intitule,
    type: dossier.type ?? undefined,
    districtJudiciaire: dossier.districtJudiciaire ?? undefined,
    numeroDossierTribunal: dossier.numeroDossierTribunal ?? undefined,
    tribunalNom: dossier.tribunalNom ?? undefined,
    resumeDossier: dossier.resumeDossier ?? undefined,
    notesStrategieJuridique: dossier.notesStrategieJuridique ?? undefined,
  };

  const options: GenerateOptions = {
    documentTypeCode,
    language,
    client: clientData,
    dossier: dossierData,
    variables: {
      DISTRICT: dossier.districtJudiciaire ?? "",
      FILE_NUMBER: dossier.numeroDossierTribunal ?? "",
    },
  };

  try {
    const result = await generateFamilyLawDocument(options);
    if (!saveToDossier) {
      return { ok: true, content: result.content };
    }

    // Sauvegarde en fichier + enregistrement Document
    const crypto = await import("crypto");
    const fs = await import("fs/promises");
    const docId = crypto.randomUUID();
    const { fullPath, storageKey } = await prepareStorageForUpload(cabinetId, docId);
    await fs.writeFile(fullPath, result.content, "utf-8");
    const doc = await createDocumentRecord({
      cabinetId,
      userId,
      clientId: client.id,
      dossierId: dossier.id,
      nom: `${docType.nameFr}_${new Date().toISOString().slice(0, 10)}.txt`,
      mimeType: "text/plain",
      sizeBytes: Buffer.byteLength(result.content, "utf-8"),
      storageKey,
      retentionJusqua: undefined,
      documentType: docType.nameFr,
      templateCode: documentTypeCode,
      aiAssisted: result.meta.aiAssisted,
    });

    // Remplir / synchroniser le mandat du dossier à partir des données du dossier
    await prisma.dossierMandate.upsert({
      where: { dossierId: dossier.id },
      create: {
        dossierId: dossier.id,
        numeroDossier: dossier.numeroDossier ?? undefined,
        dateOuverture: dossier.dateOuverture,
        districtJudiciaire: dossier.districtJudiciaire ?? undefined,
        tribunal: dossier.tribunalNom ?? undefined,
        numeroRole: dossier.numeroDossierTribunal ?? undefined,
        avocatResponsableId: dossier.avocatResponsableId ?? undefined,
        statutDossier: dossier.statut,
      },
      update: {
        numeroDossier: dossier.numeroDossier ?? undefined,
        dateOuverture: dossier.dateOuverture,
        districtJudiciaire: dossier.districtJudiciaire ?? undefined,
        tribunal: dossier.tribunalNom ?? undefined,
        numeroRole: dossier.numeroDossierTribunal ?? undefined,
        avocatResponsableId: dossier.avocatResponsableId ?? undefined,
        statutDossier: dossier.statut,
      },
    });

    return { ok: true, content: result.content, documentId: doc.id };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return { ok: false, error: message };
  }
}
