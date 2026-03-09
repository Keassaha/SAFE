import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { canViewBillingTrust } from "@/lib/auth/permissions";
import type { UserRole } from "@prisma/client";
import { getTrustBalance } from "@/lib/services/fideicommis";
import { soldeQuerySchema } from "@/lib/validations/fideicommis";
import { prisma } from "@/lib/db";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  const cabinetId = (session.user as { cabinetId?: string }).cabinetId;
  const role = (session.user as { role?: string }).role as UserRole;
  if (!cabinetId) {
    return NextResponse.json({ error: "Cabinet non trouvé" }, { status: 403 });
  }
  if (!canViewBillingTrust(role)) {
    return NextResponse.json({ error: "Droits insuffisants" }, { status: 403 });
  }

  const { clientId } = await params;
  const { searchParams } = new URL(request.url);
  const parsed = soldeQuerySchema.safeParse({
    dossierId: searchParams.get("dossierId") ?? undefined,
  });
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Paramètres invalides", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const client = await prisma.client.findFirst({
    where: { id: clientId, cabinetId },
  });
  if (!client) {
    return NextResponse.json({ error: "Client introuvable" }, { status: 404 });
  }

  const solde = await getTrustBalance({
    cabinetId,
    clientId,
    dossierId: parsed.data.dossierId ?? null,
  });

  return NextResponse.json({
    clientId,
    dossierId: parsed.data.dossierId ?? null,
    solde,
  });
}
