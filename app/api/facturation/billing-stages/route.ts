import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  createBillingStages,
  markStageReady,
  getBillingStages,
} from "@/lib/services/billing-stage-service";

/** GET — List billing stages for a dossier */
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
  if (!dossierId) {
    return NextResponse.json({ error: "dossierId required" }, { status: 400 });
  }

  const stages = await getBillingStages(dossierId);
  return NextResponse.json({ stages });
}

/** POST — Create billing stages or mark stage ready */
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  const cabinetId = (session.user as { cabinetId?: string }).cabinetId;
  const userId = (session.user as { id?: string }).id;
  if (!cabinetId || !userId) {
    return NextResponse.json({ error: "Cabinet non trouvé" }, { status: 403 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body JSON invalide" }, { status: 400 });
  }

  try {
    if (body.action === "create") {
      const stages = await createBillingStages({
        dossierId: body.dossierId as string,
        cabinetId,
        totalForfait: body.totalForfait as number,
        stages: body.stages as { nom: string; pourcentage: number }[],
        userId,
      });
      return NextResponse.json({ success: true, stages });
    }

    if (body.action === "mark_ready") {
      await markStageReady({
        stageId: body.stageId as string,
        dossierId: body.dossierId as string,
        cabinetId,
        userId,
      });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error processing billing stages";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
