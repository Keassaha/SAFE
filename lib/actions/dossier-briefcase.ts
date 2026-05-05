"use server";

import { prisma } from "@/lib/db";
import { requireCabinetAndUser } from "@/lib/auth/session";
import { resolveAvailableSectionKey, suggestPracticeDocument } from "@/lib/dossiers/practice-docket";

export async function getBriefcaseData(dossierId: string) {
  const { cabinetId } = await requireCabinetAndUser();

  const [documents, richDocuments, dossier] = await Promise.all([
    prisma.document.findMany({
      where: {
        dossierId,
        cabinetId,
      },
      select: {
        id: true,
        nom: true,
        documentType: true,
        createdAt: true,
        uploadedById: true,
        storageKey: true,
        mimeType: true,
        sectionKey: true,
        classificationSubtype: true,
        classificationConfidence: true,
        classificationNeedsReview: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.richDocument.findMany({
      where: {
        dossierId,
        cabinetId,
      },
      select: {
        id: true,
        titre: true,
        type: true,
        statut: true,
        createdAt: true,
        createdById: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.dossier.findUnique({
      where: { id: dossierId },
      select: {
        id: true,
        type: true,
        sousType: true,
        mandate: {
          select: {
            checklist: true,
          },
        },
        sections: {
          where: { archive: false },
          select: { sectionKey: true },
        },
      },
    }),
  ]);

  // Transform to briefcase structure
  const briefcaseData = organizeByCategoryAndSubsection(documents, richDocuments, dossier);

  return briefcaseData;
}

interface DocumentItem {
  id: string;
  title: string;
  type: "document" | "rich-document";
  documentType?: string;
  subtype?: string | null;
  confidence?: number | null;
  needsReview?: boolean;
  hasContent: boolean;
  isRequired?: boolean;
  createdAt: Date;
}

function organizeByCategoryAndSubsection(
  documents: any[],
  richDocuments: any[],
  dossier: any
) {
  const briefcases: Record<string, { items: DocumentItem[]; subsections?: Record<string, DocumentItem[]> }> = {
    mandat: { items: [], subsections: {} },
    formulaires: { items: [], subsections: {} },
    "pieces-madame": { items: [], subsections: {} },
    "pieces-monsieur": { items: [], subsections: {} },
    procedures: { items: [], subsections: {} },
    jugements: { items: [], subsections: {} },
    correspondance: { items: [], subsections: {} },
    fideicommis: { items: [], subsections: {} },
    "notes-honoraires": { items: [], subsections: {} },
    fermeture: { items: [], subsections: {} },
  };

  // Parse mandate checklist for required documents
  const mandateChecklist = (dossier?.mandate?.checklist as Array<{ label?: string; obligatoire?: boolean; checked?: boolean }> | null) ?? [];
  const requiredLabels = mandateChecklist
    .filter((item) => item.obligatoire === true)
    .map((item) => item.label?.toLowerCase() ?? "");
  const availableSectionKeys = dossier?.sections?.map((s: { sectionKey: string }) => s.sectionKey) ?? [];
  for (const sectionKey of availableSectionKeys) {
    briefcases[sectionKey] ??= { items: [], subsections: {} };
  }

  // Organize documents by type
  documents.forEach((doc) => {
    const docType = doc.documentType || "autre";
    const item: DocumentItem = {
      id: doc.id,
      title: doc.nom,
      type: "document",
      documentType: docType,
      subtype: doc.classificationSubtype,
      confidence: doc.classificationConfidence,
      needsReview: doc.classificationNeedsReview,
      hasContent: true,
      createdAt: doc.createdAt,
    };

    const suggestion = suggestPracticeDocument({
      dossierType: dossier?.type,
      dossierSousType: dossier?.sousType,
      fileName: doc.nom,
      documentType: docType,
    });
    const sectionKey = resolveAvailableSectionKey(doc.sectionKey ?? suggestion.sectionKey, availableSectionKeys);
    (briefcases[sectionKey] ?? briefcases.formulaires).items.push(item);
  });

  // Organize rich documents
  richDocuments.forEach((doc) => {
    const item: DocumentItem = {
      id: doc.id,
      title: doc.titre,
      type: "rich-document",
      documentType: doc.type,
      hasContent: true,
      createdAt: doc.createdAt,
    };

    const suggestion = suggestPracticeDocument({
      dossierType: dossier?.type,
      dossierSousType: dossier?.sousType,
      fileName: doc.titre,
      richDocumentType: doc.type,
    });
    const sectionKey = resolveAvailableSectionKey(suggestion.sectionKey, availableSectionKeys);
    (briefcases[sectionKey] ?? briefcases.formulaires).items.push(item);
  });

  // Sort items by creation date
  Object.keys(briefcases).forEach((key) => {
    briefcases[key].items.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  });

  return briefcases;
}

export async function getDocumentContent(documentId: string, type: "document" | "rich-document") {
  const { cabinetId } = await requireCabinetAndUser();

  if (type === "document") {
    return prisma.document.findFirst({
      where: { id: documentId, cabinetId },
      select: {
        id: true,
        nom: true,
        documentType: true,
        mimeType: true,
        storageKey: true,
        uploadedById: true,
        createdAt: true,
      },
    });
  } else {
    return prisma.richDocument.findFirst({
      where: { id: documentId, cabinetId },
      select: {
        id: true,
        titre: true,
        type: true,
        content: true,
        statut: true,
        createdById: true,
        createdAt: true,
      },
    });
  }
}
