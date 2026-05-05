import type { Prisma, Dossier, Document, RichDocument } from "@prisma/client";
import { prisma } from "@/lib/db";
import {
  resolveAvailableSectionKey,
  suggestPracticeDocument,
  type PracticeDocumentSuggestion,
} from "./practice-docket";

type TxClient = Prisma.TransactionClient | typeof prisma;

type DossierForDocket = Pick<Dossier, "id" | "cabinetId" | "clientId" | "type" | "sousType">;

type DocumentForDocket = Pick<
  Document,
  "id" | "nom" | "documentType" | "sectionKey" | "classificationSubtype" | "classificationConfidence"
>;

type RichDocumentForDocket = Pick<RichDocument, "id" | "titre" | "type">;

export async function createDocketEntryForImportedDocument(params: {
  client?: TxClient;
  dossier: DossierForDocket;
  document: DocumentForDocket;
  availableSectionKeys?: string[];
  createdById?: string | null;
  source?: string;
}): Promise<{ created: true; id: string; suggestion: PracticeDocumentSuggestion } | { created: false; reason: "not_significant" | "already_exists"; suggestion: PracticeDocumentSuggestion }> {
  const client = params.client ?? prisma;
  const suggestion = suggestPracticeDocument({
    dossierType: params.dossier.type,
    dossierSousType: params.dossier.sousType,
    fileName: params.document.nom,
    documentType: params.document.documentType,
  });

  if (!suggestion.shouldCreateDocketEntry) {
    return { created: false, reason: "not_significant", suggestion };
  }

  const existing = await client.dossierDocketEntry.findFirst({
    where: {
      cabinetId: params.dossier.cabinetId,
      linkedDocumentId: params.document.id,
    },
    select: { id: true },
  });

  if (existing) {
    return { created: false, reason: "already_exists", suggestion };
  }

  const sectionKey = resolveAvailableSectionKey(suggestion.sectionKey, params.availableSectionKeys);
  const created = await client.dossierDocketEntry.create({
    data: {
      cabinetId: params.dossier.cabinetId,
      clientId: params.dossier.clientId,
      dossierId: params.dossier.id,
      entryType: suggestion.docketEntryType,
      docketMode: suggestion.docketMode,
      title: suggestion.title,
      status: suggestion.needsReview ? "a_reviser" : "classe",
      sectionKey,
      linkedDocumentId: params.document.id,
      source: params.source ?? "document_import",
      confidence: suggestion.confidence,
      needsReview: suggestion.needsReview,
      notes: suggestion.reason,
      metadata: JSON.stringify({
        subtype: suggestion.subtype,
        originalSectionKey: suggestion.sectionKey,
      }),
      createdById: params.createdById ?? null,
    },
    select: { id: true },
  });

  return { created: true, id: created.id, suggestion: { ...suggestion, sectionKey } };
}

export async function createDocketEntryForRichDocument(params: {
  client?: TxClient;
  dossier: DossierForDocket;
  richDocument: RichDocumentForDocket;
  availableSectionKeys?: string[];
  createdById?: string | null;
}): Promise<{ created: true; id: string; suggestion: PracticeDocumentSuggestion } | { created: false; reason: "not_significant" | "already_exists"; suggestion: PracticeDocumentSuggestion }> {
  const client = params.client ?? prisma;
  const suggestion = suggestPracticeDocument({
    dossierType: params.dossier.type,
    dossierSousType: params.dossier.sousType,
    fileName: params.richDocument.titre,
    richDocumentType: params.richDocument.type,
  });

  if (!suggestion.shouldCreateDocketEntry) {
    return { created: false, reason: "not_significant", suggestion };
  }

  const existing = await client.dossierDocketEntry.findFirst({
    where: {
      cabinetId: params.dossier.cabinetId,
      linkedRichDocumentId: params.richDocument.id,
    },
    select: { id: true },
  });

  if (existing) {
    return { created: false, reason: "already_exists", suggestion };
  }

  const sectionKey = resolveAvailableSectionKey(suggestion.sectionKey, params.availableSectionKeys);
  const created = await client.dossierDocketEntry.create({
    data: {
      cabinetId: params.dossier.cabinetId,
      clientId: params.dossier.clientId,
      dossierId: params.dossier.id,
      entryType: suggestion.docketEntryType,
      docketMode: suggestion.docketMode,
      title: suggestion.title,
      status: suggestion.needsReview ? "a_reviser" : "classe",
      sectionKey,
      linkedRichDocumentId: params.richDocument.id,
      source: "rich_document",
      confidence: suggestion.confidence,
      needsReview: suggestion.needsReview,
      notes: suggestion.reason,
      metadata: JSON.stringify({
        subtype: suggestion.subtype,
        originalSectionKey: suggestion.sectionKey,
      }),
      createdById: params.createdById ?? null,
    },
    select: { id: true },
  });

  return { created: true, id: created.id, suggestion: { ...suggestion, sectionKey } };
}
