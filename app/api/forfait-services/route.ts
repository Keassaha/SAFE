import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getForfaitServices, createForfaitService, updateForfaitService } from "@/lib/services/forfait-billing-service";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const cabinetId = (session.user as { cabinetId?: string }).cabinetId;
  if (!cabinetId) return NextResponse.json({ error: "Cabinet non trouvé" }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const categorie = searchParams.get("categorie") ?? undefined;
  const services = await getForfaitServices(cabinetId, categorie);
  return NextResponse.json({ services });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const cabinetId = (session.user as { cabinetId?: string }).cabinetId;
  const userId = (session.user as { id?: string }).id;
  if (!cabinetId || !userId) return NextResponse.json({ error: "Cabinet non trouvé" }, { status: 403 });

  let body: Record<string, unknown>;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "JSON invalide" }, { status: 400 }); }

  // Update existing service
  if (body.action === "update" && typeof body.id === "string") {
    try {
      await updateForfaitService({
        id: body.id,
        cabinetId,
        data: {
          nom: body.nom as string | undefined,
          montant: body.montant as number | undefined,
          description: body.description as string | undefined,
          taxable: body.taxable as boolean | undefined,
          actif: body.actif as boolean | undefined,
        },
        userId,
      });
      return NextResponse.json({ success: true });
    } catch (err) {
      return NextResponse.json({ error: err instanceof Error ? err.message : "Error" }, { status: 400 });
    }
  }

  // Create new service
  if (typeof body.code !== "string" || typeof body.nom !== "string" || typeof body.montant !== "number") {
    return NextResponse.json({ error: "code, nom, montant required" }, { status: 400 });
  }

  try {
    const service = await createForfaitService({
      cabinetId,
      code: body.code,
      nom: body.nom,
      description: body.description as string | undefined,
      montant: body.montant,
      categorie: body.categorie as string | undefined,
      sousType: body.sousType as string | undefined,
      taxable: body.taxable as boolean | undefined,
      userId,
    });
    return NextResponse.json({ success: true, service });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Error" }, { status: 400 });
  }
}
