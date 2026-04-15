import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import type { UserRole } from "@prisma/client";
import {
  runConflictCheck,
  resolveConflictCheck,
  getConflictChecks,
} from "@/lib/services/conflict-check-service";

/** GET — List conflict checks for a dossier */
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

  const checks = await getConflictChecks(dossierId);
  return NextResponse.json({ checks });
}

/** POST — Run a conflict check or resolve one */
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
    // Resolve an existing check
    if (body.action === "resolve" && typeof body.checkId === "string") {
      const result = await resolveConflictCheck({
        checkId: body.checkId,
        cabinetId,
        resolution: body.resolution as "confirmed_no_conflict" | "waived_by_client" | "declined",
        notes: typeof body.notes === "string" ? body.notes : undefined,
        resolvedById: userId,
      });
      return NextResponse.json(result);
    }

    // Run a new conflict check
    if (typeof body.dossierId !== "string" || typeof body.clientName !== "string" || typeof body.clientId !== "string") {
      return NextResponse.json(
        { error: "Fields 'dossierId', 'clientName', and 'clientId' are required" },
        { status: 400 }
      );
    }

    const result = await runConflictCheck({
      cabinetId,
      dossierId: body.dossierId,
      clientName: body.clientName,
      clientId: body.clientId,
      checkedById: userId,
    });
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error running conflict check";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
