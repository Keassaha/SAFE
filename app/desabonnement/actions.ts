"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { verifierSignature } from "@/lib/crm/desabonnement";

/**
 * Traite le désabonnement. Action publique par nature : la seule autorisation
 * est la signature du lien, qui prouve que le message vient bien de nous.
 *
 * Le désabonnement est définitif côté envoi (`doNotContact`) et laisse une
 * trace d'activité, pour qu'on puisse démontrer la date de traitement en cas
 * de plainte LCAP.
 */
export async function confirmerDesabonnement(formData: FormData): Promise<void> {
  const contactId = String(formData.get("c") || "");
  const signature = String(formData.get("s") || "");

  if (!contactId || !signature || !verifierSignature(contactId, signature)) {
    redirect("/desabonnement");
  }

  const contact = await prisma.leadContact.findUnique({
    where: { id: contactId },
    select: { id: true, leadId: true, doNotContact: true },
  });

  if (contact && !contact.doNotContact) {
    await prisma.leadContact.update({
      where: { id: contact.id },
      data: { doNotContact: true },
    });
    await prisma.activity.create({
      data: {
        leadId: contact.leadId,
        contactId: contact.id,
        type: "NOTE",
        direction: "INBOUND",
        sujet: "Désabonnement",
        contenu: "Le contact s'est désabonné depuis le lien d'un courriel.",
      },
    });
  }

  redirect(
    `/desabonnement?c=${encodeURIComponent(contactId)}&s=${encodeURIComponent(signature)}&fait=1`,
  );
}
