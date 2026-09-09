"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireCabinetAndUser } from "@/lib/auth/session";
import { createAuditLog } from "@/lib/services/audit";
import { sanitizeInput } from "@/lib/utils/sanitize";
import {
  createNavetteMessage,
  sendBackToAssistant,
  approveMatter,
  markReadyForReview,
  markNavetteRead,
  resolveNavetteMessage,
  type CreateNavetteResult,
  type DecideResult,
} from "@/lib/navette/navette-service";
import { isNavetteParticipant } from "@/lib/navette/navette-permissions";
import type { NavetteMessageType } from "@prisma/client";

export type NavetteActionResult = { ok: true } | { ok: false; error: string };

/** Ligne renvoyée à l'écran pour qu'une note apparaisse sans recharger la page. */
export interface NavetteEcho {
  id: string;
  type: NavetteMessageType;
  body: string | null;
  authorName: string | null;
  authorRole: string;
  recipientId: string | null;
  recipientName: string | null;
  parentId: string | null;
  dueDate: string | null;
  confidentiel: boolean;
  resolvedAt: string | null;
  createdAt: string;
}

export type NavetteSendResult =
  | { ok: true; message: NavetteEcho }
  | { ok: false; error: string };

/* ── Traduction des refus serveur en une phrase pour l'écran ───────────────
 *
 * Chaque refus dit ce qui s'est passé, pas « une erreur est survenue ».
 * « Quelqu'un a déjà tranché » est l'information utile quand deux personnes
 * regardent le même dossier : elle évite de recliquer. */
const MESSAGES_REFUS: Record<string, string> = {
  forbidden: "Vous n'avez pas la permission de faire cela.",
  not_found: "Cet élément est introuvable.",
  not_a_request: "Cette entrée n'attend aucune décision.",
  already_resolved: "Cette demande a déjà été traitée.",
  already_pending: "Une demande de révision est déjà en attente sur ce dossier.",
};

function refus(code: string): NavetteActionResult {
  return { ok: false, error: MESSAGES_REFUS[code] ?? "Une erreur est survenue." };
}

function asResult(res: CreateNavetteResult | DecideResult): NavetteActionResult {
  return res.ok ? { ok: true } : refus(res.error);
}

function revalidate(dossierId: string) {
  revalidatePath("/aujourdhui");
  revalidatePath("/tableau-de-bord");
  revalidatePath(`/dossiers/${dossierId}`);
}

/**
 * Note interne, question ou réponse.
 *
 * Ce qui change le 2026-09-05 : le type n'est plus imposé par l'écran à
 * `question`. Une note libre est une `info`, une réponse ciblée est un `reply`
 * qui garde son `parentId`, et `question` ne sert plus que quand quelqu'un
 * pose vraiment une question. Le fil cesse de compter des questions qui n'en
 * étaient pas.
 */
export async function sendNavetteMessageAction(input: {
  dossierId: string;
  type: Extract<NavetteMessageType, "question" | "info" | "reply">;
  body: string;
  parentId?: string | null;
  confidentiel?: boolean;
}): Promise<NavetteSendResult> {
  const { cabinetId, userId, role } = await requireCabinetAndUser();
  if (!isNavetteParticipant(role)) return { ok: false, error: MESSAGES_REFUS.forbidden };
  const body = sanitizeInput(input.body ?? "").trim();
  if (!body) return { ok: false, error: "Écrivez la note avant de l'envoyer." };

  // Une réponse ne se rattache qu'à une entrée du MÊME dossier et du même
  // cabinet. Sans cette lecture, un `parentId` fourni par le navigateur
  // rattacherait la note au fil d'un autre dossier.
  let parentId: string | null = null;
  if (input.parentId) {
    const parent = await prisma.dossierNavetteMessage.findFirst({
      where: { id: input.parentId, cabinetId, dossierId: input.dossierId },
      select: { id: true },
    });
    if (!parent) return { ok: false, error: MESSAGES_REFUS.not_found };
    parentId = parent.id;
  }

  const res = await createNavetteMessage({
    cabinetId,
    dossierId: input.dossierId,
    authorId: userId,
    authorRole: role,
    type: input.type,
    body,
    parentId,
    confidentiel: input.confidentiel ?? false,
  });
  if (!res.ok) return { ok: false, error: MESSAGES_REFUS[res.error] ?? "Une erreur est survenue." };

  await createAuditLog({
    cabinetId,
    userId,
    entityType: "DossierNavetteMessage",
    entityId: res.id,
    action: "create",
    metadata: { navetteType: input.type, dossierId: input.dossierId },
  });
  revalidate(input.dossierId);

  const ecrit = await prisma.dossierNavetteMessage.findFirst({
    where: { id: res.id, cabinetId },
    select: {
      id: true, type: true, body: true, authorRole: true, recipientId: true,
      parentId: true, dueDate: true, confidentiel: true, resolvedAt: true, createdAt: true,
      author: { select: { nom: true } },
    },
  });
  if (!ecrit) return { ok: false, error: MESSAGES_REFUS.not_found };

  return {
    ok: true,
    message: {
      id: ecrit.id,
      type: ecrit.type,
      body: ecrit.body,
      authorName: ecrit.author?.nom ?? null,
      authorRole: ecrit.authorRole,
      recipientId: ecrit.recipientId,
      recipientName: null,
      parentId: ecrit.parentId,
      dueDate: ecrit.dueDate ? ecrit.dueDate.toISOString() : null,
      confidentiel: ecrit.confidentiel,
      resolvedAt: ecrit.resolvedAt ? ecrit.resolvedAt.toISOString() : null,
      createdAt: ecrit.createdAt.toISOString(),
    },
  };
}

