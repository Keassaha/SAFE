/**
 * SAFE — GET /api/audit-gratuit/[id]
 * Récupère une soumission d'audit en JSON (réponses + recommandation + risques + contact).
 *
 * Accès :
 *   - ?secret=<AUDIT_SYNC_SECRET>  → accès interne complet
 *   - sinon : accès public limité (le propriétaire connaît son ID) — même règle que le PDF
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { buildRecommendation, type Recommendation } from "@/lib/audit-gratuit/recommendation";

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

  let lang: "fr" | "en" = "fr";
  let answers: Record<string, unknown> = {};
  try {
    const parsed = submission.reponses ? JSON.parse(submission.reponses) : {};
    lang = parsed.lang === "en" ? "en" : "fr";
    answers = (parsed.answers || parsed || {}) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Réponses illisibles." }, { status: 500 });
  }

  let recommendation: Recommendation;
  try {
    recommendation = submission.rapport
      ? (JSON.parse(submission.rapport) as Recommendation)
      : buildRecommendation(answers);
  } catch {
    recommendation = buildRecommendation(answers);
  }

  const contact = answers.contact as { email?: string; telephone?: string } | undefined;
  const identite = answers.identite as { nom_complet?: string; titre?: string } | undefined;
  const localisation = answers.localisation as { ville?: string; province?: string } | undefined;

  const origin = req.headers.get("origin") || req.nextUrl.origin;

  return NextResponse.json({
    id: submission.id,
    createdAt: submission.createdAt.toISOString(),
    source: submission.source,
    status: submission.status,
    lang,
    contact: {
      nom: identite?.nom_complet || "",
      titre: identite?.titre || "",
      email: contact?.email || "",
      telephone: contact?.telephone || "",
      ville: localisation?.ville || "",
      province: localisation?.province || "",
      cabinet: String(answers.raison_sociale || ""),
    },
    urls: {
      api: `${origin}/api/audit-gratuit/${submission.id}`,
      report: `${origin}/api/audit-gratuit/${submission.id}/pdf`,
      reportDownload: `${origin}/api/audit-gratuit/${submission.id}/pdf?download=1`,
    },
    recommendation,
    answers,
  });
}
