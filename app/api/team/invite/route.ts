import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/db";
import { sendEmail, invitationEmailHtml } from "@/lib/email";
import { getSessionOrRespond } from "@/lib/auth/session";

export async function POST(req: NextRequest) {
  const auth = await getSessionOrRespond();
  if (auth instanceof NextResponse) return auth;
  const { cabinetId, session } = auth;

  const user = session.user as { role?: string };
  if (user.role !== "admin_cabinet") {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const { email, role, compensation } = await req.json();

  if (!email || !role) {
    return NextResponse.json({ error: "Email et rôle requis" }, { status: 400 });
  }

  // Vérifier qu'il n'y a pas déjà un utilisateur avec cet email dans ce cabinet
  const existing = await prisma.user.findFirst({ where: { cabinetId, email: email.toLowerCase() } });
  if (existing) {
    return NextResponse.json({ error: "Un utilisateur avec cet email existe déjà." }, { status: 409 });
  }

  // Invalider toute invitation précédente non acceptée pour cet email
  await prisma.invitation.updateMany({
    where: { cabinetId, email: email.toLowerCase(), acceptedAt: null },
    data: { expiresAt: new Date() },
  });

  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000); // 72h

  const invitation = await prisma.invitation.create({
    data: {
      cabinetId,
      createdById: (session.user as { id?: string }).id ?? "",
      email: email.toLowerCase(),
      role,
      token,
      expiresAt,
      compensation: compensation ? JSON.stringify(compensation) : null,
    },
  });

  const cabinet = await prisma.cabinet.findUnique({ where: { id: cabinetId }, select: { nom: true } });
  const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3001";
  const inviteUrl = `${baseUrl}/rejoindre/${token}`;

  await sendEmail({
    to: email,
    subject: `Invitation à rejoindre ${cabinet?.nom ?? "votre cabinet"} sur SAFE`,
    html: invitationEmailHtml({
      cabinetNom: cabinet?.nom ?? "votre cabinet",
      inviteUrl,
      role,
    }),
    cabinetNom: cabinet?.nom,
  });

  return NextResponse.json({ id: invitation.id, inviteUrl }, { status: 201 });
}
