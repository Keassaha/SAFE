import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { canAccessDocument, deleteDocument } from "@/lib/services/document";
import type { UserRole } from "@prisma/client";

export async function DELETE(
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
  const allowed = await canAccessDocument(id, cabinetId, userId, role, "manage");
  if (!allowed) {
    return NextResponse.json({ error: "Droits insuffisants" }, { status: 403 });
  }

  const ok = await deleteDocument(id, cabinetId, userId);
  if (!ok) {
    return NextResponse.json({ error: "Document introuvable" }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}
