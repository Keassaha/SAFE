"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireConsoleAccess } from "@/lib/safe-inc";
import type { TypeTicket, CrmPriorite } from "@prisma/client";

const VALID_TYPES: TypeTicket[] = ["BUG", "DEMANDE_FEATURE", "QUESTION", "REMARQUE", "URGENCE"];
const VALID_PRIORITES: CrmPriorite[] = ["HAUTE", "NORMALE", "BASSE"];

type Result = { ok: true; id?: string } | { ok: false; error: string };

async function assertSafe() {
  const { userId } = await requireConsoleAccess();
  return { userId };
}

// L'envoi de réponse (texte + pièces jointes) passe par la route multipart
// POST /api/support/messages, commune au client et à la console.

/** Marque comme lus les messages client d'un fil (appelé à l'ouverture). */
export async function markConversationRead(conversationId: string): Promise<void> {
  try {
    await assertSafe();
    await prisma.supportMessage.updateMany({
      where: { conversationId, isFromSafeInc: false, readAt: null },
      data: { readAt: new Date() },
    });
    revalidatePath("/console/support/messages");
  } catch {
    /* silencieux */
  }
}

/** Archive ou rouvre un fil. */
export async function setConversationStatut(formData: FormData): Promise<Result> {
  try {
    await assertSafe();
    const conversationId = String(formData.get("conversationId") || "");
    const statut = String(formData.get("statut") || "");
    if (!conversationId) return { ok: false, error: "Fil manquant" };
    if (statut !== "OUVERTE" && statut !== "ARCHIVEE") return { ok: false, error: "Statut invalide" };

    await prisma.supportConversation.update({
      where: { id: conversationId },
      data: { statut },
    });

    revalidatePath(`/console/support/messages/${conversationId}`);
    revalidatePath("/console/support/messages");
    return { ok: true };
  } catch (err) {
    console.error("setConversationStatut", err);
    return { ok: false, error: err instanceof Error ? err.message : "Erreur" };
  }
}

/**
 * Transforme une demande (fil de discussion, éventuellement un message précis)
 * en billet structuré. Le billet est lié au fil et visible du client (statut).
 */
export async function convertToBillet(formData: FormData): Promise<Result> {
  try {
    const { userId } = await assertSafe();

    const conversationId = String(formData.get("conversationId") || "");
    const sourceMessageId = String(formData.get("sourceMessageId") || "") || null;
    const type = String(formData.get("type") || "QUESTION") as TypeTicket;
    const priorite = String(formData.get("priorite") || "NORMALE") as CrmPriorite;
    const titre = String(formData.get("titre") || "").trim();
    const description = String(formData.get("description") || "").trim();

    if (!conversationId) return { ok: false, error: "Fil manquant" };
    if (!VALID_TYPES.includes(type)) return { ok: false, error: "Type invalide" };
    if (!VALID_PRIORITES.includes(priorite)) return { ok: false, error: "Priorité invalide" };
    if (!titre) return { ok: false, error: "Titre requis" };
    if (!description) return { ok: false, error: "Description requise" };

    const convo = await prisma.supportConversation.findUnique({
      where: { id: conversationId },
      select: { cabinetId: true },
    });
    if (!convo) return { ok: false, error: "Fil introuvable" };

    const ticket = await prisma.supportTicket.create({
      data: {
        cabinetId: convo.cabinetId,
        createdById: userId,
        type,
        priorite,
        titre,
        description,
        statut: "NOUVEAU",
        conversationId,
        sourceMessageId,
      },
    });

    revalidatePath("/console/support");
    revalidatePath(`/console/support/messages/${conversationId}`);
    return { ok: true, id: ticket.id };
  } catch (err) {
    console.error("convertToBillet", err);
    return { ok: false, error: err instanceof Error ? err.message : "Erreur" };
  }
}
