"use server";

import { revalidatePath } from "next/cache";
import { requireCabinetAndUser } from "@/lib/auth/session";
import { canEditBillingTrust } from "@/lib/auth/permissions";
import type { UserRole } from "@prisma/client";
import { markDeclarationSent } from "@/lib/services/fideicommis/cash-service";

/**
 * Actions de l'écran des espèces.
 *
 * Art. 71 B-1 r.5 : dans les 30 jours d'une réception d'espèces atteignant le seuil,
 * transmettre au directeur de l'inspection professionnelle une copie du reçu et une
 * déclaration mentionnant le fondement.
 *
 * ⚠️ SAFE N'ENVOIE RIEN. Il suit l'échéance et enregistre que le cabinet a transmis.
 * Envoyer à la place de l'avocate une déclaration signée au directeur de l'inspection
 * serait poser un acte professionnel à sa place.
 */

export type ActionResult = { ok: true } | { ok: false; error: string };

const PATH = "/comptes/especes";

export async function markDeclarationSentAction(formData: FormData): Promise<ActionResult> {
  try {
    const { cabinetId, userId, role } = await requireCabinetAndUser();
    if (!canEditBillingTrust(role as UserRole)) {
      return { ok: false, error: "Vous n'avez pas le droit de modifier le fidéicommis." };
    }

    const receiptId = String(formData.get("receiptId") ?? "");
    const raw = String(formData.get("sentAt") ?? "").trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
      return { ok: false, error: "Précisez la date à laquelle vous avez transmis la déclaration." };
    }

    await markDeclarationSent({
      cabinetId,
      cashReceiptId: receiptId,
      sentAt: new Date(`${raw}T12:00:00.000Z`),
      userId,
    });

    revalidatePath(PATH);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Une erreur est survenue." };
  }
}
