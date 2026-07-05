import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { canManageInvoices } from "@/lib/auth/permissions";
import { listPayerRules, createPayerRule } from "@/lib/services/finance/payer-rules";
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

export async function GET() {
  const data = await getSessionData();
  if (!data) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  if (!canManageInvoices(data.role)) {
    return NextResponse.json({ error: "Droits insuffisants" }, { status: 403 });
  }
  const rules = await listPayerRules(data.cabinetId);
  return NextResponse.json({ rules });
}

export async function POST(request: Request) {
  const data = await getSessionData();
  if (!data) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  if (!canManageInvoices(data.role)) {
    return NextResponse.json({ error: "Droits insuffisants" }, { status: 403 });
  }

  let body: {
    payerEmail?: string;
    payerName?: string;
    clientId?: string;
    scope?: string;
    note?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corps invalide" }, { status: 400 });
  }

  const scope = body.scope === "PAYEUR_CONNU" ? "PAYEUR_CONNU" : "CLIENT_UNIQUE";
  try {
    const rule = await createPayerRule({
      cabinetId: data.cabinetId,
      payerEmail: body.payerEmail ?? null,
      payerName: body.payerName ?? null,
      clientId: body.clientId ?? null,
      scope,
      note: body.note ?? null,
      source: "manuel",
      createdById: data.userId ?? undefined,
    });
    return NextResponse.json({ rule });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
