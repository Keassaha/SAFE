import { NextResponse } from "next/server";
import { runDailyDigest } from "@/lib/notifications/daily-digest";

/**
 * Cron — digest courriel quotidien (N7b).
 * Doctrine : docs/product/SPEC_aaliyah_home_navette.md §8.
 *
 * Déclenché par Vercel Cron (voir vercel.json). Protégé par `CRON_SECRET` :
 * Vercel envoie `Authorization: Bearer <CRON_SECRET>`. Si la variable n'est
 * pas définie, l'accès est refusé (pas d'envoi non authentifié).
 */

export const dynamic = "force-dynamic";
export const maxDuration = 300;

function isAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const header = request.headers.get("authorization");
  return header === `Bearer ${secret}`;
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  try {
    const result = await runDailyDigest();
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    console.error("[cron/daily-digest] failed:", error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "unknown" },
      { status: 500 },
    );
  }
}
