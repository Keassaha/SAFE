"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireConsoleAccess } from "@/lib/safe-inc";
import { convertirLeadEnCabinet } from "@/lib/services/crm/conversion";
import { sendEmail, invitationEmailHtml } from "@/lib/email";

/** Racine publique de l'application, pour construire le lien d'invitation. */
function baseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.NEXTAUTH_URL ??
    "https://safecabinet.ca"
  ).replace(/\/$/, "");
}

/**
 * Actions de conversion Lead → Cabinet.
 *
 * La conversion et l'envoi de l'invitation sont deux gestes distincts. Convertir
 * crée le cabinet et met l'invitation en attente ; l'envoi vient après, quand la
 * configuration a été vérifiée. Personne ne reçoit un accès à un espace vide.
 */

export type ActionResult = { ok: true; message?: string } | { ok: false; error: string };

export async function convertirClient(formData: FormData): Promise<ActionResult> {
  try {
    const { userId } = await requireConsoleAccess();

    const leadId = String(formData.get("leadId") || "");
    if (!leadId) return { ok: false, error: "Cabinet manquant." };

    const result = await convertirLeadEnCabinet(
      {
        leadId,
        cabinetNom: String(formData.get("cabinetNom") || ""),
        cabinetEmail: String(formData.get("cabinetEmail") || "") || null,
        cabinetTelephone: String(formData.get("cabinetTelephone") || "") || null,
        cabinetAdresse: String(formData.get("cabinetAdresse") || "") || null,
        adminEmail: String(formData.get("adminEmail") || ""),
        plan: String(formData.get("plan") || "essentiel"),
        fiscalYearEnd: String(formData.get("fiscalYearEnd") || "") || null,
      },
      userId,
    );

    if (!result.ok) return result;

    revalidatePath("/console");
    revalidatePath("/console/clients");
    revalidatePath("/console/pipeline");
    revalidatePath(`/console/clients/${leadId}`);

    return { ok: true, message: "Cabinet créé. L'invitation est prête, elle n'est pas encore envoyée." };
  } catch (err) {
    console.error("convertirClient error", err);
    return { ok: false, error: err instanceof Error ? err.message : "Erreur inconnue" };
  }
}

/**
 * Envoie l'invitation d'administrateur, une fois la configuration vérifiée.
 * Geste explicite, jamais déclenché par la conversion elle-même.
 */
export async function envoyerInvitationAdmin(leadId: string): Promise<ActionResult> {
  try {
    await requireConsoleAccess();

    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      select: { cabinetId: true, cabinet: { select: { nom: true } } },
    });
    if (!lead?.cabinetId) return { ok: false, error: "Ce cabinet n'est pas encore converti." };

    const invitation = await prisma.invitation.findFirst({
      where: { cabinetId: lead.cabinetId, acceptedAt: null },
      orderBy: { createdAt: "desc" },
      select: { id: true, email: true, token: true, role: true, expiresAt: true },
    });
    if (!invitation) {
      return { ok: false, error: "Aucune invitation en attente. Elle a peut-être déjà été acceptée." };
    }

    // Une invitation expirée est réémise plutôt qu'envoyée telle quelle : le
    // destinataire cliquerait sur un lien mort.
    let token = invitation.token;
    if (invitation.expiresAt < new Date()) {
      const renouvelee = await prisma.invitation.update({
        where: { id: invitation.id },
        data: { expiresAt: new Date(Date.now() + 72 * 60 * 60 * 1000) },
        select: { token: true },
      });
      token = renouvelee.token;
    }

    await sendEmail({
      to: invitation.email,
      subject: `Votre accès à SAFE, ${lead.cabinet?.nom ?? "votre cabinet"}`,
      html: invitationEmailHtml({
        cabinetNom: lead.cabinet?.nom ?? "votre cabinet",
        inviteUrl: `${baseUrl()}/rejoindre/${token}`,
        role: invitation.role,
      }),
    });

    await prisma.activity.create({
      data: {
        leadId,
        type: "EMAIL_ENVOYE",
        direction: "OUTBOUND",
        sujet: "Invitation d'administrateur envoyée",
        contenu: `Accès envoyé à ${invitation.email}.`,
        statutEmail: "ENVOYE",
      },
    });

    revalidatePath(`/console/clients/${leadId}`);
    return { ok: true, message: `Invitation envoyée à ${invitation.email}.` };
  } catch (err) {
    console.error("envoyerInvitationAdmin error", err);
    return { ok: false, error: err instanceof Error ? err.message : "Erreur inconnue" };
  }
}
