"use server";

import { prisma } from "@/lib/db";
import { requireCabinetAndUser } from "@/lib/auth/session";
import type { TypeTicket } from "@prisma/client";

export type WidgetPiece = {
  id: string;
  nom: string;
  mimeType: string;
  sizeBytes: number;
};

export type WidgetMessage = {
  id: string;
  contenu: string;
  isFromSafeInc: boolean;
  createdAt: string;
  pieces: WidgetPiece[];
};

export type WidgetConversation = {
  id: string;
  sujet: string;
  statut: string;
  lastMessageAt: string;
  unread: number; // messages SAFE non lus par le client
  dernierMessage: string | null;
  messages: WidgetMessage[];
};

/**
 * Liste les fils de discussion du cabinet courant (aperçu, sans tous les messages).
 */
export async function listMyConversations(): Promise<WidgetConversation[]> {
  try {
    const { cabinetId } = await requireCabinetAndUser();
    const convos = await prisma.supportConversation.findMany({
      where: { cabinetId },
      orderBy: { lastMessageAt: "desc" },
      take: 30,
      include: {
        messages: { orderBy: { createdAt: "desc" }, take: 1 },
        _count: {
          select: { messages: { where: { isFromSafeInc: true, readAt: null } } },
        },
      },
    });

    return convos.map((c) => ({
      id: c.id,
      sujet: c.sujet,
      statut: c.statut,
      lastMessageAt: c.lastMessageAt.toISOString(),
      unread: c._count.messages,
      dernierMessage: c.messages[0]?.contenu ?? null,
      messages: [],
    }));
  } catch {
    return [];
  }
}

/**
 * Récupère tous les messages d'un fil et marque comme lus les messages venant de SAFE.
 */
export async function getConversation(conversationId: string): Promise<WidgetConversation | null> {
  try {
    const { cabinetId } = await requireCabinetAndUser();
    const convo = await prisma.supportConversation.findFirst({
      where: { id: conversationId, cabinetId },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
          include: { pieces: { select: { id: true, nom: true, mimeType: true, sizeBytes: true } } },
        },
      },
    });
    if (!convo) return null;

    // Marquer lus les messages SAFE non encore lus par le client
    await prisma.supportMessage.updateMany({
      where: { conversationId, isFromSafeInc: true, readAt: null },
      data: { readAt: new Date() },
    });

    return {
      id: convo.id,
      sujet: convo.sujet,
      statut: convo.statut,
      lastMessageAt: convo.lastMessageAt.toISOString(),
      unread: 0,
      dernierMessage: convo.messages.at(-1)?.contenu ?? null,
      messages: convo.messages.map((m) => ({
        id: m.id,
        contenu: m.contenu,
        isFromSafeInc: m.isFromSafeInc,
        createdAt: m.createdAt.toISOString(),
        pieces: m.pieces,
      })),
    };
  } catch {
    return null;
  }
}

// L'envoi de message (nouveau fil ou fil existant, avec pièces jointes) passe par
// la route multipart POST /api/support/messages (les Server Actions plafonnent à
// 1 MB de body, insuffisant pour des fichiers).

// --- Suivi des billets (lecture seule côté client) ---

export type WidgetTicket = {
  id: string;
  titre: string;
  type: TypeTicket;
  statut: string;
  createdAt: string;
  replies: { contenu: string; isFromSafeInc: boolean; createdAt: string }[];
};

/**
 * Liste les billets du cabinet courant (onglet « Suivi » du widget).
 */
export async function listMyTickets(): Promise<WidgetTicket[]> {
  try {
    const { cabinetId } = await requireCabinetAndUser();
    const tickets = await prisma.supportTicket.findMany({
      where: { cabinetId },
      orderBy: { updatedAt: "desc" },
      take: 20,
      include: { replies: { orderBy: { createdAt: "asc" } } },
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
