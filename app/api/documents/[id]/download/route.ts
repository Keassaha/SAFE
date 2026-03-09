import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { canAccessDocument } from "@/lib/services/document";
import { createAuditLog } from "@/lib/services/audit";
import type { UserRole } from "@prisma/client";
import fs from "fs/promises";
import path from "path";
import { prisma } from "@/lib/db";

const UPLOAD_BASE = process.env.UPLOAD_DIR ?? path.join(process.cwd(), "uploads");

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  const cabinetId = (session.user as { cabinetId?: string }).cabinetId;
  const userId = (session.user as { id?: string }).id;
  const role = (session.user as { role?: string }).role as UserRole;
  if (!cabinetId || !userId) {
    return NextResponse.json({ error: "Session incomplète" }, { status: 403 });
  }

  const { id } = await params;
  const allowed = await canAccessDocument(id, cabinetId, userId, role, "view");
  if (!allowed) {
    return NextResponse.json({ error: "Accès refusé à ce document" }, { status: 403 });
  }

  const doc = await prisma.document.findFirst({
    where: { id, cabinetId },
  });
  if (!doc) {
    return NextResponse.json({ error: "Document introuvable" }, { status: 404 });
  }

  const fullPath = path.join(UPLOAD_BASE, doc.storageKey);
  let buffer: Buffer;
  try {
    buffer = await fs.readFile(fullPath);
  } catch {
    return NextResponse.json({ error: "Fichier introuvable" }, { status: 404 });
  }

  await createAuditLog({
    cabinetId,
    userId,
    entityType: "Document",
    entityId: id,
    action: "download",
    metadata: { nom: doc.nom },
  });

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": doc.mimeType,
      "Content-Disposition": `attachment; filename="${encodeURIComponent(doc.nom)}"`,
      "Content-Length": String(doc.sizeBytes),
    },
  });
}
