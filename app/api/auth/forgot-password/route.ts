import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendEmail, passwordResetEmailHtml } from "@/lib/email";
import { isRateLimited } from "@/lib/rate-limit";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  // Rate limiting: 5 tentatives par minute par IP
  const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
  if (isRateLimited(`forgot-${ip}`, 5, 60_000)) {
    return NextResponse.json(
      { error: "Trop de tentatives. Réessayez dans une minute." },
      { status: 429 }
    );
  }

  // Toujours retourner le MÊME message — ne jamais révéler si l'email existe
  const successResponse = NextResponse.json({
    message: "Si un compte existe avec cet email, un lien de réinitialisation a été envoyé.",
  });

  try {
    const { email, cabinetName } = await req.json();

    if (!email || !cabinetName) {
      return NextResponse.json(
        { error: "Email et nom du cabinet requis" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findFirst({
      where: {
        email: email.toLowerCase(),
        cabinet: { nom: cabinetName },
      },
    });

    if (!user) return successResponse;

    // Générer un token sécurisé
    const token = crypto.randomBytes(32).toString("hex");
    const expiry = new Date(Date.now() + 3600000); // 1 heure

    await prisma.user.update({
      where: { id: user.id },
      data: { resetToken: token, resetTokenExpiry: expiry },
    });

    const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${token}`;
    const html = passwordResetEmailHtml(resetUrl);

    // Envoyer l'email — si ça échoue, on retourne quand même le succès
    try {
      await sendEmail({
        to: user.email,
        subject: "Réinitialisation de votre mot de passe — SAFE",
        html,
      });
    } catch (emailErr) {
      console.error("Email send failed (non-blocking):", emailErr);
    }

    return successResponse;
  } catch (error) {
    console.error("Forgot password error:", error);
    // Retourner le MÊME message de succès pour ne pas fuiter d'info
    return successResponse;
  }
}
