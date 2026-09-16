import { dossierDocumentScope } from "@/lib/edition/access";
import { NextRequest, NextResponse } from "next/server";
import { requireCabinetAndUser } from "@/lib/auth/session";
import { canViewDocuments } from "@/lib/auth/permissions";
import type { UserRole } from "@prisma/client";
import { prisma } from "@/lib/db";
import { z } from "zod";
import {
  resolveAvailableSectionKey,
  suggestPracticeDocument,
} from "@/lib/dossiers/practice-docket";
import { createDocketEntryForImportedDocument } from "@/lib/dossiers/docket-service";

const ConfirmSchema = z.object({
  documentId: z.string().min(1),
  dossierId: z.string().min(1),
  clientId: z.string().optional(),
  documentType: z.string().default("autre"),
  nom: z.string().optional(), // Titre personnalisé optionnel
  iaConfidence: z.number().optional(),
  iaValidated: z.boolean().default(false),
});

// POST /api/edition/upload/confirm
// L'avocat confirme la classification → assigne le fichier au bon dossier
export async function POST(req: NextRequest) {
  const session = await requireCabinetAndUser();
  if (!canViewDocuments(session.role as UserRole)) {
    return NextResponse.json({ error: "Droits insuffisants" }, { status: 403 });
  }
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const body = await req.json();
  const parsed = ConfirmSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { documentId, dossierId, documentType, nom, iaConfidence, iaValidated } =
    parsed.data;

  // Seul un téléversement non classé de cet utilisateur peut être confirmé.
  const doc = await prisma.document.findFirst({
    where: { id: documentId, cabinetId: session.cabinetId, uploadedById: session.userId, dossierId: null, clientId: null },
  });
  if (!doc) return NextResponse.json({ error: "Document introuvable" }, { status: 404 });

  // Vérifier aussi le droit sur le dossier destinataire.
  const dossier = await prisma.dossier.findFirst({
    where: { id: dossierId, ...dossierDocumentScope(session) },
    include: {
      client: { select: { id: true } },
      sections: { where: { archive: false }, select: { sectionKey: true } },
    },
  });
  if (!dossier) return NextResponse.json({ error: "Dossier introuvable" }, { status: 404 });

  const availableSectionKeys = dossier.sections.map((section) => section.sectionKey);
  const suggestion = suggestPracticeDocument({
    dossierType: dossier.type,
    dossierSousType: dossier.sousType,
    fileName: nom ?? doc.nom,
    documentType,
  });
  const sectionKey = resolveAvailableSectionKey(suggestion.sectionKey, availableSectionKeys);

  // Mettre à jour le document avec le dossier et le type
  const result = await prisma.$transaction(async (tx) => {
    const claimed = await tx.document.updateMany({
      where: { id: documentId, cabinetId: session.cabinetId, uploadedById: session.userId, dossierId: null, clientId: null },
      data: {
        dossierId,
        clientId: dossier.client.id,
        documentType,
        sectionKey,
        classificationSubtype: suggestion.subtype,
        classificationConfidence: iaConfidence ?? suggestion.confidence,
        classificationNeedsReview: suggestion.needsReview,
        classificationReason: suggestion.reason,
        templateCode: suggestion.subtype,
        aiAssisted: iaValidated,
        nom: nom ?? doc.nom,
        reviewedAt: new Date(),
        reviewedById: session.userId,
      },
    });

    if (claimed.count !== 1) return null;
    const updated = await tx.document.findFirst({ where: { id: documentId, cabinetId: session.cabinetId } });
    if (!updated) throw new Error("Document introuvable après classement");

    const docketResult = await createDocketEntryForImportedDocument({
      client: tx,
      dossier,
      document: updated,
      availableSectionKeys,
      createdById: session.userId,
    });

    // Journaliser tout classement, assisté ou non par IA.
    {
      await tx.auditLog.create({
        data: {
          cabinetId: session.cabinetId,
          userId: session.userId,
          entityType: "Document",
          entityId: documentId,
          action: iaValidated ? "ia_classification_validated" : "document_classified",
          newValues: JSON.stringify({
            dossierId,
            documentType,
            sectionKey,
            classificationSubtype: suggestion.subtype,
            iaConfidence,
            validatedBy: session.userId,
            docketEntryCreated: docketResult.created,
          }),
          performedAt: new Date(),
        },
      });
    }

    return { document: updated, docket: docketResult };
  });
  if (!result) return NextResponse.json({ error: "Ce document a déjà été classé." }, { status: 409 });

  return NextResponse.json(result);
}
