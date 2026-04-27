/**
 * SAFE — GET /api/audit-gratuit/[id]/pdf
 * Télécharge le rapport PDF d'une soumission d'audit.
 *
 * Accès :
 *   - ?secret=<AUDIT_SYNC_SECRET>  → accès interne (lister + télécharger)
 *   - sinon : accès public avec l'ID (lien envoyé dans l'email au client)
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { renderAuditReportPdf } from "@/lib/audit-gratuit/pdf";
import type { Recommendation } from "@/lib/audit-gratuit/recommendation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id || typeof id !== "string") {
    return NextResponse.json({ error: "ID requis." }, { status: 400 });
  }

  const submission = await prisma.auditSubmission.findUnique({ where: { id } });
  if (!submission) {
    return NextResponse.json({ error: "Audit introuvable." }, { status: 404 });
  }
  if (submission.source !== "audit_gratuit_v2") {
    return NextResponse.json({ error: "Mauvaise source d'audit." }, { status: 400 });
  }

  let answers: Record<string, unknown> = {};
  let recommendation: Recommendation | null = null;

  try {
    const parsedRep = submission.reponses ? JSON.parse(submission.reponses) : {};
    answers = (parsedRep.answers || parsedRep || {}) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Réponses illisibles." }, { status: 500 });
  }

  try {
    recommendation = submission.rapport
      ? (JSON.parse(submission.rapport) as Recommendation)
      : null;
  } catch {
    recommendation = null;
  }

  if (!recommendation) {
    // Recalcul si le rapport stocké est corrompu
    const { buildRecommendation } = await import("@/lib/audit-gratuit/recommendation");
    recommendation = buildRecommendation(answers);
  }

  const pdfBuffer = await renderAuditReportPdf({
    answers,
    recommendation,
    submissionId: submission.id,
    createdAt: submission.createdAt,
  });

  const filename = `rapport-audit-safe-${submission.id.slice(0, 8)}.pdf`;
  const disposition = req.nextUrl.searchParams.get("download") === "1" ? "attachment" : "inline";

  return new NextResponse(new Uint8Array(pdfBuffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `${disposition}; filename="${filename}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
