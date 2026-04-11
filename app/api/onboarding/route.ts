import { NextResponse, type NextRequest } from "next/server";
import { sendEmail } from "@/lib/email";
import { calculateOnboardingValue } from "@/lib/onboarding/calculator";
import { onboardingAdminEmailHtml } from "@/lib/email-templates/onboarding-admin";
import {
  onboardingClientEmailHtml,
  getClientEmailSubject,
} from "@/lib/email-templates/onboarding-client";
import type { OnboardingData, Lang } from "@/lib/onboarding/types";

/* ─────────────────────────────────────────────
   Rate limiting (simple in-memory)
   ───────────────────────────────────────────── */
const rateMap = new Map<string, { count: number; reset: number }>();
const RATE_LIMIT = 5;
const RATE_WINDOW = 60_000; // 1 min

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateMap.get(ip);
  if (!entry || now > entry.reset) {
    rateMap.set(ip, { count: 1, reset: now + RATE_WINDOW });
    return false;
  }
  entry.count += 1;
  return entry.count > RATE_LIMIT;
}

/* ─────────────────────────────────────────────
   POST /api/onboarding
   ───────────────────────────────────────────── */
export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip") ?? "unknown";
    if (isRateLimited(ip)) {
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
        to: "ptiahou@gmail.com",
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
