"use server";

import { revalidatePath } from "next/cache";
import { requireCabinetAndUser } from "@/lib/auth/session";
import { canEditBillingTrust } from "@/lib/auth/permissions";
import type { UserRole } from "@prisma/client";
import {
  recordClientNotice,
  releaseTrustProperty,
} from "@/lib/services/fideicommis/trust-property-service";

/**
 * Actions de l'écran des autres biens.
 *
 * Art. 43 à 46 B-1 r.5 · s. 18(9) By-Law 9.
 *
 * La PRISE DE POSSESSION n'est pas ici : l'art. 43 impose l'inscription « dès
 * réception », donc au moment du geste, depuis l'écran du dossier. Un bien saisi
 * après coup depuis un écran de conformité serait déjà en retard.
 */

export type ActionResult = { ok: true } | { ok: false; error: string };

const PATH = "/comptes/autres-biens";

async function guard() {
  const { cabinetId, userId, role } = await requireCabinetAndUser();
  if (!canEditBillingTrust(role as UserRole)) {
    throw new Error("Vous n'avez pas le droit de modifier le fidéicommis.");
  }
  return { cabinetId, userId };
}

function fail(e: unknown): ActionResult {
  return { ok: false, error: e instanceof Error ? e.message : "Une erreur est survenue." };
}

/** Art. 44 et 45 — le client a été informé (bien reçu d'un tiers, ou lieu de garde). */
export async function recordNoticeAction(formData: FormData): Promise<ActionResult> {
  try {
    const { cabinetId, userId } = await guard();
    const propertyId = String(formData.get("propertyId") ?? "");
    const raw = String(formData.get("noticeDate") ?? "").trim();
    // THIRD_PARTY = art. 44 (le bien vient d'un tiers) · STORAGE = art. 45 (lieu de
    // garde). Deux obligations distinctes, donc deux avis distincts.
    const kind = String(formData.get("kind") ?? "") as "THIRD_PARTY" | "STORAGE";

    if (kind !== "THIRD_PARTY" && kind !== "STORAGE") {
      return { ok: false, error: "Précisez de quel avis il s'agit." };
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
      return { ok: false, error: "Précisez la date à laquelle vous avez informé le client." };
    }

    await recordClientNotice({
      cabinetId,
      propertyId,
      kind,
      notifiedAt: new Date(`${raw}T12:00:00.000Z`),
      userId,
    });

    revalidatePath(PATH);
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

/** Art. 43 — remise du bien : date et destinataire, tous deux obligatoires. */
export async function releasePropertyAction(formData: FormData): Promise<ActionResult> {
  try {
    const { cabinetId, userId } = await guard();
    const propertyId = String(formData.get("propertyId") ?? "");
    const releasedToName = String(formData.get("releasedToName") ?? "").trim();
    const raw = String(formData.get("releasedAt") ?? "").trim();

    if (!releasedToName) {
      return {
        ok: false,
        error:
          "Nommez la personne à qui le bien est remis. L'article 43 l'exige au registre, et une remise sans destinataire ne se justifie pas.",
      };
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
      return { ok: false, error: "Précisez la date de la remise." };
    }

    await releaseTrustProperty({
      cabinetId,
      propertyId,
      releasedToName,
      releasedAt: new Date(`${raw}T12:00:00.000Z`),
      userId,
    });

    revalidatePath(PATH);
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}
