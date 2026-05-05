import { NextRequest, NextResponse } from "next/server";
import { requireCabinetAndUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireCabinetAndUser();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;
  const dossier = await prisma.dossier.findFirst({
    where: { id, cabinetId: session.cabinetId },
    select: { id: true },
  });
  if (!dossier) return NextResponse.json({ error: "Dossier introuvable" }, { status: 404 });

  const entries = await prisma.dossierDocketEntry.findMany({
    where: { cabinetId: session.cabinetId, dossierId: id },
    orderBy: [{ eventDate: "asc" }, { sequenceNumber: "asc" }, { createdAt: "asc" }],
    select: {
      id: true,
      entryType: true,
      docketMode: true,
      title: true,
      status: true,
      eventDate: true,
      sectionKey: true,
      confidence: true,
      needsReview: true,
      notes: true,
      source: true,
      createdAt: true,
      linkedDocument: { select: { id: true, nom: true, mimeType: true } },
      linkedRichDocument: { select: { id: true, titre: true, type: true, statut: true } },
    },
  });

  return NextResponse.json({ entries });
}
