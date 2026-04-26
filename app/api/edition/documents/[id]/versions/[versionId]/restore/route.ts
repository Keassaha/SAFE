import { NextRequest, NextResponse } from "next/server";
import { requireCabinetAndUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

// POST /api/edition/documents/[id]/versions/[versionId]/restore
// Restaure une version → crée une nouvelle version "restauration de v.X" + met à jour le contenu
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; versionId: string }> }
) {
  const { id, versionId } = await params;
  const session = await requireCabinetAndUser();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const doc = await prisma.richDocument.findFirst({
    where: { id, cabinetId: session.cabinetId, isArchived: false },
  });
  if (!doc) return NextResponse.json({ error: "Document introuvable" }, { status: 404 });

  const targetVersion = await prisma.richDocumentVersion.findFirst({
    where: { id: versionId, richDocumentId: id },
  });
  if (!targetVersion) return NextResponse.json({ error: "Version introuvable" }, { status: 404 });

  const lastVersion = await prisma.richDocumentVersion.findFirst({
    where: { richDocumentId: id },
    orderBy: { versionNumber: "desc" },
  });

  // Transaction : snapshot de l'état actuel + restauration + mise à jour du doc
  await prisma.$transaction([
    // 1. Snapshot de l'état avant restauration (sécurité Barreau)
    prisma.richDocumentVersion.create({
      data: {
        richDocumentId: id,
        cabinetId: session.cabinetId,
        createdById: session.userId,
        content: doc.content,
        versionNumber: (lastVersion?.versionNumber ?? 0) + 1,
        label: `Avant restauration v.${targetVersion.versionNumber}`,
      },
    }),
    // 2. Nouvelle version "restauration"
    prisma.richDocumentVersion.create({
      data: {
        richDocumentId: id,
        cabinetId: session.cabinetId,
        createdById: session.userId,
        content: targetVersion.content,
        versionNumber: (lastVersion?.versionNumber ?? 0) + 2,
        label: `Restauré depuis v.${targetVersion.versionNumber}${targetVersion.label ? ` — ${targetVersion.label}` : ""}`,
      },
    }),
    // 3. Mettre à jour le document avec le contenu restauré
    prisma.richDocument.update({
      where: { id },
      data: {
        content: targetVersion.content,
        lastEditedById: session.userId,
        lastEditedAt: new Date(),
      },
    }),
  ]);

  return NextResponse.json({
    success: true,
    restoredContent: targetVersion.content,
    message: `Version ${targetVersion.versionNumber} restaurée`,
  });
}
