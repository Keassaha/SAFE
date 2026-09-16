import { richDocumentScope } from "@/lib/edition/access";
import { NextRequest, NextResponse } from "next/server";
import { requireCabinetAndUser } from "@/lib/auth/session";
import { canViewDocuments } from "@/lib/auth/permissions";
import type { UserRole } from "@prisma/client";
import { prisma } from "@/lib/db";

// POST /api/edition/documents/[id]/versions/[versionId]/restore
// Restaure une version → crée une nouvelle version "restauration de v.X" + met à jour le contenu
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; versionId: string }> }
) {
  const { id, versionId } = await params;
  const session = await requireCabinetAndUser();
  if (!canViewDocuments(session.role as UserRole)) {
    return NextResponse.json({ error: "Droits insuffisants" }, { status: 403 });
  }
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const doc = await prisma.richDocument.findFirst({
    where: { id, ...richDocumentScope(session), isArchived: false },
  });
  if (!doc) return NextResponse.json({ error: "Document introuvable" }, { status: 404 });

  const targetVersion = await prisma.richDocumentVersion.findFirst({
    where: { id: versionId, richDocumentId: id, cabinetId: session.cabinetId },
  });
  if (!targetVersion) return NextResponse.json({ error: "Version introuvable" }, { status: 404 });

  const restored = await prisma.$transaction(async (tx) => {
    const changed = await tx.richDocument.updateMany({
      where: { id, ...richDocumentScope(session), isArchived: false, updatedAt: doc.updatedAt },
      data: {
        content: targetVersion.content, lastEditedById: session.userId, lastEditedAt: new Date(),
        updatedAt: new Date(Math.max(Date.now(), doc.updatedAt.getTime() + 1)),
      },
    });
    if (changed.count !== 1) return false;
    const lastVersion = await tx.richDocumentVersion.findFirst({
      where: { richDocumentId: id, cabinetId: session.cabinetId },
      orderBy: { versionNumber: "desc" },
    });
    await tx.richDocumentVersion.create({ data: {
      richDocumentId: id, cabinetId: session.cabinetId, createdById: session.userId,
      content: doc.content, versionNumber: (lastVersion?.versionNumber ?? 0) + 1,
      label: `Avant restauration v.${targetVersion.versionNumber}`,
    } });
    await tx.richDocumentVersion.create({ data: {
      richDocumentId: id, cabinetId: session.cabinetId, createdById: session.userId,
      content: targetVersion.content, versionNumber: (lastVersion?.versionNumber ?? 0) + 2,
      label: `Restauré depuis v.${targetVersion.versionNumber}`,
    } });
    return true;
  });
  if (!restored) return NextResponse.json({ error: "Le document a changé. Rechargez-le avant de restaurer." }, { status: 409 });

  return NextResponse.json({
    success: true,
    restoredContent: targetVersion.content,
    message: `Version ${targetVersion.versionNumber} restaurée`,
  });
}
