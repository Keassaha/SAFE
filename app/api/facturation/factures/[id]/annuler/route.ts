import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canManageInvoices } from "@/lib/auth/permissions";
import { cancelDraft } from "@/lib/services/billing";
import type { UserRole } from "@prisma/client";

function getSessionData() {
  return getServerSession(authOptions).then((session) => {
    if (!session?.user) return null;
    const cabinetId = (session.user as { cabinetId?: string }).cabinetId;
    const userId = (session.user as { id?: string }).id;
    const role = (session.user as { role?: string }).role as UserRole;
    if (!cabinetId || !userId) return null;
    return { cabinetId, userId, role };
  });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const data = await getSessionData();
  if (!data) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  const { cabinetId, userId, role } = data;
  if (!canManageInvoices(role)) {
    return NextResponse.json({ error: "Droits insuffisants" }, { status: 403 });
  }

  const { id } = await params;
  const invoice = await prisma.invoice.findFirst({
    where: { id, cabinetId },
  });
  if (!invoice) {
    return NextResponse.json({ error: "Facture introuvable" }, { status: 404 });
  }

  let body: { cancelReason?: string } = {};
  try {
    body = await request.json().catch(() => ({}));
  } catch {
    // no body
  }

  try {
    await cancelDraft({
      invoiceId: id,
      cancelReason: body.cancelReason ?? undefined,
      performedById: userId,
      cabinetId,
    });
    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur lors de l'annulation";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
