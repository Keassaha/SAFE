import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

/**
 * GET /api/facturation/debours-check?dossierId=xxx&dossierType=immobilier_achat
 * Returns expected disbursements for a dossier type, flagging which are missing.
 */
export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  const cabinetId = (session.user as { cabinetId?: string }).cabinetId;
  if (!cabinetId) {
    return NextResponse.json({ error: "Cabinet non trouvé" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const dossierId = searchParams.get("dossierId");
  const dossierType = searchParams.get("dossierType");

  if (!dossierId || !dossierType) {
    return NextResponse.json({ error: "dossierId and dossierType required" }, { status: 400 });
  }

  // Get templates for this dossier type
  const templates = await prisma.deboursTemplate.findMany({
    where: { cabinetId, dossierType },
    include: {
      deboursType: {
        select: {
          id: true,
          nom: true,
          categorie: true,
          coutDefaut: true,
          isGovernment: true,
          taxable: true,
        },
      },
    },
  });

  if (templates.length === 0) {
    return NextResponse.json({ missing: [], total: 0 });
  }

  // Get existing debours for this dossier
  const existingDebours = await prisma.deboursDossier.findMany({
    where: { dossierId, cabinetId },
    select: { deboursTypeId: true },
  });

  const existingTypeIds = new Set(existingDebours.map((d) => d.deboursTypeId).filter(Boolean));

  // Find missing
  const missing = templates
    .filter((t) => !existingTypeIds.has(t.deboursTypeId))
    .map((t) => ({
      id: t.deboursType.id,
      nom: t.deboursType.nom,
      categorie: t.deboursType.categorie,
      coutDefaut: t.deboursType.coutDefaut,
      isGovernment: t.deboursType.isGovernment,
      isRequired: t.isRequired,
      alreadyAdded: false,
    }));

  return NextResponse.json({
    missing,
    total: templates.length,
  });
}
