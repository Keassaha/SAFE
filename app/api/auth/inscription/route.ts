import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getDatabaseConfigError } from "@/lib/db-vercel-check";
import bcrypt from "bcryptjs";
import { signUpSchema } from "@/lib/validations/auth";

export async function POST(request: Request) {
  const dbError = getDatabaseConfigError();
  if (dbError) {
    return NextResponse.json(
      { error: dbError },
      { status: 503 }
    );
  }
  try {
    const body = await request.json();
    const parsed = signUpSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }
    const { email, password, nom, nomCabinet, adresseCabinet } = parsed.data;
    const existing = await prisma.user.findFirst({
      where: { email: email.toLowerCase() },
    });
    if (existing) {
      return NextResponse.json(
        { error: "Un compte existe déjà avec cet email." },
        { status: 400 }
      );
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const cabinet = await prisma.cabinet.create({
      data: {
        nom: nomCabinet,
        adresse: adresseCabinet ?? null,
      },
    });
    await prisma.user.create({
      data: {
        cabinetId: cabinet.id,
        email: email.toLowerCase(),
        passwordHash,
        nom,
        role: "admin_cabinet",
      },
    });
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("[inscription]", e);
    const message = e instanceof Error ? e.message : String(e);
    const code = e && typeof e === "object" && "code" in e ? String((e as { code: string }).code) : "";
    const shortDetail = (code ? `[${code}] ` : "") + message.slice(0, 180).replace(/\s+/g, " ").trim();
    const isDbConnection =
      code.startsWith("P1") ||
      message.includes("Can't reach database") ||
      message.includes("Connection") ||
      message.includes("ECONNREFUSED") ||
      message.includes("ENOTFOUND") ||
      message.includes("connect") ||
      message.includes("Connection refused") ||
      message.includes("getaddrinfo") ||
      message.includes("SSL") ||
      message.includes("certificate");
    const isTableMissing =
      code === "P2021" ||
      message.includes("does not exist") ||
      message.includes("relation") ||
      message.includes("Cabinet") ||
      message.includes("Unknown table") ||
      message.includes("no such table");
    const isPrismaOrDb = message.includes("prisma") || message.includes("database") || code.startsWith("P");
    let userMessage = "Erreur lors de la création du compte.";
    if (isDbConnection) {
      userMessage =
        "Impossible de joindre la base de données. Vérifiez DATABASE_URL (ou POSTGRES_URL) sur Vercel, que la base Postgres est créée et liée au projet, puis redéployez.";
    } else if (isTableMissing) {
      userMessage =
        "Les tables sont absentes. Redéployez le projet sur Vercel (le build doit exécuter prisma migrate deploy). Vérifiez que DATABASE_URL est défini au moment du build.";
    } else if (process.env.VERCEL === "1" && isPrismaOrDb) {
      userMessage =
        "Problème de base de données. Sur Vercel : DATABASE_URL (PostgreSQL), NEXTAUTH_SECRET et NEXTAUTH_URL dans Settings → Environment Variables, puis redéployez.";
    } else if (process.env.VERCEL === "1") {
      userMessage =
        "Création impossible. Vérifiez les variables d'environnement sur Vercel puis redéployez.";
    }
    if (process.env.VERCEL === "1" && shortDetail) {
      userMessage += ` Détail: ${shortDetail}`;
    }
    return NextResponse.json({ error: userMessage }, { status: 500 });
  }
}
