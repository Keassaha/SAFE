import { NextRequest, NextResponse } from "next/server";
import { requireCabinetAndUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { z } from "zod";

const ConfirmSchema = z.object({
  documentId: z.string().min(1),
  dossierId: z.string().min(1),
  clientId: z.string().min(1),
  documentType: z.string().default("autre"),
  nom: z.string().optional(), // Titre personnalisé optionnel
  iaConfidence: z.number().optional(),
  iaValidated: z.boolean().default(false),
});

// POST /api/edition/upload/confirm
// L'avocat confirme la classification → assigne le fichier au bon dossier
export async function POST(req: NextRequest) {
  const session = await requireCabinetAndUser();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const body = await req.json();
  const parsed = ConfirmSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { documentId, dossierId, clientId, documentType, nom, iaConfidence, iaValidated } =
    parsed.data;

  // Vérifier que le document appartient au cabinet
  const doc = await prisma.document.findFirst({
    where: { id: documentId, cabinetId: session.cabinetId },
  });
  if (!doc) return NextResponse.json({ error: "Document introuvable" }, { status: 404 });

  // Vérifier que le dossier appartient au cabinet
  const dossier = await prisma.dossier.findFirst({
    where: { id: dossierId, cabinetId: session.cabinetId },
    include: { client: { select: { id: true } } },
  });
  if (!dossier) return NextResponse.json({ error: "Dossier introuvable" }, { status: 404 });

  // Mettre à jour le document avec le dossier et le type
  const updated = await prisma.document.update({
    where: { id: documentId },
    data: {
      dossierId,
      clientId,
      documentType,
      nom: nom ?? doc.nom,
      reviewedAt: new Date(),
      reviewedById: session.userId,
    },
  });

  // Logguer la classification IA dans l'audit
  if (iaValidated) {
    await prisma.auditLog.create({
      data: {
        cabinetId: session.cabinetId,
        userId: session.userId,
        entityType: "Document",
        entityId: documentId,
        action: "ia_classification_validated",
        newValues: JSON.stringify({
          dossierId,
          documentType,
          iaConfidence,
          validatedBy: session.userId,
        }),
        performedAt: new Date(),
      },
    });
  }

  return NextResponse.json({ document: updated });
}
