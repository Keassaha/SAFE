import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canManageInvoices } from "@/lib/auth/permissions";
import { readDocumentObject } from "@/lib/services/document";
import type { UserRole } from "@prisma/client";

const CONTENT_TYPE: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  webp: "image/webp",
  pdf: "application/pdf",
};

function getSessionData() {
  return getServerSession(authOptions).then((session) => {
    if (!session?.user) return null;
    const cabinetId = (session.user as { cabinetId?: string }).cabinetId;
    const role = (session.user as { role?: string }).role as UserRole;
    if (!cabinetId) return null;
    return { cabinetId, role };
  });
}

/** Diffuse la preuve de paiement conservée (image/PDF). */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const data = await getSessionData();
  if (!data) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  if (!canManageInvoices(data.role)) {
    return NextResponse.json({ error: "Droits insuffisants" }, { status: 403 });
  }

  const { id } = await params;
  const payment = await prisma.payment.findFirst({
    where: { id, cabinetId: data.cabinetId },
    select: { preuveStorageKey: true },
  });
  if (!payment?.preuveStorageKey) {
    return NextResponse.json({ error: "Aucune preuve" }, { status: 404 });
  }

  const ext = payment.preuveStorageKey.split(".").pop()?.toLowerCase() ?? "";
  try {
    const buffer = await readDocumentObject(payment.preuveStorageKey);
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": CONTENT_TYPE[ext] ?? "application/octet-stream",
        "Content-Disposition": "inline",
        "Cache-Control": "private, no-store",
      },
    });
  } catch {
    return NextResponse.json({ error: "Preuve introuvable" }, { status: 404 });
  }
}
