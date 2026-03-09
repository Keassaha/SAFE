import { NextResponse } from "next/server";
import { canManageInvoices } from "@/lib/auth/permissions";
import { paymentAllocationsSchema } from "@/lib/validations/facturation";
import { allocateToInvoices } from "@/lib/services/billing/payment-allocation-service";
import { prisma } from "@/lib/db";
import { requireCabinetAndUser } from "@/lib/auth/session";
import type { UserRole } from "@prisma/client";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  let sessionData: { cabinetId: string; userId: string; role: string };
  try {
    sessionData = await requireCabinetAndUser();
  } catch {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  const { cabinetId, userId, role } = sessionData;
  if (!canManageInvoices(role as UserRole)) {
    return NextResponse.json({ error: "Droits insuffisants" }, { status: 403 });
  }

  const { id: paymentId } = await params;

  const payment = await prisma.payment.findFirst({
    where: { id: paymentId, cabinetId },
  });
  if (!payment) {
    return NextResponse.json({ error: "Paiement introuvable" }, { status: 404 });
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
  const parsed = paymentAllocationsSchema.safeParse({ ...(body as object), paymentId });
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Données invalides", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    await allocateToInvoices({
      paymentId,
      allocations: parsed.data.allocations,
      performedById: userId ?? undefined,
      cabinetId,
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Erreur lors de l'allocation du paiement";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
