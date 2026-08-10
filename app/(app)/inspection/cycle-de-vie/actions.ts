"use server";

import { revalidatePath } from "next/cache";
import { requireCabinetAndUser } from "@/lib/auth/session";
import { canManageCabinetSettings, canManageDocuments } from "@/lib/auth/permissions";
import type { UserRole } from "@prisma/client";
import {
  recordClientOriginal,
  setSuccessionPlan,
} from "@/lib/services/compliance/practice-lifecycle-service";

/**
 * Actions du cycle de vie du cabinet.
 *
 * Art. 19 (originaux du client) et art. 78 (cessionnaire désigné) B-1 r.5.
 *
 * Deux gardes DIFFÉRENTES, et c'est voulu : désigner un cessionnaire engage le cabinet
 * entier et relève de l'administration ; marquer un original appartient à la gestion
 * documentaire. Une garde unique aurait obligé à élargir l'une des deux.
 */

export type ActionResult = { ok: true } | { ok: false; error: string };

const PATH = "/inspection/cycle-de-vie";

function fail(e: unknown): ActionResult {
  return { ok: false, error: e instanceof Error ? e.message : "Une erreur est survenue." };
}

const jour = (v: string) => /^\d{4}-\d{2}-\d{2}$/.test(v);
const date = (v: string) => (jour(v) ? new Date(`${v}T12:00:00.000Z`) : null);

/** Désigne le cessionnaire de l'art. 78. */
export async function setSuccessionPlanAction(formData: FormData): Promise<ActionResult> {
  try {
    const { cabinetId, userId, role } = await requireCabinetAndUser();
    if (!canManageCabinetSettings(role as UserRole)) {
      return {
        ok: false,
        error: "Seul un administrateur du cabinet peut désigner le cessionnaire.",
      };
    }

    const nom = String(formData.get("successorName") ?? "").trim();
    if (!nom) {
      return {
        ok: false,
        error:
          "Nommez le cessionnaire. L'art. 75 impose une cession à un avocat en exercice : un plan sans nom ne désigne personne.",
      };
    }

    const confirme = String(formData.get("successorConfirmedAt") ?? "").trim();

    await setSuccessionPlan({
      cabinetId,
      successorName: nom,
      successorBarreauNo: String(formData.get("successorBarreauNo") ?? "").trim() || null,
      successorEmail: String(formData.get("successorEmail") ?? "").trim() || null,
      successorPhone: String(formData.get("successorPhone") ?? "").trim() || null,
      successorConfirmedAt: confirme ? date(confirme) : null,
      notes: String(formData.get("notes") ?? "").trim() || null,
      userId,
    });

    revalidatePath(PATH);
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

/**
 * Marque un document comme original du client, ou consigne une porte de sortie.
 *
 * Les deux portes de l'art. 19 sont ALTERNATIVES, jamais cumulatives : l'autorisation
 * du client suffit, le retour offert suffit. Exiger les deux bloquerait des
 * destructions que le règlement permet, et un garde-fou plus strict que le texte finit
 * par être contourné.
 */
export async function recordClientOriginalAction(formData: FormData): Promise<ActionResult> {
  try {
    const { cabinetId, userId, role } = await requireCabinetAndUser();
    if (!canManageDocuments(role as UserRole)) {
      return {
        ok: false,
        error: "Vous n'avez pas le droit de modifier les documents du cabinet.",
      };
    }

    const documentId = String(formData.get("documentId") ?? "").trim();
    if (!documentId) return { ok: false, error: "Choisissez le document." };

    const autorise = String(formData.get("clientAuthorizedDestroyAt") ?? "").trim();
    const retour = String(formData.get("returnOfferedAt") ?? "").trim();

    await recordClientOriginal({
      cabinetId,
      documentId,
      isClientOriginal: String(formData.get("isClientOriginal") ?? "") !== "0",
      clientAuthorizedDestroyAt: autorise ? date(autorise) : null,
      returnOfferedAt: retour ? date(retour) : null,
      note: String(formData.get("note") ?? "").trim() || null,
      userId,
    });

    revalidatePath(PATH);
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}
