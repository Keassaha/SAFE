import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { peutAjouterUnUtilisateur } from "@/lib/services/abonnement/places";
import { sendEmail, invitationEmailHtml } from "@/lib/email";
import { getSessionOrRespond } from "@/lib/auth/session";
import { createAuditLog } from "@/lib/services/audit";

/**
 * Rôles qu'un administrateur peut attribuer par invitation. P0 sécurité : le rôle
 * vient du JSON client, il DOIT être validé contre cette liste blanche (sinon
 * injection d'un rôle arbitraire / escalade). Les rôles RH non connectables
 * (stagiaire, lecture seule) ne sont pas invitables tant que la normalisation RBAC
 * (P3) n'a pas tranché leur connexion.
 */
const INVITABLE_ROLES = ["admin_cabinet", "avocat", "assistante", "comptabilite"] as const;

const inviteSchema = z.object({
  email: z.string().trim().email().transform((value) => value.toLowerCase()),
  role: z.enum(INVITABLE_ROLES),
  compensation: z.unknown().optional(),
});

export async function POST(req: NextRequest) {
  const auth = await getSessionOrRespond();
  if (auth instanceof NextResponse) return auth;
  const { cabinetId, session } = auth;

  const user = session.user as { role?: string };
  if (user.role !== "admin_cabinet") {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const parsed = inviteSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invitation invalide : courriel et rôle autorisé requis.", details: parsed.error.flatten() },
      { status: 400 },
    );
  }
  const { email, role, compensation } = parsed.data;

  // Vérifier qu'il n'y a pas déjà un utilisateur avec cet email dans ce cabinet
  const existing = await prisma.user.findFirst({ where: { cabinetId, email: email.toLowerCase() } });
  if (existing) {
    return NextResponse.json({ error: "Un utilisateur avec cet email existe déjà." }, { status: 409 });
  }

  /* Places du forfait (constat C-07). Verifiee ICI, a l'invitation, et non a
     l'acceptation : l'administrateur apprend tout de suite qu'il n'a plus de
     place, plutot que d'envoyer un lien qui echouera chez la personne invitee.

     On compte les comptes ACTIFS : un compte desactive ne consomme pas de
     place, sinon un cabinet resterait bloque par le depart qu'il vient d'acter.
     Les invitations en attente comptent aussi, sans quoi on pourrait en emettre
     dix d'un coup sur un forfait a une place. */
  const [utilisateursActifs, invitationsEnAttente, cabinetForfait] = await Promise.all([
    prisma.user.count({ where: { cabinetId, desactiveLe: null } }),
    prisma.invitation.count({
      where: { cabinetId, acceptedAt: null, expiresAt: { gt: new Date() } },
    }),
    prisma.cabinet.findUnique({ where: { id: cabinetId }, select: { plan: true } }),
  ]);
  const place = peutAjouterUnUtilisateur({
    plan: cabinetForfait?.plan,
    utilisateursActifs: utilisateursActifs + invitationsEnAttente,
  });
  if (!place.autorise) {
    return NextResponse.json(
      {
        error:
          `Votre forfait comprend ${place.limite} accès, et ${place.actuels} sont déjà ` +
          `pris ou réservés par une invitation en attente. Passez à un forfait supérieur ` +
          `pour inviter cette personne.`,
      },
      { status: 409 },
    );
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

  // Sécurité/traçabilité — qui a invité qui, à quel rôle (jamais la compensation).
  await createAuditLog({
    cabinetId,
    userId: (session.user as { id?: string }).id ?? null,
    entityType: "Invitation",
    entityId: invitation.id,
    action: "create",
    metadata: { email: email.toLowerCase(), role },
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
