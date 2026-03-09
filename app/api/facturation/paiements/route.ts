import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canManageInvoices } from "@/lib/auth/permissions";
import { createPaymentSchema } from "@/lib/validations/facturation";
import { createPayment } from "@/lib/services/billing/payment-allocation-service";
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

export async function GET(request: Request) {
  const data = await getSessionData();
  if (!data) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  const { cabinetId, role } = data;
  if (!canManageInvoices(role)) {
    return NextResponse.json({ error: "Droits insuffisants" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const clientId = searchParams.get("clientId") ?? undefined;
  const invoiceId = searchParams.get("invoiceId") ?? undefined;
  const limit = Math.min(Number(searchParams.get("limit")) || 50, 200);

  const payments = await prisma.payment.findMany({
    where: {
      cabinetId,
      ...(clientId ? { clientId } : {}),
      ...(invoiceId ? { OR: [{ invoiceId }, { paymentAllocations: { some: { invoiceId } } }] } : {}),
    },
    orderBy: { datePaiement: "desc" },
    take: limit,
    include: {
      client: { select: { id: true, raisonSociale: true } },
      invoice: { select: { id: true, numero: true } },
      paymentAllocations: true,
    },
  });

  const withAllocated = payments.map((p) => {
    const allocated = p.paymentAllocations.reduce((s, a) => s + a.allocatedAmount, 0);
    return {
      ...p,
      allocatedAmount: allocated,
      unallocatedAmount: p.montant - allocated,
    };
  });

  return NextResponse.json({ payments: withAllocated });
}

export async function POST(request: Request) {
  const data = await getSessionData();
  if (!data) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  const { cabinetId, role, userId } = data;
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
  const parsed = createPaymentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Données invalides", details: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const {
    clientId,
    paymentDate,
    amount,
    paymentMethod,
    referenceNumber,
    sourceAccountType,
    note,
    invoiceId,
    allocatedAmount,
  } = parsed.data;

  try {
    const { paymentId } = await createPayment({
      cabinetId,
      clientId,
      paymentDate: new Date(paymentDate),
      amount,
      paymentMethod,
      referenceNumber,
      sourceAccountType,
      note,
      receivedById: userId ?? undefined,
      invoiceId: invoiceId ?? undefined,
      allocatedAmount,
    });
    return NextResponse.json({ paymentId });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur lors de la création du paiement";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
