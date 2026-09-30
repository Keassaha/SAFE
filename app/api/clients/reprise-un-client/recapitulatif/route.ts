import { NextResponse } from "next/server";
import { accesRepriseUnClient } from "@/lib/services/reprise-un-client/acces";
import { chargerRecapitulatif } from "@/lib/services/reprise-un-client/recapitulatif";

export const dynamic = "force-dynamic";

/** Ce qui est maintenant dans SAFE pour ce mandat, lu en base. */
export async function GET(request: Request) {
  const acces = await accesRepriseUnClient();
  if (acces instanceof NextResponse) return acces;
  const dossierId = new URL(request.url).searchParams.get("dossierId");
  if (!dossierId) return NextResponse.json({ error: "Mandat manquant" }, { status: 400 });
  const recap = await chargerRecapitulatif(acces.cabinetId, dossierId);
  if (!recap) return NextResponse.json({ error: "Mandat introuvable" }, { status: 404 });
  return NextResponse.json(recap);
}
