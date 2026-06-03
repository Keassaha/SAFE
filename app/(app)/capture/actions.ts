"use server";

import { revalidatePath } from "next/cache";
import { requireCabinetAndUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { createAuditLog } from "@/lib/services/audit";
import { sanitizeInput } from "@/lib/utils/sanitize";

export interface CaptureMatter {
  id: string;
  label: string;
}

/** Dossiers actifs du cabinet (pour le sélecteur de la capture rapide). */
export async function getActiveMatters(): Promise<CaptureMatter[]> {
  const { cabinetId } = await requireCabinetAndUser();
  const dossiers = await prisma.dossier.findMany({
    where: { cabinetId, statut: { in: ["ouvert", "actif", "en_attente"] } },
    select: { id: true, intitule: true, numeroDossier: true },
    orderBy: { updatedAt: "desc" },
    take: 100,
  });
  return dossiers.map((d) => ({
    id: d.id,
    label: d.numeroDossier?.trim() ? `${d.numeroDossier} — ${d.intitule}` : d.intitule,
  }));
}

export type QuickTaskResult = { ok: true } | { ok: false; error: string };

/** Crée une tâche rapide sur un dossier, assignée à l'utilisateur courant. */
export async function createQuickTask(input: {
  dossierId: string;
  titre: string;
}): Promise<QuickTaskResult> {
  const { cabinetId, userId } = await requireCabinetAndUser();
  const titre = sanitizeInput(input.titre ?? "").trim();
  if (!titre) return { ok: false, error: "Titre vide." };

  const dossier = await prisma.dossier.findFirst({
    where: { id: input.dossierId, cabinetId },
    select: { id: true },
  });
  if (!dossier) return { ok: false, error: "Dossier introuvable." };

  const task = await prisma.dossierTache.create({
    data: { dossierId: dossier.id, titre, assigneeId: userId },
    select: { id: true },
  });

  await createAuditLog({
    cabinetId,
    userId,
    entityType: "Dossier",
    entityId: dossier.id,
    action: "create",
    metadata: { quickTaskId: task.id, titre },
  });

  revalidatePath("/aujourdhui");
  revalidatePath(`/dossiers/${dossier.id}`);
  return { ok: true };
}
