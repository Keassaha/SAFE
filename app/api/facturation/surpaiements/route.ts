import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canManageInvoices } from "@/lib/auth/permissions";
import { getClientCreditBalances } from "@/lib/services/billing/overpayment-service";
import { createAuditLog } from "@/lib/services/audit";
import type { UserRole } from "@prisma/client";

async function getSessionData() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  const cabinetId = (session.user as { cabinetId?: string }).cabinetId;
  const role = (session.user as { role?: string }).role as UserRole;
  const userId = (session.user as { id?: string }).id;
  if (!cabinetId) return null;
  return { cabinetId, role, userId };
}

/** GET /api/facturation/surpaiements — clients en surpaiement (solde créditeur). */
export async function GET() {
  const data = await getSessionData();
  if (!data) return new NextResponse("Unauthorized", { status: 401 });
  if (!canManageInvoices(data.role)) {
    return new NextResponse("Insufficient permissions", { status: 403 });
  }
  const clients = await getClientCreditBalances(data.cabinetId);
  return NextResponse.json({ clients });
}

/**
 * POST /api/facturation/surpaiements — enregistre l'INTENTION de rembourser un
 * surpaiement (le virement reste manuel, hors SAFE). Aucun mouvement d'argent.
 * Body : { clientId, note? }.
 */
export async function POST(request: Request) {
  const data = await getSessionData();
  if (!data) return new NextResponse("Unauthorized", { status: 401 });
  if (!canManageInvoices(data.role)) {
    return new NextResponse("Insufficient permissions", { status: 403 });
  }

  let body: { clientId?: unknown; note?: unknown };
  try {
    body = await request.json();
  } catch {
    return new NextResponse("Invalid body", { status: 400 });
  }
  const clientId = typeof body.clientId === "string" ? body.clientId : null;
  const note = typeof body.note === "string" ? body.note.trim().slice(0, 1000) : null;
  if (!clientId) return new NextResponse("clientId required", { status: 400 });

  const client = await prisma.client.findFirst({
    where: { id: clientId, cabinetId: data.cabinetId },
    select: { id: true },
  });
  if (!client) return new NextResponse("Client not found", { status: 404 });

  await createAuditLog({
    cabinetId: data.cabinetId,
    userId: data.userId,
    entityType: "Client",
    entityId: clientId,
    action: "refund_requested",
    metadata: { note: note ?? undefined, source: "surpaiement" },
  });

  return NextResponse.json({ ok: true });
}
