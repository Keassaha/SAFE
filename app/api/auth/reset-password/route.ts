import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { getClientIp, isRateLimited } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  // Limitation de débit (audit 2026-07-28, §M3) : la route consommait des jetons
  // sans aucun plafond. 10 tentatives par minute et par IP suffisent largement à
  // un usage légitime.
  const ip = getClientIp(req.headers);
  if (await isRateLimited(`reset-${ip}`, 10, 60_000)) {
    return NextResponse.json(
      { error: "Trop de tentatives. Réessayez dans une minute." },
      { status: 429 }
    );
  }

  try {
    const { token, password } = await req.json();

    if (!token || !password) {
      return NextResponse.json(
        { error: "Token et mot de passe requis" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Le mot de passe doit contenir au moins 8 caractères" },
        { status: 400 }
      );
    }

    // La base ne contient que le haché du jeton (voir forgot-password).
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    const user = await prisma.user.findFirst({
      where: {
        resetToken: tokenHash,
        resetTokenExpiry: { gt: new Date() },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Lien invalide ou expiré. Veuillez refaire une demande." },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        resetToken: null,
        resetTokenExpiry: null,
        // Révoque toutes les sessions ouvertes (audit 2026-07-28, §M1) : un
        // changement de mot de passe doit déconnecter partout, y compris
        // l'attaquant éventuel qui avait déjà une session.
        sessionsValidFrom: new Date(),
      },
    });

    return NextResponse.json({
      message: "Mot de passe réinitialisé avec succès",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
