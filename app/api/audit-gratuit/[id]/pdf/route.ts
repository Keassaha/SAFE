/**
 * SAFE — GET /api/audit-gratuit/[id]/pdf
 * Télécharge le rapport PDF d'une soumission d'audit.
 *
 * Génération : Playwright (headless Chromium) → route /audit/[id]/print
 * Remplace l'ancienne génération @react-pdf/renderer.
 *
 * Paramètres query :
 *   ?variant=cream|white  — variante visuelle (défaut : cream)
 *   ?download=1           — force le téléchargement (Content-Disposition attachment)
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { renderAuditPrintToPdf } from "@/lib/audit-report/pdf-playwright";
import { getClientIp, isRateLimited } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Génération PDF coûteuse (Playwright) : limiter le débit par IP pour éviter
  // un déni de service trivial sur une route publique.
  const ip = getClientIp(req.headers);
  if (await isRateLimited(`audit-pdf-${ip}`, 10, 60_000)) {
    return NextResponse.json(
      { error: "Trop de demandes. Réessayez dans une minute." },
      { status: 429 }
    );
  }

  const { id } = await params;
  if (!id || typeof id !== "string") {
    return NextResponse.json({ error: "ID requis." }, { status: 400 });
  }

  const submission = await prisma.auditSubmission.findUnique({ where: { id } });
  if (!submission) {
    return NextResponse.json({ error: "Audit introuvable." }, { status: 404 });
  }

  const rawVariant = req.nextUrl.searchParams.get("variant");
  const variant = rawVariant === "white" ? "white" : "cream";

  let pdfBuffer: Buffer;
  try {
    pdfBuffer = await renderAuditPrintToPdf(submission.id, { variant });
  } catch (e) {
    console.error("[pdf/route] renderAuditPrintToPdf failed:", e);
    return NextResponse.json(
      { error: "Génération du PDF échouée.", detail: String(e) },
      { status: 500 }
    );
  }

  const filename = `rapport-audit-safe-${submission.id.slice(0, 8)}.pdf`;
  const disposition =
    req.nextUrl.searchParams.get("download") === "1" ? "attachment" : "inline";

  return new NextResponse(new Uint8Array(pdfBuffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `${disposition}; filename="${filename}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
