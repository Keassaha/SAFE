"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireCabinetAndUser } from "@/lib/auth/session";
import { isSafeIncCabinet } from "@/lib/safe-inc";
import type { TypeTicket, StatutTicket, CrmPriorite } from "@prisma/client";

const VALID_TYPES: TypeTicket[] = ["BUG", "DEMANDE_FEATURE", "QUESTION", "REMARQUE", "URGENCE"];
const VALID_STATUTS: StatutTicket[] = ["NOUVEAU", "EN_COURS", "EN_ATTENTE_CLIENT", "RESOLU", "FERME", "REOUVERT"];
const VALID_PRIORITES: CrmPriorite[] = ["HAUTE", "NORMALE", "BASSE"];

type Result = { ok: true; id?: string } | { ok: false; error: string };

async function assertSafe() {
  const { cabinetId, userId } = await requireCabinetAndUser();
  if (!(await isSafeIncCabinet(cabinetId))) {
    throw new Error("Accès réservé à SAFE Inc.");
  }
  return { userId };
}

/**
 * Crée un ticket de support pour un cabinet client (loggé par le CEO en v1,
 * avant que le widget client bidirectionnel existe).
 */
export async function createTicket(formData: FormData): Promise<Result> {
  try {
    const { userId } = await assertSafe();

    const cabinetId = String(formData.get("cabinetId") || "");
    const type = String(formData.get("type") || "") as TypeTicket;
    const priorite = String(formData.get("priorite") || "NORMALE") as CrmPriorite;
    const titre = String(formData.get("titre") || "").trim();
    const description = String(formData.get("description") || "").trim();

    if (!cabinetId) return { ok: false, error: "Cabinet requis" };
    if (!VALID_TYPES.includes(type)) return { ok: false, error: "Type invalide" };
    if (!VALID_PRIORITES.includes(priorite)) return { ok: false, error: "Priorité invalide" };
    if (!titre) return { ok: false, error: "Titre requis" };
    if (!description) return { ok: false, error: "Description requise" };

    const ticket = await prisma.supportTicket.create({
      data: {
        cabinetId,
        createdById: userId,
        type,
        priorite,
        titre,
        description,
        statut: "NOUVEAU",
      },
    });

    revalidatePath("/console/support");
    return { ok: true, id: ticket.id };
  } catch (err) {
    console.error("createTicket", err);
    return { ok: false, error: err instanceof Error ? err.message : "Erreur" };
  }
}

/** Ajoute une réponse à un ticket (côté SAFE Inc.). */
export async function addReply(formData: FormData): Promise<Result> {
  try {
    const { userId } = await assertSafe();
    const ticketId = String(formData.get("ticketId") || "");
    const contenu = String(formData.get("contenu") || "").trim();

    if (!ticketId) return { ok: false, error: "Ticket manquant" };
    if (!contenu) return { ok: false, error: "Réponse vide" };

    const ticket = await prisma.supportTicket.findUnique({
      where: { id: ticketId },
      select: { id: true },
    });
    if (!ticket) return { ok: false, error: "Ticket introuvable" };

    await prisma.ticketReply.create({
      data: { ticketId, authorId: userId, isFromSafeInc: true, contenu },
    });

    // Répondre passe le ticket en attente client (sauf s'il est résolu/fermé)
    await prisma.supportTicket.update({
      where: { id: ticketId },
      data: { statut: "EN_ATTENTE_CLIENT" },
    });

    revalidatePath(`/console/support/${ticketId}`);
    revalidatePath("/console/support");
    return { ok: true };
  } catch (err) {
    console.error("addReply", err);
    return { ok: false, error: err instanceof Error ? err.message : "Erreur" };
  }
}

/** Change le statut d'un ticket. */
export async function setTicketStatus(formData: FormData): Promise<Result> {
  try {
    await assertSafe();
    const ticketId = String(formData.get("ticketId") || "");
    const statut = String(formData.get("statut") || "") as StatutTicket;

    if (!ticketId) return { ok: false, error: "Ticket manquant" };
    if (!VALID_STATUTS.includes(statut)) return { ok: false, error: "Statut invalide" };

    await prisma.supportTicket.update({
      where: { id: ticketId },
      data: {
        statut,
        dateResolution: statut === "RESOLU" || statut === "FERME" ? new Date() : null,
      },
    });

    revalidatePath(`/console/support/${ticketId}`);
    revalidatePath("/console/support");
    return { ok: true };
  } catch (err) {
    console.error("setTicketStatus", err);
    return { ok: false, error: err instanceof Error ? err.message : "Erreur" };
  }
}
