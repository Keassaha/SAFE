"use server";

import { revalidatePath } from "next/cache";
import { requireCabinetAndUser } from "@/lib/auth/session";
import { canEditBillingTrust } from "@/lib/auth/permissions";
import type { UserRole } from "@prisma/client";
import type { RemediationSource } from "@/lib/compliance/trust-shortfall";
import {
  detectShortfalls,
  recordRemediation,
} from "@/lib/services/fideicommis/trust-shortfall-service";

/**
 * Actions de l'écran des soldes débiteurs.
 *
 * Art. 60 B-1 r.5 : combler SANS DÉLAI tout solde débiteur, quelle qu'en soit la
 * raison. s. 14 By-Law 9 : maintenir des soldes suffisants en tout temps.
 *
 * Aucune règle ici : tout est délégué au service, qui porte les articles.
 */

export type ActionResult = { ok: true } | { ok: false; error: string };

const PATH = "/comptes/soldes-debiteurs";

const SOURCES: RemediationSource[] = [
  "CABINET_OPERATING",
  "CLIENT_DEPOSIT",
  "LEDGER_CORRECTION",
];

function fail(e: unknown): ActionResult {
  return { ok: false, error: e instanceof Error ? e.message : "Une erreur est survenue." };
}

/**
 * Relance la détection.
 *
 * Elle tourne déjà à chaque écriture. Ce bouton sert au cabinet qui veut vérifier
 * maintenant, sans attendre le prochain mouvement.
 */
export async function refreshShortfallsAction(): Promise<ActionResult> {
  try {
    const { cabinetId, role } = await requireCabinetAndUser();
    if (!canEditBillingTrust(role as UserRole)) {
      return { ok: false, error: "Vous n'avez pas le droit de modifier le fidéicommis." };
    }
    await detectShortfalls({ cabinetId });
    revalidatePath(PATH);
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

/**
 * Consigne le comblement d'un découvert.
 *
 * ⚠️ N'EFFECTUE PAS LE DÉPÔT. Celui-ci passe par l'écran des comptes et ses propres
 * garde-fous. Les fusionner contournerait les contrôles du dépôt, ce qu'un écran de
 * conformité ne doit pas faire.
 */
export async function recordRemediationAction(formData: FormData): Promise<ActionResult> {
  try {
    const { cabinetId, userId, role } = await requireCabinetAndUser();
    if (!canEditBillingTrust(role as UserRole)) {
      return { ok: false, error: "Vous n'avez pas le droit de modifier le fidéicommis." };
    }

    const shortfallId = String(formData.get("shortfallId") ?? "");
    const source = String(formData.get("source") ?? "") as RemediationSource;
    const note = String(formData.get("note") ?? "").trim();

    if (!SOURCES.includes(source)) {
      return { ok: false, error: "Précisez d'où viennent les fonds qui comblent ce découvert." };
    }

    await recordRemediation({
      cabinetId,
      shortfallId,
      source,
      note: note || null,
      userId,
    });

    revalidatePath(PATH);
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}
