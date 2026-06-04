import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { canCertifyComplianceReport } from "@/lib/auth/permissions";
import type { UserRole } from "@prisma/client";
import { certifyComplianceReport } from "@/lib/services/fideicommis";
import { sanitizeInput } from "@/lib/utils/sanitize";

/** POST — Certifie (signe) la déclaration de conformité d'un rapport fidéicommis. */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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
  if (!canCertifyComplianceReport(role)) {
    return NextResponse.json(
      { error: "Seul l'avocat responsable ou l'administrateur du cabinet peut certifier ce rapport." },
      { status: 403 }
    );
  }

  const { id } = await params;

  let declarationText: string | undefined;
  try {
    const body = (await request.json()) as { declarationText?: unknown };
    if (typeof body.declarationText === "string" && body.declarationText.trim()) {
      declarationText = sanitizeInput(body.declarationText);
    }
  } catch {
    // body optionnel
  }

  try {
    const result = await certifyComplianceReport({ cabinetId, reportId: id, certifiedById: userId, declarationText });
    return NextResponse.json({ success: true, id: result.id });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur lors de la certification";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
