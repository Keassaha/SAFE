"use server";

/**
 * SAFE — Actions serveur de la file assistante.
 *
 * Doctrine: docs/product/ACTIVE_ASSISTANT_LAYER.md
 */

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireCabinetAndUser } from "@/lib/auth/session";
import { canAssignSelfAsAssistant } from "@/lib/auth/permissions";
import { createAuditLog } from "@/lib/services/audit";
import { loadDossierPreparationSnapshot } from "@/lib/dossiers/preparation-loader";
import { getDossierPreparationStatus } from "@/lib/dossiers/preparation-status";
import {
  detectAndEmitIfReady,
  markSignalRead,
} from "@/lib/services/ready-for-review-service";
import type { UserRole } from "@prisma/client";

export type AssignToSelfResult =
  | { ok: true; alreadyAssigned: boolean }
  | { ok: false; error: "forbidden" | "not_found" | "already_taken" };

/**
 * Prend en charge un dossier en s'assignant comme `assistantJuridiqueId`.
 *
 * Sécurité:
 *   - RBAC: `assistante | admin_cabinet` uniquement.
 *   - Cabinet: le dossier doit appartenir au cabinet de l'utilisateur courant.
 *
 * Idempotence:
 *   - Si l'utilisateur est déjà assigné → no-op `{ ok: true, alreadyAssigned: true }`.
 *   - Si un autre utilisateur est déjà assigné:
 *       - `admin_cabinet` peut écraser (cas de réaffectation).
 *       - `assistante` reçoit `error: "already_taken"`.
 */
export async function assignDossierToSelf(dossierId: string): Promise<AssignToSelfResult> {
  const { cabinetId, userId, role } = await requireCabinetAndUser();

  if (!canAssignSelfAsAssistant(role as UserRole)) {
    return { ok: false, error: "forbidden" };
  }

  const dossier = await prisma.dossier.findFirst({
    where: { id: dossierId, cabinetId },
    select: { id: true, assistantJuridiqueId: true },
  });

  if (!dossier) {
    return { ok: false, error: "not_found" };
  }

  // Idempotence: déjà à moi
  if (dossier.assistantJuridiqueId === userId) {
    return { ok: true, alreadyAssigned: true };
  }

  // Déjà assigné à quelqu'un d'autre: bloquer pour l'assistante, autoriser l'admin.
  if (
    dossier.assistantJuridiqueId &&
    dossier.assistantJuridiqueId !== userId &&
    role !== "admin_cabinet"
  ) {
    return { ok: false, error: "already_taken" };
  }

  // Capture l'état AVANT modification pour détecter une éventuelle transition
  // vers `pret_pour_revue` (l'assistante manquante était peut-être le seul
  // manquant restant — l'auto-assignation peut donc rendre le dossier prêt).
  const beforeSnap = await loadDossierPreparationSnapshot(
    cabinetId,
    dossier.id,
    { callerUserId: userId },
  );
  const beforeState = beforeSnap ? getDossierPreparationStatus(beforeSnap).state : null;

  await prisma.dossier.update({
    where: { id: dossier.id },
    data: { assistantJuridiqueId: userId },
  });

  await createAuditLog({
    cabinetId,
    userId,
    entityType: "Dossier",
    entityId: dossier.id,
    action: "update",
    metadata: { assistantJuridiqueId: userId, source: "assistant_queue_self_assign" },
  });

  // Doctrine: docs/product/READY_FOR_REVIEW_SIGNAL.md
  // Émet le signal si la transition vers `pret_pour_revue` est observée.
  await detectAndEmitIfReady(cabinetId, dossier.id, {
    beforeState,
    callerUserId: userId,
  });

  revalidatePath("/gestion/assistante");
  revalidatePath(`/dossiers/${dossier.id}`);
  revalidatePath("/dossiers");
  revalidatePath("/tableau-de-bord");

  return { ok: true, alreadyAssigned: false };
}

/* ═════════════════════ Marquage signal "vu" ═════════════════════ */

export type MarkReadyForReviewReadResult =
  | { ok: true; alreadyRead: boolean }
  | { ok: false; error: "not_found" | "forbidden" };

/**
 * Marque un signal "prêt pour revue" comme lu par l'utilisateur courant.
 * Accessible aux avocats, admin, et au destinataire d'un signal sans avocat.
 */
export async function markReadyForReviewRead(signalId: string): Promise<MarkReadyForReviewReadResult> {
  const { cabinetId, userId, role } = await requireCabinetAndUser();
  const isAdmin = role === "admin_cabinet";

  const result = await markSignalRead(signalId, cabinetId, userId, isAdmin);

  if (result.ok) {
    revalidatePath("/tableau-de-bord");
  }

  return result;
}
