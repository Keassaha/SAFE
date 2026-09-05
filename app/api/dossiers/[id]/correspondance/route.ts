import { NextRequest, NextResponse } from "next/server";
import { requireCabinetAndUser } from "@/lib/auth/session";
import { refusSiRoleInsuffisant } from "@/lib/auth/api-guard";
import { canViewDossiers } from "@/lib/auth/permissions";
import { prisma } from "@/lib/db";
import { chargerChronologie } from "@/lib/services/correspondance/charger";

/**
 * Chronologie de correspondance d'un dossier (lot 0).
 *
 * Lecture seule. Réunit les trois journaux d'envoi existants ; n'écrit rien,
 * ne crée rien. Voir docs/product/SPEC_SAFE_CORRESPONDANCE_ASSISTEE.md §22.
 *
 * Le dossier est cherché AVANT toute lecture de journal, et borné au cabinet
 * de la session : `DossierCorrespondence` ne porte pas de `cabinetId`, donc
 * cette vérification est le seul cloisonnement de cette source.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await requireCabinetAndUser();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const refus = refusSiRoleInsuffisant(session.role, canViewDossiers);
  if (refus) return refus;

  const { id } = await params;
  const dossier = await prisma.dossier.findFirst({
    where: { id, cabinetId: session.cabinetId },
    select: { id: true },
  });
  if (!dossier) return NextResponse.json({ error: "Dossier introuvable" }, { status: 404 });

  const { entrees, tronquee } = await chargerChronologie(session.cabinetId, id);
  return NextResponse.json({ entrees, tronquee });
}
