"use server";

import { prisma } from "@/lib/db";
import { requireCabinetAndUser } from "@/lib/auth/session";

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
        mandate: {
          select: {
            checklist: true,
          },
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

  // Organize documents by type
  documents.forEach((doc) => {
    const docType = doc.documentType || "autre";
    const item: DocumentItem = {
      id: doc.id,
      title: doc.nom,
      type: "document",
      documentType: docType,
      hasContent: true,
      createdAt: doc.createdAt,
    };

    // Categorize by document type
    if (docType === "mandat" || docType === "engagement") {
      briefcases.mandat.items.push(item);
    } else if (docType === "formulaire") {
      briefcases.formulaires.items.push(item);
    } else if (docType === "procedure") {
      briefcases.procedures.items.push(item);
    } else if (docType === "jugement" || docType === "judgment") {
      briefcases.jugements.items.push(item);
    } else if (docType === "correspondance" || docType === "correspondence") {
      briefcases.correspondance.items.push(item);
    } else if (docType === "closure" || docType === "fermeture") {
      briefcases.fermeture.items.push(item);
    } else {
      briefcases.formulaires.items.push(item);
    }
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

    if (doc.type === "lettre" || doc.type === "procedure") {
      briefcases.procedures.items.push(item);
    } else if (doc.type === "contrat") {
      briefcases.mandat.items.push(item);
    } else {
      briefcases.formulaires.items.push(item);
    }
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
