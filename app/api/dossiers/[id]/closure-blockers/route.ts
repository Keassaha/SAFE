import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canViewDossiers } from "@/lib/auth/permissions";
import { getDossierClosureBlockers } from "@/lib/services/dossiers/closure-blockers";
import type { UserRole } from "@prisma/client";

/**
 * GET /api/dossiers/[id]/closure-blockers
 *
 * Retourne l'état de fermeture d'un dossier (statut, dates) et les éléments
 * à régler avant fermeture (factures impayées, débours, solde fidéicommis).
 * Consommé par l'onglet « Fermeture » de la fiche dossier.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });
  const cabinetId = (session.user as { cabinetId?: string }).cabinetId;
  const role = (session.user as { role?: string }).role as UserRole;
  if (!cabinetId) return new NextResponse("Cabinet not found", { status: 403 });
  if (!canViewDossiers(role)) {
    return new NextResponse("Insufficient permissions", { status: 403 });
  }

  const { id } = await params;
  const dossier = await prisma.dossier.findFirst({
    where: { id, cabinetId },
    select: {
      id: true,
      clientId: true,
      statut: true,
      dateCloture: true,
      retentionJusqua: true,
      closure: { select: { closedAt: true, destructionDate: true } },
    },
  });
  if (!dossier) return new NextResponse("Dossier not found", { status: 404 });

  const blockers = await getDossierClosureBlockers({
    cabinetId,
    dossierId: id,
    clientId: dossier.clientId,
  });

  return NextResponse.json({
    statut: dossier.statut,
    dateCloture: dossier.dateCloture,
    retentionJusqua: dossier.retentionJusqua,
    closedAt: dossier.closure?.closedAt ?? null,
    blockers,
  });
}
