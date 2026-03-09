import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canValidateInvoice } from "@/lib/auth/permissions";
import { issueInvoice } from "@/lib/services/billing";
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

/** Marque la facture comme envoyée (émission : READY_TO_ISSUE ou DRAFT → ISSUED). */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const data = await getSessionData();
  if (!data) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  const { cabinetId, userId, role } = data;

  const { id } = await params;
  const invoice = await prisma.invoice.findFirst({
    where: { id, cabinetId },
    include: {
      dossier: { select: { avocatResponsableId: true } },
    },
  });

  if (!invoice) {
    return NextResponse.json({ error: "Facture introuvable" }, { status: 404 });
  }
  if (invoice.invoiceStatus !== "DRAFT" && invoice.invoiceStatus !== "READY_TO_ISSUE") {
    return NextResponse.json(
      { error: "Seule une facture brouillon ou approuvée peut être envoyée" },
      { status: 400 }
    );
  }

  const avocatResponsableId = invoice.dossier?.avocatResponsableId ?? null;
  if (!canValidateInvoice(role, avocatResponsableId, userId)) {
    return NextResponse.json({ error: "Droits insuffisants" }, { status: 403 });
  }

  try {
    await issueInvoice({ invoiceId: id, approvedById: userId, cabinetId });
    return NextResponse.json({ success: true, invoiceId: id });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur lors de l'envoi";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
