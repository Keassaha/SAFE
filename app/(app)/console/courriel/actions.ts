"use server";

import { prisma } from "@/lib/db";
import { requireConsoleAccess } from "@/lib/safe-inc";
import { construireCourriel, envoyerCourrielLead } from "@/lib/services/crm/courriel";
import { revalidatePath } from "next/cache";

/**
 * Actions du moteur de courriel CRM.
 *
 * L'aperçu et l'envoi partagent le même constructeur : ce que l'écran montre
 * est ce qui part. Rien ne s'envoie sans un clic explicite sur l'aperçu.
 */

export type ApercuResult =
  | { ok: true; destinataire: string; destinataireNom: string; sujet: string; corps: string }
  | { ok: false; error: string };

/** Nom d'expéditeur lisible pour la signature des gabarits. */
async function nomExpediteur(userId: string): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { nom: true, email: true },
  });
  return user?.nom?.trim() || user?.email || "L'équipe SAFE";
}

export async function apercuCourriel(input: {
  contactId: string;
  gabaritId?: string | null;
  sujetPersonnalise?: string | null;
  corpsPersonnalise?: string | null;
}): Promise<ApercuResult> {
  try {
    const { userId } = await requireConsoleAccess();
    const construit = await construireCourriel({
      ...input,
      expediteur: await nomExpediteur(userId),
    });
    if ("bloque" in construit) return { ok: false, error: construit.raison };
    return {
      ok: true,
      destinataire: construit.destinataire,
      destinataireNom: construit.destinataireNom,
      sujet: construit.sujet,
      corps: construit.corps,
    };
  } catch (err) {
    console.error("apercuCourriel error", err);
    return { ok: false, error: err instanceof Error ? err.message : "Erreur inconnue" };
  }
}

export async function envoyerCourriel(input: {
  contactId: string;
  leadId: string;
  gabaritId?: string | null;
  sujetPersonnalise?: string | null;
  corpsPersonnalise?: string | null;
}): Promise<{ ok: true; sujet: string } | { ok: false; error: string }> {
  try {
    const { userId } = await requireConsoleAccess();

    // Le sujet et le corps relus à l'écran sont obligatoires à l'envoi : on
    // n'envoie pas un gabarit qui n'a pas été affiché.
    if (!input.sujetPersonnalise?.trim() || !input.corpsPersonnalise?.trim()) {
      return { ok: false, error: "Prévisualisez le message avant de l'envoyer." };
    }

    const result = await envoyerCourrielLead({
      contactId: input.contactId,
      gabaritId: input.gabaritId,
      sujetPersonnalise: input.sujetPersonnalise,
      corpsPersonnalise: input.corpsPersonnalise,
      expediteur: await nomExpediteur(userId),
      userId,
    });

    if (result.ok) {
      revalidatePath(`/console/clients/${input.leadId}`);
      revalidatePath("/console");
      revalidatePath("/console/leads");
    }
    return result;
  } catch (err) {
    console.error("envoyerCourriel error", err);
    return { ok: false, error: err instanceof Error ? err.message : "Erreur inconnue" };
  }
}
