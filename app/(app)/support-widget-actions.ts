"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireCabinetAndUser } from "@/lib/auth/session";
import type { TypeTicket } from "@prisma/client";

const VALID_TYPES: TypeTicket[] = ["BUG", "DEMANDE_FEATURE", "QUESTION", "REMARQUE", "URGENCE"];

export type WidgetTicket = {
  id: string;
  titre: string;
  type: TypeTicket;
  statut: string;
  createdAt: string;
  replies: { contenu: string; isFromSafeInc: boolean; createdAt: string }[];
};

/**
 * Crée un ticket depuis le widget client (n'importe quel cabinet authentifié).
 * createdById = l'utilisateur courant ; cabinetId = son cabinet.
 */
export async function createClientTicket(
  formData: FormData,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const { cabinetId, userId } = await requireCabinetAndUser();

    const type = String(formData.get("type") || "QUESTION") as TypeTicket;
    const titre = String(formData.get("titre") || "").trim();
    const description = String(formData.get("description") || "").trim();
    const contexteUrl = String(formData.get("contexteUrl") || "").trim();

    if (!VALID_TYPES.includes(type)) return { ok: false, error: "Type invalide" };
    if (!titre) return { ok: false, error: "Titre requis" };
    if (!description) return { ok: false, error: "Description requise" };

    await prisma.supportTicket.create({
      data: {
        cabinetId,
        createdById: userId,
        type,
        titre,
        description,
        statut: "NOUVEAU",
        contexteUrl: contexteUrl || null,
      },
    });

    revalidatePath("/console/support");
    return { ok: true };
  } catch (err) {
    console.error("createClientTicket", err);
    return { ok: false, error: err instanceof Error ? err.message : "Erreur" };
  }
}

/**
 * Liste les tickets du cabinet courant (pour le widget client).
 */
export async function listMyTickets(): Promise<WidgetTicket[]> {
  try {
    const { cabinetId } = await requireCabinetAndUser();
    const tickets = await prisma.supportTicket.findMany({
      where: { cabinetId },
      orderBy: { updatedAt: "desc" },
      take: 20,
      include: {
        replies: { orderBy: { createdAt: "asc" } },
      },
    });

    return tickets.map((t) => ({
      id: t.id,
      titre: t.titre,
      type: t.type,
      statut: t.statut,
      createdAt: t.createdAt.toISOString(),
      replies: t.replies.map((r) => ({
        contenu: r.contenu,
        isFromSafeInc: r.isFromSafeInc,
        createdAt: r.createdAt.toISOString(),
      })),
    }));
  } catch {
    return [];
  }
}
