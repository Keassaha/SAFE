import { NextRequest, NextResponse } from "next/server";
import { requireCabinetAndUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { z } from "zod";

const UpdateDocSchema = z.object({
  titre: z.string().min(1).max(255).optional(),
  content: z.string().optional(),
  statut: z.enum(["brouillon", "final", "archive"]).optional(),
});

// GET /api/edition/documents/[id]
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await requireCabinetAndUser();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const doc = await prisma.richDocument.findFirst({
    where: { id, cabinetId: session.cabinetId, isArchived: false },
    include: {
      createdBy: { select: { nom: true } },
      lastEditedBy: { select: { nom: true } },
      dossier: { select: { id: true, intitule: true, numeroDossier: true } },
      client: { select: { id: true, raisonSociale: true } },
      versions: {
        orderBy: { versionNumber: "desc" },
        take: 10,
        include: { createdBy: { select: { nom: true } } },
      },
      workSessions: {
        where: { statut: "termine" },
        orderBy: { endedAt: "desc" },
        take: 5,
      },
    },
  });

  if (!doc) return NextResponse.json({ error: "Document introuvable" }, { status: 404 });

  return NextResponse.json(doc);
}

// PUT /api/edition/documents/[id]  (auto-save)
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await requireCabinetAndUser();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const body = await req.json();
  const parsed = UpdateDocSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const doc = await prisma.richDocument.findFirst({
    where: { id, cabinetId: session.cabinetId },
  });
  if (!doc) return NextResponse.json({ error: "Document introuvable" }, { status: 404 });

  const updated = await prisma.richDocument.update({
    where: { id },
    data: {
      ...parsed.data,
      lastEditedById: session.userId,
      lastEditedAt: new Date(),
    },
  });

  return NextResponse.json(updated);
}

// DELETE /api/edition/documents/[id]  — soft delete uniquement (conformité Barreau)
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await requireCabinetAndUser();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const doc = await prisma.richDocument.findFirst({
    where: { id, cabinetId: session.cabinetId },
  });
  if (!doc) return NextResponse.json({ error: "Document introuvable" }, { status: 404 });

  // JAMAIS de suppression réelle — Barreau du Québec
  await prisma.richDocument.update({
    where: { id },
    data: {
      isArchived: true,
      archivedAt: new Date(),
      archivedById: session.userId,
      statut: "archive",
    },
  });

  return NextResponse.json({ success: true, message: "Document archivé" });
}
