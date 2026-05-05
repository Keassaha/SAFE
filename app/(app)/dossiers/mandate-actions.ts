"use server";

/**
 * SAFE — Actions serveur pour la checklist du mandat.
 *
 * Doctrine signal: docs/product/READY_FOR_REVIEW_SIGNAL.md §8.
 *
 * Cocher le dernier item obligatoire d'une checklist mandat peut faire passer
 * le dossier de `en_preparation` à `pret_pour_revue`. Cette action est le point
 * d'entrée canonique : toute UI qui modifie la checklist doit passer par ici.
 */

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireCabinetAndUser } from "@/lib/auth/session";
import { canManageDossiers } from "@/lib/auth/permissions";
import { createAuditLog } from "@/lib/services/audit";
import { loadDossierPreparationSnapshot } from "@/lib/dossiers/preparation-loader";
import { getDossierPreparationStatus } from "@/lib/dossiers/preparation-status";
import { detectAndEmitIfReady } from "@/lib/services/ready-for-review-service";
import type { Prisma, UserRole } from "@prisma/client";

interface ChecklistItem {
  label: string;
  obligatoire: boolean;
  checked: boolean;
}

export type SetMandateChecklistResult =
  | { ok: true; checked: boolean }
  | { ok: false; error: "forbidden" | "not_found" | "no_mandate" | "item_not_found" };

/**
 * Coche/décoche un item de la checklist du mandat (identifié par son label).
 *
 * - Append-only en pratique : l'opération réécrit la checklist en mémoire et
 *   la persiste, mais ne supprime pas d'item.
 * - Émet un signal `pret_pour_revue` si la transition est observée après le write.
 *   La déduplication V1 reste en charge (un seul signal non lu par dedupeKey).
 */
export async function setMandateChecklistItem(
  dossierId: string,
  label: string,
  checked: boolean,
): Promise<SetMandateChecklistResult> {
  const { cabinetId, userId, role } = await requireCabinetAndUser();
  if (!canManageDossiers(role as UserRole)) {
    return { ok: false, error: "forbidden" };
  }

  const dossier = await prisma.dossier.findFirst({
    where: { id: dossierId, cabinetId },
    select: { id: true, mandate: { select: { checklist: true } } },
  });
  if (!dossier) return { ok: false, error: "not_found" };
  if (!dossier.mandate) return { ok: false, error: "no_mandate" };

  const current = parseChecklist(dossier.mandate.checklist);
  const idx = current.findIndex((it) => it.label === label);
  if (idx < 0) return { ok: false, error: "item_not_found" };

  // No-op si l'item est déjà dans l'état souhaité.
  if (current[idx]!.checked === checked) {
    return { ok: true, checked };
  }

  // Capture l'état avant le write : un item obligatoire qui passe à `checked`
  // peut lever le manquant `checklist` et faire transiter vers `pret_pour_revue`.
  const beforeSnap = await loadDossierPreparationSnapshot(cabinetId, dossierId, {
    callerUserId: userId,
  });
  const beforeState = beforeSnap ? getDossierPreparationStatus(beforeSnap).state : null;

  const next: ChecklistItem[] = current.map((it, i) =>
    i === idx ? { ...it, checked } : it,
  );
  const nextJson = next.map((it) => ({
    label: it.label,
    obligatoire: it.obligatoire,
    checked: it.checked,
  })) as Prisma.InputJsonArray;

  await prisma.dossierMandate.update({
    where: { dossierId },
    data: { checklist: nextJson },
  });

  await createAuditLog({
    cabinetId,
    userId,
    entityType: "Dossier",
    entityId: dossierId,
    action: "update",
    metadata: { checklistItem: label, checked },
  });

  await detectAndEmitIfReady(cabinetId, dossierId, {
    beforeState,
    callerUserId: userId,
  });

  revalidatePath(`/dossiers/${dossierId}`);
  revalidatePath("/gestion/assistante");
  return { ok: true, checked };
}

function parseChecklist(raw: unknown): ChecklistItem[] {
  if (!raw) return [];
  let arr: unknown = raw;
  if (typeof raw === "string") {
    try {
      arr = JSON.parse(raw);
    } catch {
      return [];
    }
  }
  if (!Array.isArray(arr)) return [];
  return arr
    .filter((it): it is Record<string, unknown> => typeof it === "object" && it !== null)
    .map((it) => ({
      label: typeof it.label === "string" ? it.label : "",
      obligatoire: it.obligatoire === true,
      checked: it.checked === true,
    }))
    .filter((it) => it.label.length > 0);
}
