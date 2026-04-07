import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendEmail, passwordResetEmailHtml } from "@/lib/email";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const { email, cabinetName } = await req.json();

    if (!email || !cabinetName) {
      return NextResponse.json(
        { error: "Email et nom du cabinet requis" },
        { status: 400 }
      );
    }

    // Toujours retourner succès pour ne pas révéler si l'email existe
    const successResponse = NextResponse.json({
      message: "Si un compte existe avec cet email, un lien de réinitialisation a été envoyé.",
    });

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

    await sendEmail({
      to: user.email,
      subject: "Réinitialisation de votre mot de passe — SAFE",
      html,
    });

    return successResponse;
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
