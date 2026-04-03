import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { canManageInvoices } from "@/lib/auth/permissions";
import type { UserRole } from "@prisma/client";

function getSessionData() {
  return getServerSession(authOptions).then((session) => {
    if (!session?.user) return null;
    const role = (session.user as { role?: string }).role as UserRole;
    if (!role) return null;
    return { role };
  });
}

/**
 * POST: envoi de facture par email — désactivé pour le moment.
 * La route reste en place pour ne pas casser l’UI ; retourne 503.
 */
export async function POST(
  _request: Request,
  _context: { params: Promise<{ id: string }> }
) {
  const data = await getSessionData();
  if (!data) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  if (!canManageInvoices(data.role)) {
    return NextResponse.json({ error: "Droits insuffisants" }, { status: 403 });
  }

  return NextResponse.json(
    { error: "L'envoi de facture par email est désactivé pour le moment." },
    { status: 503 }
  );
}
