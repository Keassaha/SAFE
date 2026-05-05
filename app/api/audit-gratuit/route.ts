/**
 * SAFE — API de l'audit gratuit v2
 *
 * POST /api/audit-gratuit
 *   Body : { lang: "fr" | "en", answers: Record<string, unknown> }
 *   → Sauvegarde la soumission, calcule la recommandation,
 *     génère le PDF, envoie l'email client + interne,
 *     renvoie { id, recommendation }.
 *
 * GET /api/audit-gratuit?secret=...&since=...
 *   → Liste des soumissions (sync admin).
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sanitizeObject } from "@/lib/utils/sanitize";
import { getClientIp, isRateLimited } from "@/lib/rate-limit";
import { sendEmail } from "@/lib/email";
import { buildRecommendation } from "@/lib/audit-gratuit/recommendation";
import { renderAuditReportPdf } from "@/lib/audit-gratuit/pdf";
import { auditGratuitClientEmail } from "@/lib/email-templates/audit-gratuit-client";
import { runConfigurationEngine } from "@/lib/configuration";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getContact(answers: Record<string, unknown>) {
  const contact = answers.contact as { email?: string; telephone?: string } | undefined;
  const identite = answers.identite as { nom_complet?: string; titre?: string } | undefined;
  const localisation = answers.localisation as { ville?: string; province?: string } | undefined;
  return {
    email: contact?.email || "",
    telephone: contact?.telephone || "",
    nom: identite?.nom_complet || "",
    titre: identite?.titre || "",
    ville: localisation?.ville || "",
    province: localisation?.province || "",
    cabinet: String(answers.raison_sociale || ""),
  };
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req.headers);
  if (await isRateLimited(`audit-v2-${ip}`, 5, 60_000)) {
    return NextResponse.json({ error: "Trop de tentatives." }, { status: 429 });
  }

  let body: { lang?: "fr" | "en"; answers?: Record<string, unknown> };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body JSON invalide." }, { status: 400 });
  }

  const answers = (sanitizeObject(body.answers || {}) as Record<string, unknown>) || {};
  const lang = body.lang === "en" ? "en" : "fr";
  const contact = getContact(answers);

  if (!contact.nom || !contact.email) {
    return NextResponse.json(
      { error: "Le nom et le courriel du prospect sont requis." },
      { status: 400 }
    );
  }

  // Calcul de la recommandation existante (offre, devis, ROI, risques)
  const recommendation = buildRecommendation(answers);

  // Moteur de recommandation de bundle (audit -> bundle -> configuration).
  // Non bloquant: si l'engine échoue, on continue avec la recommandation classique.
  let configEngineOutput: ReturnType<typeof runConfigurationEngine> | null = null;
  try {
    configEngineOutput = runConfigurationEngine(answers, { source: "audit_gratuit_v2" });
  } catch (e) {
    console.error("[audit-gratuit] configuration engine failed:", e);
  }

  // Sauvegarde
  const submission = await prisma.auditSubmission.create({
    data: {
      type: "cabinet",
      source: "audit_gratuit_v2",
      prospectNom: contact.nom,
      prospectEmail: contact.email,
      prospectTelephone: contact.telephone || null,
      prospectCabinet: contact.cabinet || null,
      reponses: JSON.stringify({ lang, answers }),
      scoreGlobal: recommendation.roi.annualValue, // stocké : valeur $ récupérable (proxy)
      scores: JSON.stringify({
        hoursPerWeek: recommendation.roi.hoursPerWeek,
        paybackWeeks: recommendation.roi.paybackWeeks,
        savingsPercent: recommendation.safeOffer.savings.percent,
        urgency: recommendation.urgencyLevel,
        recommendedBundleId: configEngineOutput?.bundleRecommendation.bundleId,
        bundleConfidence: configEngineOutput?.bundleRecommendation.confidence,
      }),
      rapport: JSON.stringify({
        ...recommendation,
        configurationEngine: configEngineOutput
          ? {
              bundleRecommendation: configEngineOutput.bundleRecommendation,
              auditProfiles: configEngineOutput.auditSnapshot.profiles,
            }
          : null,
      }),
      configSafe: configEngineOutput
        ? JSON.stringify(configEngineOutput.configurationPackage)
        : null,
      status: "nouveau",
    },
  });

  // Génération du PDF
  let pdfBuffer: Buffer | null = null;
  try {
    pdfBuffer = await renderAuditReportPdf({
      answers,
      recommendation,
      submissionId: submission.id,
      createdAt: submission.createdAt,
    });
  } catch (e) {
    console.error("[audit-gratuit] PDF generation failed:", e);
  }

  // URL publique du PDF (signé par ID)
  const origin = req.headers.get("origin") || req.nextUrl.origin;
  const reportUrl = `${origin}/api/audit-gratuit/${submission.id}/pdf`;
  const apiUrl    = `${origin}/api/audit-gratuit/${submission.id}`;

  // Payload canonique envoyé aux systèmes externes (webhook + réponse API)
  const payload = {
    event: "audit_gratuit.completed" as const,
    id: submission.id,
    createdAt: submission.createdAt.toISOString(),
    source: "audit_gratuit_v2",
    lang,
    contact,
    urls: { report: reportUrl, api: apiUrl },
    recommendation,
    answers,
  };

  // Webhook sortant (fire-and-forget) — le dev reçoit la soumission en temps réel
  const webhookUrl = process.env.AUDIT_WEBHOOK_URL;
  if (webhookUrl) {
    const secret = process.env.AUDIT_WEBHOOK_SECRET || "";
    fetch(webhookUrl, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-safe-event": "audit_gratuit.completed",
        ...(secret ? { "x-safe-signature": secret } : {}),
      },
      body: JSON.stringify(payload),
    }).catch((e) => console.error("[audit-gratuit] webhook failed:", e));
  }

  // Email client
  try {
    const html = auditGratuitClientEmail({
      prospectName: contact.nom.split(" ")[0] || contact.nom,
      annualValue: recommendation.roi.annualValue,
      savingsPercent: recommendation.safeOffer.savings.percent,
      offerName: recommendation.safeOffer.name,
      monthlyPrice: recommendation.safeOffer.monthly,
      reportId: submission.id,
      reportUrl,
    });

    await sendEmail({
      to: contact.email,
      subject: `Votre rapport d'audit SAFE — ${contact.cabinet || "votre cabinet"}`,
      html,
      attachments: pdfBuffer
        ? [
            {
              filename: `rapport-audit-safe-${submission.id.slice(0, 8)}.pdf`,
              content: pdfBuffer,
            },
          ]
        : undefined,
    });
  } catch (e) {
    console.error("[audit-gratuit] Client email failed:", e);
  }

  // Notification interne
  try {
    const adminTo = process.env.AUDIT_ADMIN_EMAIL || "jeremie@safecabinet.ca";
    await sendEmail({
      to: adminTo,
      subject: `[SAFE · Audit] ${contact.cabinet || contact.nom} — ${recommendation.safeOffer.name}`,
      html: `
        <div style="font-family:Helvetica,Arial,sans-serif;color:#111;">
          <h2 style="margin:0 0 12px 0;">Nouvel audit reçu</h2>
          <p><strong>${contact.nom}</strong>${contact.titre ? `, ${contact.titre}` : ""}<br/>
          ${contact.cabinet || ""} — ${contact.ville}${contact.province ? `, ${contact.province}` : ""}<br/>
          ${contact.email} · ${contact.telephone || "—"}</p>
          <p><strong>Recommandation :</strong> ${recommendation.safeOffer.name} —
          ${recommendation.safeOffer.monthly.toLocaleString("fr-CA")} $ / mois.<br/>
          <strong>ROI estimé :</strong> ${recommendation.roi.annualValue.toLocaleString("fr-CA")} $ / an,
          ${recommendation.roi.hoursPerWeek} h / semaine.<br/>
          <strong>Urgence :</strong> ${recommendation.urgencyLevel}.</p>
          <p><strong>Référence :</strong> ${submission.id}<br/>
          <strong>PDF :</strong> <a href="${reportUrl}">${reportUrl}</a></p>
        </div>
      `,
      attachments: pdfBuffer
        ? [
            {
              filename: `rapport-audit-${submission.id.slice(0, 8)}.pdf`,
              content: pdfBuffer,
            },
          ]
        : undefined,
    });
  } catch (e) {
    console.error("[audit-gratuit] Admin email failed:", e);
  }

  return NextResponse.json({
    success: true,
    id: submission.id,
    createdAt: submission.createdAt.toISOString(),
    contact,
    urls: { report: reportUrl, api: apiUrl },
    recommendation,
  });
}

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret");
  const expectedSecret = process.env.AUDIT_SYNC_SECRET;

  if (!expectedSecret || secret !== expectedSecret) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const since = req.nextUrl.searchParams.get("since");
  const where = {
    source: "audit_gratuit_v2",
    ...(since ? { createdAt: { gte: new Date(since) } } : {}),
  };

  const audits = await prisma.auditSubmission.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return NextResponse.json({ audits });
}
