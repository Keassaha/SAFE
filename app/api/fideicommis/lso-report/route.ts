import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { canEditBillingTrust } from "@/lib/auth/permissions";
import type { UserRole } from "@prisma/client";
import {
  createComplianceReport,
  getComplianceReports,
  generateReportData,
} from "@/lib/services/fideicommis";

/** GET — List compliance reports or generate data preview */
export async function GET(request: Request) {
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

  const { searchParams } = new URL(request.url);
  const preview = searchParams.get("preview");
  const periode = searchParams.get("periode");

  // Preview report data without saving
  if (preview === "true" && periode) {
    const type = (searchParams.get("type") as "monthly" | "quarterly" | "annual") || "monthly";
    const data = await generateReportData({
      cabinetId,
      periode,
      type,
      generatedById: userId,
    });
    return NextResponse.json(data);
  }

  // List all saved reports
  const reports = await getComplianceReports(cabinetId);
  return NextResponse.json({ reports });
}

/** POST — Generate and save a compliance report */
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

  if (typeof body.periode !== "string") {
    return NextResponse.json({ error: "Field 'periode' (string) is required" }, { status: 400 });
  }

  try {
    const result = await createComplianceReport({
      cabinetId,
      periode: body.periode,
      type: (body.type as "monthly" | "quarterly" | "annual") || "monthly",
      generatedById: userId,
    });
    return NextResponse.json({ success: true, report: result.report, data: result.data });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error generating report";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
