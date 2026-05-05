import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";

// GET — valide le token et retourne les infos de l'invitation
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const invitation = await prisma.invitation.findUnique({
    where: { token },
    include: { cabinet: { select: { nom: true } } },
  });

  if (!invitation) {
    return NextResponse.json({ error: "Invitation introuvable." }, { status: 404 });
  }
  if (invitation.acceptedAt) {
    return NextResponse.json({ error: "Cette invitation a déjà été utilisée." }, { status: 410 });
  }
  if (invitation.expiresAt < new Date()) {
    return NextResponse.json({ error: "Cette invitation a expiré." }, { status: 410 });
  }

  return NextResponse.json({
    email: invitation.email,
    role: invitation.role,
    cabinetNom: invitation.cabinet.nom,
    compensation: invitation.compensation ? JSON.parse(invitation.compensation) : null,
  });
}

// POST — l'invité complète son profil et crée son compte
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const { nom, password } = await req.json();

  if (!nom || !password || password.length < 8) {
    return NextResponse.json({ error: "Nom et mot de passe (8 caractères min) requis." }, { status: 400 });
  }

  const invitation = await prisma.invitation.findUnique({
    where: { token },
    include: { cabinet: { select: { id: true, nom: true } } },
  });

  if (!invitation || invitation.acceptedAt || invitation.expiresAt < new Date()) {
    return NextResponse.json({ error: "Invitation invalide ou expirée." }, { status: 410 });
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: {
      cabinetId: invitation.cabinetId,
      email: invitation.email,
      passwordHash,
      nom,
      role: invitation.role,
      isBillable: invitation.compensation
        ? JSON.parse(invitation.compensation).isBillable ?? false
        : false,
      defaultHourlyRate: invitation.compensation
        ? JSON.parse(invitation.compensation).tauxHoraireFact ?? null
        : null,
    },
  });

  await prisma.invitation.update({
    where: { token },
    data: { acceptedAt: new Date() },
  });

  return NextResponse.json({ userId: user.id, cabinetNom: invitation.cabinet.nom }, { status: 201 });
}
