import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canManageInvoices } from "@/lib/auth/permissions";
import { patchPaymentSchema } from "@/lib/validations/facturation";
import { updatePayment } from "@/lib/services/billing/payment-allocation-service";
import type { UserRole } from "@prisma/client";

function getSessionData() {
  return getServerSession(authOptions).then((session) => {
    if (!session?.user) return null;
    const cabinetId = (session.user as { cabinetId?: string }).cabinetId;
    const role = (session.user as { role?: string }).role as UserRole;
    const userId = (session.user as { id?: string }).id;
    if (!cabinetId) return null;
    return { cabinetId, role, userId };
  });
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const data = await getSessionData();
  if (!data) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  const { cabinetId, role } = data;
  if (!canManageInvoices(role)) {
    return NextResponse.json({ error: "Droits insuffisants" }, { status: 403 });
  }

  const { id } = await params;
  const payment = await prisma.payment.findFirst({
    where: { id, cabinetId },
    include: {
      client: { select: { id: true, raisonSociale: true } },
      invoice: { select: { id: true, numero: true } },
      paymentAllocations: { include: { invoice: { select: { id: true, numero: true } } } },
    },
  });
  if (!payment) {
    return NextResponse.json({ error: "Paiement introuvable" }, { status: 404 });
  }

  const allocatedAmount = payment.paymentAllocations.reduce(
    (s, a) => s + a.allocatedAmount,
    0
  );
  return NextResponse.json({
    ...payment,
    allocatedAmount,
    unallocatedAmount: payment.montant - allocatedAmount,
  });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const data = await getSessionData();
  if (!data) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  const { cabinetId, role, userId } = data;
  if (!canManageInvoices(role)) {
    return NextResponse.json({ error: "Droits insuffisants" }, { status: 403 });
  }

  const { id } = await params;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Corps de requête invalide" },
      { status: 400 }
    );
  }
  const parsed = patchPaymentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Données invalides", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const {
    paymentDate,
    amount,
    paymentMethod,
    referenceNumber,
    sourceAccountType,
    note,
  } = parsed.data;

  try {
    await updatePayment({
      paymentId: id,
      cabinetId,
      paymentDate: paymentDate != null ? new Date(paymentDate) : undefined,
      amount,
      paymentMethod,
      referenceNumber,
      sourceAccountType,
      note,
      performedById: userId ?? undefined,
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Erreur lors de la modification du paiement";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
