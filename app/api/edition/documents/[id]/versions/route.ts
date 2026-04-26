import { NextRequest, NextResponse } from "next/server";
import { requireCabinetAndUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

// GET /api/edition/documents/[id]/versions — liste toutes les versions
export async function GET(
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

  const versions = await prisma.richDocumentVersion.findMany({
    where: { richDocumentId: id },
    include: { createdBy: { select: { nom: true } } },
    orderBy: { versionNumber: "desc" },
  });

  return NextResponse.json(versions);
}

// POST /api/edition/documents/[id]/versions — snapshot manuel
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await requireCabinetAndUser();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { label } = await req.json().catch(() => ({}));

  const doc = await prisma.richDocument.findFirst({
    where: { id, cabinetId: session.cabinetId, isArchived: false },
  });
  if (!doc) return NextResponse.json({ error: "Document introuvable" }, { status: 404 });

  const lastVersion = await prisma.richDocumentVersion.findFirst({
    where: { richDocumentId: id },
    orderBy: { versionNumber: "desc" },
  });

  const version = await prisma.richDocumentVersion.create({
    data: {
      richDocumentId: id,
      cabinetId: session.cabinetId,
      createdById: session.userId,
      content: doc.content,
      versionNumber: (lastVersion?.versionNumber ?? 0) + 1,
      label: label ?? `Snapshot manuel`,
    },
    include: { createdBy: { select: { nom: true } } },
  });

  return NextResponse.json(version, { status: 201 });
}
