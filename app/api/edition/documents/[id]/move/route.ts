import { NextRequest, NextResponse } from "next/server";
import { requireCabinetAndUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { z } from "zod";

const MoveSchema = z.object({
  targetDossierId: z.string().min(1),
});

// PUT /api/edition/documents/[id]/move
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await requireCabinetAndUser();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const body = await req.json();
  const parsed = MoveSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { targetDossierId } = parsed.data;

  // Vérifier le document
  const doc = await prisma.richDocument.findFirst({
    where: { id, cabinetId: session.cabinetId, isArchived: false },
  });
  if (!doc) return NextResponse.json({ error: "Document introuvable" }, { status: 404 });

  // Vérifier le dossier cible
  const targetDossier = await prisma.dossier.findFirst({
    where: { id: targetDossierId, cabinetId: session.cabinetId },
    include: { client: { select: { id: true, raisonSociale: true } } },
  });
  if (!targetDossier) return NextResponse.json({ error: "Dossier cible introuvable" }, { status: 404 });

  // Déplacer
  const updated = await prisma.richDocument.update({
    where: { id },
    data: {
      dossierId: targetDossierId,
      clientId: targetDossier.client.id,
      lastEditedById: session.userId,
      lastEditedAt: new Date(),
    },
  });

  // Audit log
  await prisma.auditLog.create({
    data: {
      cabinetId: session.cabinetId,
      userId: session.userId,
      entityType: "RichDocument",
      entityId: id,
      action: "moved",
      oldValues: JSON.stringify({ dossierId: doc.dossierId }),
      newValues: JSON.stringify({ dossierId: targetDossierId, dossierIntitule: targetDossier.intitule }),
      performedAt: new Date(),
    },
  });

  return NextResponse.json({
    success: true,
    document: updated,
    targetDossier: { id: targetDossier.id, intitule: targetDossier.intitule },
  });
}
