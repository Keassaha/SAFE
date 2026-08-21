import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { userRoleToEmployeeRole } from "@/lib/auth/rbac";
import { createAuditLog } from "@/lib/services/audit";

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

  // SÉCURITÉ : ne JAMAIS exposer la compensation (taux horaire, facturable) dans
  // cette réponse publique gardée par le seul token. Le serveur l'utilise côté POST
  // pour créer le compte ; le porteur du lien n'a aucune raison de la voir.
  return NextResponse.json({
    email: invitation.email,
    role: invitation.role,
    cabinetNom: invitation.cabinet.nom,
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

  /* Compte ET fiche employé, dans la MÊME transaction.
   *
   * Cette route ne créait qu'un `User`. Or l'écran Équipe liste des employés,
   * et le seul levier de désactivation historique lisait `Employee.status` :
   * une personne arrivée par invitation n'apparaissait donc nulle part et ne
   * pouvait être désactivée par personne. Deux adjointes d'un cabinet réel
   * étaient dans ce cas.
   *
   * `User.desactiveLe` couvre désormais tous les comptes, y compris les neuf
   * déjà créés sans fiche. La fiche reste nécessaire pour que le membre soit
   * VISIBLE et gérable depuis l'écran Équipe, plutôt que par un script.
   *
   * Atomique : un compte sans fiche est exactement le défaut qu'on corrige.
   */
  const prenom = nom.trim().split(/\s+/)[0] ?? nom.trim();
  const nomFamille = nom.trim().split(/\s+/).slice(1).join(" ") || prenom;
  const compensation = invitation.compensation ? JSON.parse(invitation.compensation) : null;

  const user = await prisma.$transaction(async (tx) => {
    const cree = await tx.user.create({
      data: {
        cabinetId: invitation.cabinetId,
        email: invitation.email,
        passwordHash,
        nom,
        role: invitation.role,
        isBillable: compensation?.isBillable ?? false,
        defaultHourlyRate: compensation?.tauxHoraireFact ?? null,
      },
    });

    await tx.employee.create({
      data: {
        cabinetId: invitation.cabinetId,
        userId: cree.id,
        firstName: prenom,
        lastName: nomFamille,
        fullName: nom,
        email: invitation.email,
        // Date d'entrée = acceptation. C'est la seule que SAFE connaisse, et
        // elle est vraie : c'est le jour où cette personne a obtenu l'accès.
        hireDate: new Date(),
        role: userRoleToEmployeeRole(invitation.role),
        hourlyRate: compensation?.tauxHoraireFact ?? 0,
      },
    });

    await tx.invitation.update({
      where: { token },
      data: { acceptedAt: new Date() },
    });

    return cree;
  });

  // P4/Sécurité — traçabilité : compte créé par acceptation d'invitation.
  await createAuditLog({
    cabinetId: invitation.cabinetId,
    userId: user.id,
    entityType: "User",
    entityId: user.id,
    action: "create",
    metadata: { via: "invitation", invitationId: invitation.id, role: invitation.role },
  });
  await createAuditLog({
    cabinetId: invitation.cabinetId,
    userId: user.id,
    entityType: "Invitation",
    entityId: invitation.id,
    action: "update",
    metadata: { accepted: true },
  });

  return NextResponse.json({ userId: user.id, cabinetNom: invitation.cabinet.nom }, { status: 201 });
}
