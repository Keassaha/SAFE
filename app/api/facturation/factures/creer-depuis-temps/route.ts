import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { canManageInvoices } from "@/lib/auth/permissions";
import { creerFactureDepuisTempsSchema } from "@/lib/validations/facturation";
import { createDraftFromBillableItems } from "@/lib/services/billing";
import type { UserRole } from "@prisma/client";

function getSessionData() {
  return getServerSession(authOptions).then((session) => {
    if (!session?.user) return null;
    const cabinetId = (session.user as { cabinetId?: string }).cabinetId;
    const role = (session.user as { role?: string }).role as UserRole;
    const userId = (session.user as { id?: string }).id;
    if (!cabinetId) return null;
    return { cabinetId, userId };
  });
}

export async function POST(request: Request) {
  const data = await getSessionData();
  if (!data) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  const { cabinetId, userId } = data;
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string })?.role as UserRole;
  if (!canManageInvoices(role)) {
    return NextResponse.json({ error: "Droits insuffisants" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Corps de requête invalide" },
      { status: 400 }
    );
  }
  const parsed = creerFactureDepuisTempsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Données invalides", details: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const { clientId, dossierId, timeEntryIds, expenseIds } = parsed.data;

  try {
    const { invoiceId } = await createDraftFromBillableItems({
      cabinetId,
      clientId,
      dossierId: dossierId ?? undefined,
      timeEntryIds,
      expenseIds: expenseIds ?? [],
      createdById: userId ?? undefined,
    });
    return NextResponse.json({ invoiceId });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur lors de la création du brouillon";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
