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
    const code = e && typeof e === "object" && "code" in e ? (e as { code: string }).code : "";
    return NextResponse.json(
      {
        error:
          "La base de données ne répond pas. Vérifiez DATABASE_URL (ou POSTGRES_URL) sur Vercel, que la base est créée et que vous avez redéployé après l'avoir liée.",
        detail: process.env.NODE_ENV === "development" ? `${code || ""} ${msg}` : undefined,
      },
      { status: 503 }
    );
  }
}