/**
 * Avocate → assistante : « Demander une correction » sur une demande précise.
 * Le motif est obligatoire : sans lui, l'assistante ne sait pas quoi corriger.
 */
export async function sendBackAction(input: {
  requestId: string;
  reason: string;
  dueDate?: string | null;
}): Promise<NavetteActionResult> {
  const { cabinetId, userId, role } = await requireCabinetAndUser();
  const reason = sanitizeInput(input.reason ?? "").trim();
  if (!reason) return { ok: false, error: "Indiquez ce qui doit être corrigé." };

  const res = await sendBackToAssistant({
    cabinetId,
    requestId: input.requestId,
    userId,
    role,
    body: reason,
    dueDate: input.dueDate ? new Date(input.dueDate) : null,
  });
  if (res.ok) {
    await createAuditLog({
      cabinetId, userId, entityType: "DossierNavetteMessage", entityId: res.id, action: "create",
      metadata: { navetteType: "sent_back", dossierId: res.dossierId, requestId: input.requestId },
    });
    revalidate(res.dossierId);
  }
  return asResult(res);
}

/** Avocate → assistante : approbation d'UNE demande de révision. */
export async function approveMatterAction(input: {
  requestId: string;
  note?: string;
  signalId?: string | null;
}): Promise<NavetteActionResult> {
  const { cabinetId, userId, role } = await requireCabinetAndUser();
  const res = await approveMatter({
    cabinetId,
    requestId: input.requestId,
    userId,
    role,
    isAdmin: role === "admin_cabinet",
    body: input.note ? sanitizeInput(input.note) : null,
    signalId: input.signalId ?? null,
  });
  if (res.ok) {
    await createAuditLog({
      cabinetId, userId, entityType: "DossierNavetteMessage", entityId: res.id, action: "create",
      metadata: { navetteType: "approved", dossierId: res.dossierId, requestId: input.requestId },
    });
    revalidate(res.dossierId);
  }
  return asResult(res);
}

/** Assistante → avocate : soumettre pour révision. */
export async function markReadyForReviewAction(input: {
  dossierId: string;
  note?: string;
}): Promise<NavetteActionResult> {
  const { cabinetId, userId, role } = await requireCabinetAndUser();
  const res = await markReadyForReview({
    cabinetId,
    dossierId: input.dossierId,
    authorId: userId,
    authorRole: role,
    note: input.note ? sanitizeInput(input.note) : null,
  });
  if (res.ok) {
    await createAuditLog({
      cabinetId, userId, entityType: "DossierNavetteMessage", entityId: res.id, action: "create",
      metadata: { navetteType: "ready_for_review", dossierId: input.dossierId },
    });
    revalidate(input.dossierId);
  }
  return asResult(res);
}

export async function markNavetteReadAction(id: string): Promise<NavetteActionResult> {
  const { cabinetId, userId, role } = await requireCabinetAndUser();
  const res = await markNavetteRead(id, cabinetId, userId, role);
  return res.ok ? { ok: true } : refus(res.error ?? "not_found");
}

/**
 * Marquer une demande traitée. Le dossier est déduit du message, pas reçu du
 * navigateur : c'était le dernier endroit où l'écran décidait de sa propre
 * portée.
 */
export async function resolveNavetteAction(id: string): Promise<NavetteActionResult> {
  const { cabinetId, userId, role } = await requireCabinetAndUser();
  const res = await resolveNavetteMessage(id, cabinetId, userId, role);
  if (res.ok && res.dossierId) {
    await createAuditLog({
      cabinetId, userId, entityType: "DossierNavetteMessage", entityId: id, action: "update",
      metadata: { navetteAction: "resolve", dossierId: res.dossierId },
    });
    revalidate(res.dossierId);
  }
  return res.ok ? { ok: true } : refus(res.error ?? "not_found");
}
