import { NextResponse, type NextRequest } from "next/server";
import { sendEmail } from "@/lib/email";
import { calculateOnboardingValue } from "@/lib/onboarding/calculator";
import { onboardingAdminEmailHtml } from "@/lib/email-templates/onboarding-admin";
import {
  onboardingClientEmailHtml,
  getClientEmailSubject,
} from "@/lib/email-templates/onboarding-client";
import { getClientIp, isRateLimited } from "@/lib/rate-limit";
import type { OnboardingData, Lang } from "@/lib/onboarding/types";

/* ─────────────────────────────────────────────
   POST /api/onboarding
   ───────────────────────────────────────────── */
export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req.headers);
    if (await isRateLimited(`onboarding-${ip}`, 5, 60_000)) {
      return NextResponse.json({ error: "Rate limited" }, { status: 429 });
    }

    const body = await req.json();
    const { lang, data } = body as { lang: Lang; data: OnboardingData };

    if (!lang || !data || !data.email || !data.firmName) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    // Calculate value (server-side verification)
    const calc = calculateOnboardingValue(data);

    // ── Email 1 : Admin (Jérémie) ──
    const adminSubject =
      lang === "fr"
        ? `Nouvel audit SAFE — ${data.firmName}`
        : `New SAFE audit — ${data.firmName}`;

    try {
      await sendEmail({
        to: "jeremie@safecabinet.ca",
        subject: adminSubject,
        html: onboardingAdminEmailHtml(data, lang, calc),
      });
    } catch (err) {
      console.error("[Onboarding] Admin email failed:", err);
      // Non-blocking — continue
    }

    // ── Email 2 : Client ──
    try {
      await sendEmail({
        to: data.email,
        subject: getClientEmailSubject(lang),
        html: onboardingClientEmailHtml(data.leadName || data.firmName, lang, calc),
      });
    } catch (err) {
      console.error("[Onboarding] Client email failed:", err);
      // Non-blocking
    }

    return NextResponse.json({
      success: true,
      plan: calc.plan.name[lang],
      totalValue: calc.totalValue,
    });
  } catch (err) {
    console.error("[Onboarding] Error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
