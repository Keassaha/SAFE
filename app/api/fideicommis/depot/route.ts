import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { canEditBillingTrust } from "@/lib/auth/permissions";
import type { UserRole } from "@prisma/client";
import { depotBodySchema } from "@/lib/validations/fideicommis";
import { createTrustDeposit } from "@/lib/services/fideicommis";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  const cabinetId = (session.user as { cabinetId?: string }).cabinetId;
  const userId = (session.user as { id?: string }).id;
  const role = (session.user as { role?: string }).role as UserRole;
  if (!cabinetId) {
    return NextResponse.json({ error: "Cabinet non trouvé" }, { status: 403 });
  }
  if (!canEditBillingTrust(role)) {
    return NextResponse.json({ error: "Droits insuffisants" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body JSON invalide" }, { status: 400 });
  }
  const parsed = depotBodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Données invalides", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const { transactionId } = await createTrustDeposit({
      cabinetId,
      clientId: parsed.data.clientId,
      dossierId: parsed.data.dossierId,
      montant: parsed.data.montant,
      dateTransaction: parsed.data.dateTransaction,
      modePaiement: parsed.data.modePaiement,
      reference: parsed.data.reference ?? null,
      description: parsed.data.description ?? null,
      createdById: userId ?? null,
    });
    return NextResponse.json({ success: true, transactionId });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur lors de l'enregistrement du dépôt";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
