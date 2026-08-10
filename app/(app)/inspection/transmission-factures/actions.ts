"use server";

import { revalidatePath } from "next/cache";
import { requireCabinetAndUser } from "@/lib/auth/session";
import { canManageInvoices } from "@/lib/auth/permissions";
import type { UserRole } from "@prisma/client";
import { getSelectableDeliveryChannels } from "@/lib/compliance/invoice-delivery";
import { declareInvoiceDelivery } from "@/lib/services/billing/invoice-delivery-service";

/**
 * Déclaration de transmission d'une facture — art. 56(2) B-1 r.5 · s. 9(1)3 By-Law 9.
 *
 * C'est LA PORTE DE SORTIE du garde-fou de retrait. Le règlement autorise à se payer
 * sur les sommes « pour lesquelles la facturation a été envoyée » : émettre ne suffit
 * pas. Mais un cabinet qui poste ses factures ou les remet en main propre transmet
 * réellement, et SAFE n'en détient aucune preuve.
 *
 * Sans cette déclaration, le garde-fou serait un mur, et un mur se contourne : le
 * retrait serait saisi autrement, ce qui est pire que de l'avoir laissé passer en le
 * signalant.
 *
 * ⚠️ CE N'EST PAS UNE PREUVE. L'action consigne une déclaration : sa date, son canal,
 * et qui l'a faite. Le rapport la porte comme déclaration, jamais comme preuve.
 */

export type ActionResult = { ok: true } | { ok: false; error: string };

const PATH = "/inspection/transmission-factures";

export async function declareDeliveryAction(formData: FormData): Promise<ActionResult> {
  try {
    const { cabinetId, userId, role } = await requireCabinetAndUser();
    if (!canManageInvoices(role as UserRole)) {
      return { ok: false, error: "Vous n'avez pas le droit de modifier les factures." };
    }

    const invoiceId = String(formData.get("invoiceId") ?? "").trim();
    const canal = String(formData.get("deliveryChannel") ?? "").trim();
    const brut = String(formData.get("deliveredAt") ?? "").trim();

    if (!invoiceId) return { ok: false, error: "Facture manquante." };

    // Le canal est validé contre la liste SÉLECTIONNABLE, pas contre la liste
    // complète : « courriel envoyé depuis SAFE » est une preuve que seul l'envoi réel
    // peut poser, et « transmission présumée » appartient à la reprise d'historique.
    // Les rendre saisissables permettrait de fabriquer une preuve à la main.
    if (!getSelectableDeliveryChannels().some((c) => c.channel === canal)) {
      return { ok: false, error: "Choisissez comment la facture a été transmise." };
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(brut)) {
      return { ok: false, error: "Indiquez la date à laquelle la facture a été transmise." };
    }

    const deliveredAt = new Date(`${brut}T12:00:00.000Z`);
    if (deliveredAt.getTime() > Date.now() + 86_400_000) {
      return { ok: false, error: "Cette date est dans le futur." };
    }

    await declareInvoiceDelivery({
      cabinetId,
      invoiceId,
      deliveredAt,
      deliveryChannel: canal,
      note: String(formData.get("note") ?? "").trim() || null,
      userId,
    });

    revalidatePath(PATH);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Une erreur est survenue." };
  }
}
