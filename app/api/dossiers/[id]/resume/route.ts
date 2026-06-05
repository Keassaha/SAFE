import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { canViewDossiers } from "@/lib/auth/permissions";
import type { UserRole } from "@prisma/client";
import { generateDossierSummary, saveDossierSummary } from "@/lib/services/dossier-summary";

/** POST — Génère un résumé IA du dossier (lecture seule). `?save=true` l'enregistre dans le dossier. */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
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
  if (!canViewDossiers(role)) {
    return NextResponse.json({ error: "Droits insuffisants" }, { status: 403 });
  }

  const { id } = await params;
  const save = new URL(request.url).searchParams.get("save") === "true";

  // L'enregistrement modifie le dossier : réservé aux rôles qui le gèrent.
  if (save && !["admin_cabinet", "avocat", "assistante"].includes(role)) {
    return NextResponse.json(
      { error: "Droits insuffisants pour enregistrer le résumé dans le dossier." },
      { status: 403 }
    );
  }

  let summary;
  try {
    summary = await generateDossierSummary({ dossierId: id, cabinetId });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur lors de la génération du résumé";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  if (!summary) {
    return NextResponse.json(
      { error: "Résumé indisponible (dossier introuvable ou service IA non configuré)." },
      { status: 502 }
    );
  }

  if (save && summary.resumeTexte.trim()) {
    await saveDossierSummary({ dossierId: id, cabinetId, resumeTexte: summary.resumeTexte });
  }

  return NextResponse.json({ summary, saved: save && !!summary.resumeTexte.trim() });
}
