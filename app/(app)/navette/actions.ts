"use server";

import { revalidatePath } from "next/cache";
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
} from "@/lib/navette/navette-service";
import { isNavetteParticipant } from "@/lib/navette/navette-permissions";
import type { NavetteMessageType } from "@prisma/client";

export type NavetteActionResult = { ok: true } | { ok: false; error: string };

function asResult(res: CreateNavetteResult): NavetteActionResult {
  if (res.ok) return { ok: true };
  return { ok: false, error: res.error === "forbidden" ? "Action non autorisée." : "Dossier introuvable." };
}

function revalidate(dossierId: string) {
  revalidatePath("/aujourdhui");
  revalidatePath(`/dossiers/${dossierId}`);
}

/** Message libre (question / info / reply) sur un dossier. */
export async function sendNavetteMessageAction(input: {
  dossierId: string;
  type: Extract<NavetteMessageType, "question" | "info" | "reply">;
  body: string;
  parentId?: string;
  confidentiel?: boolean;
}): Promise<NavetteActionResult> {
  const { cabinetId, userId, role } = await requireCabinetAndUser();
  if (!isNavetteParticipant(role)) return { ok: false, error: "Action non autorisée." };
  const body = sanitizeInput(input.body ?? "").trim();
  if (!body) return { ok: false, error: "Message vide." };

  const res = await createNavetteMessage({
    cabinetId,
    dossierId: input.dossierId,
    authorId: userId,
    authorRole: role,
    type: input.type,
    body,
    parentId: input.parentId ?? null,
    confidentiel: input.confidentiel ?? false,
  });
  if (res.ok) {
    await createAuditLog({ cabinetId, userId, entityType: "DossierNavetteMessage", entityId: res.id, action: "create", metadata: { type: input.type, dossierId: input.dossierId } });
    revalidate(input.dossierId);
  }
  return asResult(res);
}

/** Avocate → assistante : renvoi (à revoir). */
export async function sendBackAction(input: {
  dossierId: string;
  reason: string;
  dueDate?: string | null;
}): Promise<NavetteActionResult> {
  const { cabinetId, userId, role } = await requireCabinetAndUser();
  const reason = sanitizeInput(input.reason ?? "").trim();
  if (!reason) return { ok: false, error: "Indiquez la raison du renvoi." };

  const res = await sendBackToAssistant({
    cabinetId,
    dossierId: input.dossierId,
    authorId: userId,
    authorRole: role,
    reason,
    dueDate: input.dueDate ? new Date(input.dueDate) : null,
  });
  if (res.ok) {
    await createAuditLog({ cabinetId, userId, entityType: "DossierNavetteMessage", entityId: res.id, action: "create", metadata: { navetteType: "sent_back", dossierId: input.dossierId } });
    revalidate(input.dossierId);
  }
  return asResult(res);
}

/** Avocate → assistante : approbation (acquitte le signal legacy si fourni). */
export async function approveMatterAction(input: {
  dossierId: string;
  note?: string;
  signalId?: string | null;
}): Promise<NavetteActionResult> {
  const { cabinetId, userId, role } = await requireCabinetAndUser();
  const res = await approveMatter({
    cabinetId,
    dossierId: input.dossierId,
    authorId: userId,
    authorRole: role,
    isAdmin: role === "admin_cabinet",
    note: input.note ? sanitizeInput(input.note) : null,
    signalId: input.signalId ?? null,
  });
  if (res.ok) {
    await createAuditLog({ cabinetId, userId, entityType: "DossierNavetteMessage", entityId: res.id, action: "create", metadata: { navetteType: "approved", dossierId: input.dossierId } });
    revalidate(input.dossierId);
  }
  return asResult(res);
}

/** Assistante → avocate : prêt pour revue. */
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
    await createAuditLog({ cabinetId, userId, entityType: "DossierNavetteMessage", entityId: res.id, action: "create", metadata: { navetteType: "ready_for_review", dossierId: input.dossierId } });
    revalidate(input.dossierId);
  }
  return asResult(res);
}

export async function markNavetteReadAction(id: string): Promise<NavetteActionResult> {
  const { cabinetId, userId } = await requireCabinetAndUser();
  const res = await markNavetteRead(id, cabinetId, userId);
  return res.ok ? { ok: true } : { ok: false, error: "Message introuvable." };
}

export async function resolveNavetteAction(id: string, dossierId: string): Promise<NavetteActionResult> {
  const { cabinetId, userId } = await requireCabinetAndUser();
  const res = await resolveNavetteMessage(id, cabinetId, userId);
  if (res.ok) revalidate(dossierId);
  return res.ok ? { ok: true } : { ok: false, error: "Message introuvable." };
}
