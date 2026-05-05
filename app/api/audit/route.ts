import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sanitizeObject } from "@/lib/utils/sanitize";
import { getClientIp, isRateLimited } from "@/lib/rate-limit";
import { sendEmail } from "@/lib/email";
import { auditCompleteEmailHtml } from "@/lib/email-templates/audit-complete";

/**
 * POST /api/audit — Recevoir une soumission d'audit (public)
 */
export async function POST(req: NextRequest) {
  const ip = getClientIp(req.headers);
  if (await isRateLimited(`audit-${ip}`, 5, 60_000)) {
    return NextResponse.json({ error: "Trop de tentatives." }, { status: 429 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body JSON invalide" }, { status: 400 });
  }

  const sanitized = sanitizeObject(body);

  const {
    type,
    source,
    prospectNom,
    prospectEmail,
    prospectTelephone,
    prospectCabinet,
    reponses,
    scoreGlobal,
    scores,
    rapport,
  } = sanitized as Record<string, string | number | undefined>;

  if (!prospectNom || !type) {
    return NextResponse.json(
      { error: "Le nom du prospect et le type d'audit sont requis." },
      { status: 400 }
    );
  }

  // Sauvegarder en base
  const submission = await prisma.auditSubmission.create({
    data: {
      type: (type as string) || "cabinet",
      source: (source as string) || "audit_gratuit",
      prospectNom: prospectNom as string,
      prospectEmail: (prospectEmail as string) || null,
      prospectTelephone: (prospectTelephone as string) || null,
      prospectCabinet: (prospectCabinet as string) || null,
      reponses: reponses ? (typeof reponses === "string" ? reponses : JSON.stringify(reponses)) : null,
      scoreGlobal: typeof scoreGlobal === "number" ? scoreGlobal : null,
      scores: scores ? (typeof scores === "string" ? scores : JSON.stringify(scores)) : null,
      rapport: rapport ? (typeof rapport === "string" ? rapport : JSON.stringify(rapport)) : null,
      status: "nouveau",
    },
  });

  // Envoyer l'email de félicitations
  if (prospectEmail && typeof prospectEmail === "string") {
    try {
      const score = typeof scoreGlobal === "number" ? scoreGlobal : 0;
      const nbAnomalies = extractAnomaliesCount(rapport);

      const html = auditCompleteEmailHtml(
        prospectNom as string,
        score,
        nbAnomalies
      );

      await sendEmail({
        to: prospectEmail,
        subject: "Votre audit de cabinet est pret — SAFE",
        html,
      });
    } catch (emailErr) {
      console.error("[audit] Email send failed:", emailErr);
      // Ne pas bloquer — l'audit est sauvegardé
    }
  }

  return NextResponse.json({
    success: true,
    id: submission.id,
    message: "Audit soumis avec succes.",
  });
}

/**
 * GET /api/audit — Liste des audits (authentifié par secret pour sync locale)
 */
export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret");
  const expectedSecret = process.env.AUDIT_SYNC_SECRET;

  if (!expectedSecret || secret !== expectedSecret) {
    return NextResponse.json({ error: "Non autorise" }, { status: 401 });
  }

  const since = req.nextUrl.searchParams.get("since");
  const where = since ? { createdAt: { gte: new Date(since) } } : {};

  const audits = await prisma.auditSubmission.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return NextResponse.json({ audits });
}

/** Extraire le nombre d'anomalies du rapport JSON */
function extractAnomaliesCount(rapport: unknown): number {
  try {
    const parsed = typeof rapport === "string" ? JSON.parse(rapport) : rapport;
    if (parsed?.anomalies && Array.isArray(parsed.anomalies)) {
      return parsed.anomalies.length;
    }
    if (parsed?.sections && Array.isArray(parsed.sections)) {
      return parsed.sections.reduce(
        (acc: number, s: { findings?: string[] }) => acc + (s.findings?.length || 0),
        0
      );
    }
  } catch {
    // ignore
  }
  return 0;
}
