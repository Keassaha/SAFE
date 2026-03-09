import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import type { UserRole } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { canManageInvoices, canValidateInvoice } from "@/lib/auth/permissions";
import { creerFactureDepuisTempsSchema } from "@/lib/validations/facturation";
import { createDraftFromBillableItems, issueInvoice } from "@/lib/services/billing";
import { prisma } from "@/lib/db";

function getSessionData() {
  return getServerSession(authOptions).then((session) => {
    if (!session?.user) return null;
    const cabinetId = (session.user as { cabinetId?: string }).cabinetId;
    const role = (session.user as { role?: string }).role as UserRole;
    const userId = (session.user as { id?: string }).id;
    if (!cabinetId || !userId) return null;
    return { cabinetId, userId, role };
  });
}

export async function POST(request: Request) {
  const data = await getSessionData();
  if (!data) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { cabinetId, userId, role } = data;
  if (!canManageInvoices(role)) {
    return NextResponse.json({ error: "Droits insuffisants" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corps de requête invalide" }, { status: 400 });
  }

  const parsed = creerFactureDepuisTempsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Données invalides", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { clientId, dossierId, timeEntryIds, expenseIds } = parsed.data;

  let avocatResponsableId: string | null = null;
  if (dossierId) {
    const dossier = await prisma.dossier.findFirst({
      where: { id: dossierId, cabinetId },
      select: { avocatResponsableId: true },
    });
    if (!dossier) {
      return NextResponse.json({ error: "Dossier introuvable" }, { status: 404 });
    }
    avocatResponsableId = dossier.avocatResponsableId;
  }

  if (!canValidateInvoice(role, avocatResponsableId, userId)) {
    return NextResponse.json(
      { error: "Votre rôle ne permet pas la création et l'envoi direct d'une facture." },
      { status: 403 }
    );
  }

  try {
    const { invoiceId } = await createDraftFromBillableItems({
      cabinetId,
      clientId,
      dossierId: dossierId ?? undefined,
      timeEntryIds,
      expenseIds: expenseIds ?? [],
      createdById: userId,
    });

    await issueInvoice({
      invoiceId,
      approvedById: userId,
      cabinetId,
    });

    return NextResponse.json({ invoiceId });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Erreur lors de la création et de l'envoi";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
