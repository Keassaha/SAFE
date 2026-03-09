import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canManageInvoices } from "@/lib/auth/permissions";
import type { UserRole } from "@prisma/client";

function getSessionData() {
  return getServerSession(authOptions).then((session) => {
    if (!session?.user) return null;
    const cabinetId = (session.user as { cabinetId?: string }).cabinetId;
    const role = (session.user as { role?: string }).role as UserRole;
    if (!cabinetId) return null;
    return { cabinetId, role };
  });
}

/** Retourne les clients et factures émisses (pour formulaires paiement / allocation). */
export async function GET() {
  const data = await getSessionData();
  if (!data) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  const { cabinetId, role } = data;
  if (!canManageInvoices(role)) {
    return NextResponse.json({ error: "Droits insuffisants" }, { status: 403 });
  }

  const [clients, invoices] = await Promise.all([
    prisma.client.findMany({
      where: { cabinetId },
      select: { id: true, raisonSociale: true },
      orderBy: { raisonSociale: "asc" },
    }),
    prisma.invoice.findMany({
      where: {
        cabinetId,
        invoiceStatus: { in: ["ISSUED", "PARTIALLY_PAID", "OVERDUE"] },
      },
      select: {
        id: true,
        numero: true,
        clientId: true,
        balanceDue: true,
        totalInvoiceAmount: true,
        totalPaidAmount: true,
      },
      orderBy: { dateEmission: "desc" },
      take: 500,
    }),
  ]);

  return NextResponse.json({
    clients,
    invoices: invoices.map((inv) => ({
      id: inv.id,
      numero: inv.numero,
      clientId: inv.clientId,
      balanceDue: inv.balanceDue,
      totalInvoiceAmount: inv.totalInvoiceAmount,
      totalPaidAmount: inv.totalPaidAmount,
    })),
  });
}
