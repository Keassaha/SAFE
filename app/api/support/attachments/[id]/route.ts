import { NextResponse } from "next/server";
import { requireCabinetAndUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { isSafeIncCabinet } from "@/lib/safe-inc";
import { readDocumentObject } from "@/lib/services/document";

// GET /api/support/attachments/[id]
// Sert une pièce jointe de chat. Accès : cabinet propriétaire du fil ou SAFE Inc.
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let session;
  try {
    session = await requireCabinetAndUser();
  } catch {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const piece = await prisma.supportAttachment.findUnique({
    where: { id },
    select: {
      nom: true,
      mimeType: true,
      sizeBytes: true,
      storageKey: true,
      message: { select: { conversation: { select: { cabinetId: true } } } },
    },
  });
  if (!piece) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  const convoCabinetId = piece.message.conversation.cabinetId;
  const isOwner = convoCabinetId === session.cabinetId;
  const isSafe = await isSafeIncCabinet(session.cabinetId);
  if (!isOwner && !isSafe) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const buffer = await readDocumentObject(piece.storageKey);

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": piece.mimeType || "application/octet-stream",
      "Content-Disposition": `inline; filename="${encodeURIComponent(piece.nom)}"`,
      "Content-Length": String(piece.sizeBytes),
      "Cache-Control": "private, no-store",
    },
  });
}
