import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  getImmigrationSummary,
  updateIrccStatut,
  setItaDate,
  saveBackgroundDeclaration,
  upsertImmigrationDocument,
} from "@/lib/services/immigration-service";

/** GET — Immigration dossier summary */
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

  const summary = await getImmigrationSummary(dossierId);
  return NextResponse.json(summary);
}

/** POST — Update immigration workflow, background, or documents */
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

  const dossierId = body.dossierId as string;
  if (!dossierId) {
    return NextResponse.json({ error: "dossierId required" }, { status: 400 });
  }

  try {
    switch (body.action) {
      case "update_statut": {
        await updateIrccStatut({
          dossierId,
          cabinetId,
          irccStatut: body.irccStatut as string,
          userId,
        });
        return NextResponse.json({ success: true });
      }

      case "set_ita_date": {
        await setItaDate({
          dossierId,
          cabinetId,
          itaDate: new Date(body.itaDate as string),
          userId,
        });
        return NextResponse.json({ success: true });
      }

      case "save_background": {
        const bg = body.background as Record<string, unknown>;
        const result = await saveBackgroundDeclaration({
          dossierId,
          data: {
            priorRefusal: bg.priorRefusal === true,
            priorRefusalDetails: (bg.priorRefusalDetails as string) || undefined,
            overstay: bg.overstay === true,
            overstayDetails: (bg.overstayDetails as string) || undefined,
            criminalRecord: bg.criminalRecord === true,
            criminalDetails: (bg.criminalDetails as string) || undefined,
            deportation: bg.deportation === true,
            deportationDetails: (bg.deportationDetails as string) || undefined,
            misrepresentation: bg.misrepresentation === true,
            misrepresentationDetails: (bg.misrepresentationDetails as string) || undefined,
            clientSignedAt: bg.clientSignedAt ? new Date(bg.clientSignedAt as string) : undefined,
          },
          userId,
          cabinetId,
        });
        return NextResponse.json({ success: true, background: result });
      }

      case "upsert_document": {
        const doc = await upsertImmigrationDocument({
          id: (body.documentId as string) || undefined,
          dossierId,
          type: body.docType as string,
          label: (body.label as string) || undefined,
          issuedAt: new Date(body.issuedAt as string),
          cabinetId,
          userId,
        });
        return NextResponse.json({ success: true, document: doc });
      }

      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error processing immigration data";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
