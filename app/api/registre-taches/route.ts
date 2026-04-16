import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getRegistreTaches, ajouterTache, updateTache, deleteTache } from "@/lib/services/forfait-billing-service";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const cabinetId = (session.user as { cabinetId?: string }).cabinetId;
  if (!cabinetId) return NextResponse.json({ error: "Cabinet non trouvé" }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const taches = await getRegistreTaches({
    cabinetId,
    dossierId: searchParams.get("dossierId") ?? undefined,
    statut: searchParams.get("statut") ?? undefined,
    clientId: searchParams.get("clientId") ?? undefined,
  });
  return NextResponse.json({ taches });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const cabinetId = (session.user as { cabinetId?: string }).cabinetId;
  const userId = (session.user as { id?: string }).id;
  if (!cabinetId || !userId) return NextResponse.json({ error: "Cabinet non trouvé" }, { status: 403 });

  let body: Record<string, unknown>;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "JSON invalide" }, { status: 400 }); }

  // Update
  if (body.action === "update" && typeof body.id === "string") {
    try {
      const updated = await updateTache({
        id: body.id, cabinetId,
        data: {
          description: body.description as string | undefined,
          ajustement: body.ajustement as number | undefined,
          rabais: body.rabais as number | undefined,
          rabaisRaison: body.rabaisRaison as string | undefined,
          montantBase: body.montantBase as number | undefined,
          statut: body.statut as string | undefined,
        },
        userId,
      });
      return NextResponse.json({ success: true, tache: updated });
    } catch (err) {
      return NextResponse.json({ error: err instanceof Error ? err.message : "Error" }, { status: 400 });
    }
  }

  // Delete
  if (body.action === "delete" && typeof body.id === "string") {
    try {
      await deleteTache(body.id, cabinetId);
      return NextResponse.json({ success: true });
    } catch (err) {
      return NextResponse.json({ error: err instanceof Error ? err.message : "Error" }, { status: 400 });
    }
  }

  // Create
  if (typeof body.dossierId !== "string") {
    return NextResponse.json({ error: "dossierId required" }, { status: 400 });
  }

  try {
    const tache = await ajouterTache({
      cabinetId, dossierId: body.dossierId,
      clientId: body.clientId as string | undefined,
      forfaitServiceId: body.forfaitServiceId as string | undefined,
      description: body.description as string | undefined,
      montantOverride: body.montant as number | undefined,
      ajustement: body.ajustement as number | undefined,
      rabais: body.rabais as number | undefined,
      rabaisRaison: body.rabaisRaison as string | undefined,
      taxable: body.taxable as boolean | undefined,
      date: body.date ? new Date(body.date as string) : undefined,
      userId,
    });
    return NextResponse.json({ success: true, tache });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Error" }, { status: 400 });
  }
}
