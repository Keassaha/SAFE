import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getDatabaseConfigError } from "@/lib/db-vercel-check";

/**
 * Vérifie la config puis teste la connexion réelle à la base.
 */
export async function GET() {
  const configError = getDatabaseConfigError();
  if (configError) {
    return NextResponse.json({ error: configError }, { status: 503 });
  }
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    const code = e && typeof e === "object" && "code" in e ? String((e as { code: string }).code) : "";
    const isVercel = process.env.VERCEL === "1";
    const errorMessage = isVercel
      ? "La base de données ne répond pas. Vérifiez DATABASE_URL (ou POSTGRES_URL) sur Vercel, que la base est créée et que vous avez redéployé après l'avoir liée."
      : "La base de données ne répond pas. Vérifiez DATABASE_URL dans .env (URL Supabase avec mot de passe), que le projet Supabase est actif et que votre réseau autorise la connexion (port 6543).";
    const body: { error: string; detail?: string; code?: string } = {
      error: errorMessage,
      detail: process.env.NODE_ENV === "development" ? `${code || ""} ${msg}` : undefined,
    };
    if (code && /^P\d+$/.test(code)) body.code = code;
    return NextResponse.json(body, { status: 503 });
  }
}
