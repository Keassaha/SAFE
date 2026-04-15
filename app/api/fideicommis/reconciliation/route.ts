import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { canEditBillingTrust } from "@/lib/auth/permissions";
import type { UserRole } from "@prisma/client";
import {
  createReconciliation,
  certifyReconciliation,
  getReconciliations,
  getReconciliationStatus,
} from "@/lib/services/fideicommis";

/** GET — List reconciliations + current status */
export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  const cabinetId = (session.user as { cabinetId?: string }).cabinetId;
  const role = (session.user as { role?: string }).role as UserRole;
  if (!cabinetId) {
    return NextResponse.json({ error: "Cabinet non trouvé" }, { status: 403 });
  }
  if (!canEditBillingTrust(role)) {
    return NextResponse.json({ error: "Droits insuffisants" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const statusOnly = searchParams.get("statusOnly") === "true";

  if (statusOnly) {
    const status = await getReconciliationStatus(cabinetId);
    return NextResponse.json(status);
  }

  const [reconciliations, status] = await Promise.all([
    getReconciliations(cabinetId),
    getReconciliationStatus(cabinetId),
  ]);

  return NextResponse.json({ reconciliations, status });
}

/** POST — Create/update reconciliation or certify */
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  const cabinetId = (session.user as { cabinetId?: string }).cabinetId;
  const userId = (session.user as { id?: string }).id;
  const role = (session.user as { role?: string }).role as UserRole;
  if (!cabinetId || !userId) {
    return NextResponse.json({ error: "Cabinet non trouvé" }, { status: 403 });
  }
  if (!canEditBillingTrust(role)) {
    return NextResponse.json({ error: "Droits insuffisants" }, { status: 403 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body JSON invalide" }, { status: 400 });
  }

  try {
    // Certify existing reconciliation
    if (body.action === "certify" && typeof body.reconciliationId === "string") {
      const result = await certifyReconciliation({
        reconciliationId: body.reconciliationId,
        cabinetId,
        certifiedById: userId,
      });
      return NextResponse.json({ success: true, reconciliation: result });
    }

    // Create/update reconciliation
    if (typeof body.periode !== "string" || typeof body.soldeBancaire !== "number") {
      return NextResponse.json(
        { error: "Fields 'periode' (string) and 'soldeBancaire' (number) are required" },
        { status: 400 }
      );
    }

    const result = await createReconciliation({
      cabinetId,
      periode: body.periode,
      soldeBancaire: body.soldeBancaire,
      chequesEnCirculation: typeof body.chequesEnCirculation === "number" ? body.chequesEnCirculation : 0,
      depotsEnTransit: typeof body.depotsEnTransit === "number" ? body.depotsEnTransit : 0,
      interetsLFO: typeof body.interetsLFO === "number" ? body.interetsLFO : 0,
      notes: typeof body.notes === "string" ? body.notes : null,
      createdById: userId,
    });

    return NextResponse.json({ success: true, reconciliation: result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error processing reconciliation";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
