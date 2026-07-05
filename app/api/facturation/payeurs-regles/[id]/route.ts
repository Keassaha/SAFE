import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { canManageInvoices } from "@/lib/auth/permissions";
import { setPayerRuleActive, deletePayerRule } from "@/lib/services/finance/payer-rules";
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

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const data = await getSessionData();
  if (!data) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  if (!canManageInvoices(data.role)) {
    return NextResponse.json({ error: "Droits insuffisants" }, { status: 403 });
  }
  const { id } = await params;
  let body: { active?: boolean };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corps invalide" }, { status: 400 });
  }
  try {
    const rule = await setPayerRuleActive(data.cabinetId, id, Boolean(body.active));
    return NextResponse.json({ rule });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const data = await getSessionData();
  if (!data) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  if (!canManageInvoices(data.role)) {
    return NextResponse.json({ error: "Droits insuffisants" }, { status: 403 });
  }
  const { id } = await params;
  try {
    await deletePayerRule(data.cabinetId, id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
