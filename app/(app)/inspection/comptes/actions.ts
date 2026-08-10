"use server";

import { revalidatePath } from "next/cache";
import { requireCabinetAndUser } from "@/lib/auth/session";
import { canEditBillingTrust } from "@/lib/auth/permissions";
import type { UserRole } from "@prisma/client";
import type { TrustBankAccountViolation } from "@/lib/compliance/trust-bank-account";
import {
  TrustBankAccountInvalidError,
  closeTrustBankAccount,
  confirmBarreauAgreement,
  openTrustBankAccount,
  recordPostOpeningDuty,
} from "@/lib/services/fideicommis/trust-bank-account-service";

/**
 * Déclaration des comptes en fidéicommis.
 *
 * Art. 50, 51, 62 à 68 B-1 r.5 · s. 7, 8 By-Law 9.
 *
 * ⚠️ POURQUOI CET ÉCRAN EXISTE. Le service `openTrustBankAccount` était livré depuis
 * CH-01, et n'était appelé QUE depuis un script de démonstration. Aucun cabinet ne
 * pouvait déclarer son compte. Les onze écrans d'inspection affichaient donc tous
 * « Aucun compte en fidéicommis n'est enregistré », pour toujours.
 *
 * C'est la marche zéro : sans elle, tout le programme reste hors de portée.
 */

export type ActionResult =
  | { ok: true; id?: string; warnings?: TrustBankAccountViolation[] }
  | { ok: false; error: string; violations?: TrustBankAccountViolation[] };

const PATH = "/inspection/comptes";

const jour = (v: string) => /^\d{4}-\d{2}-\d{2}$/.test(v);
const date = (v: string) => (jour(v) ? new Date(`${v}T12:00:00.000Z`) : null);

async function guard() {
  const { cabinetId, userId, role } = await requireCabinetAndUser();
  if (!canEditBillingTrust(role as UserRole)) {
    throw new Error("Vous n'avez pas le droit de modifier la comptabilité en fidéicommis.");
  }
  return { cabinetId, userId };
}

function fail(e: unknown): ActionResult {
  // Le refus d'ouverture porte SA LISTE COMPLÈTE de manquements. La réduire à un
  // message ferait corriger un champ à la fois, alors que le module les renvoie tous
  // ensemble précisément pour éviter ça.
  if (e instanceof TrustBankAccountInvalidError) {
    return {
      ok: false,
      error: "Ce compte ne peut pas être déclaré en l'état.",
      violations: e.violations,
    };
  }
  return { ok: false, error: e instanceof Error ? e.message : "Une erreur est survenue." };
}

/**
 * Déclare un compte en fidéicommis.
 *
 * Les manquements NON BLOQUANTS remontent en avertissements plutôt qu'en refus :
 * l'entente B-1 r.10 et l'adresse de succursale se confirment auprès de la banque en
 * plusieurs jours. Bloquer là-dessus empêcherait de saisir un compte qui existe déjà,
 * et un cabinet qui ne peut rien saisir ne saisit rien du tout.
 */
export async function openAccountAction(formData: FormData): Promise<ActionResult> {
  try {
    const { cabinetId, userId } = await guard();

    const type = String(formData.get("type") ?? "GENERAL") === "PARTICULIER" ? "PARTICULIER" : "GENERAL";
    const ouvertLe = String(formData.get("openedAt") ?? "").trim();
    const depot = String(formData.get("initialDeposit") ?? "").replace(",", ".").trim();

    const { id, warnings } = await openTrustBankAccount({
      cabinetId,
      userId,
      type,
      accountLabel: String(formData.get("accountLabel") ?? ""),
      institutionName: String(formData.get("institutionName") ?? ""),
      institutionBranch: String(formData.get("institutionBranch") ?? "").trim() || null,
      branchAddress: String(formData.get("branchAddress") ?? "").trim() || null,
      branchProvince: String(formData.get("branchProvince") ?? "").trim() || null,
      accountNumber: String(formData.get("accountNumber") ?? ""),
      barreauAgreementConfirmed: formData.get("barreauAgreementConfirmed") === "on",
      clientId: String(formData.get("clientId") ?? "").trim() || null,
      initialDeposit: depot && !Number.isNaN(Number(depot)) ? Number(depot) : null,
      openedAt: ouvertLe ? (date(ouvertLe) ?? undefined) : undefined,
    });

    revalidatePath(PATH);
    return { ok: true, id, warnings };
  } catch (e) {
    return fail(e);
  }
}

/** Consigne une démarche de l'art. 51 ou 64 accomplie. SAFE ne transmet rien. */
export async function recordDutyAction(formData: FormData): Promise<ActionResult> {
  try {
    const { cabinetId, userId } = await guard();

    const brut = String(formData.get("at") ?? "").trim();
    const at = date(brut);
    if (!at) return { ok: false, error: "Précisez la date de la démarche." };

    const duty = String(formData.get("duty") ?? "");
    if (duty !== "REGULATOR_FORM_SENT" && duty !== "CLIENT_COPY_SENT") {
      return { ok: false, error: "Démarche inconnue." };
    }

    await recordPostOpeningDuty({
      cabinetId,
      accountId: String(formData.get("accountId") ?? ""),
      duty,
      at,
      documentId: String(formData.get("documentId") ?? "").trim() || null,
      userId,
    });

    revalidatePath(PATH);
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

/** Confirme après coup l'entente B-1 r.10 de l'institution (art. 50). */
export async function confirmAgreementAction(formData: FormData): Promise<ActionResult> {
  try {
    const { cabinetId, userId } = await guard();
    await confirmBarreauAgreement({
      cabinetId,
      accountId: String(formData.get("accountId") ?? ""),
      confirmed: true,
      userId,
    });
    revalidatePath(PATH);
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

/**
 * Ferme un compte.
 *
 * Le service refuse tant que le compte détient des fonds : une fermeture masquerait
 * de l'argent client. Le compte n'est jamais supprimé, l'art. 42(7) exige la liste
 * des comptes fermés au rapport annuel.
 */
export async function closeAccountAction(formData: FormData): Promise<ActionResult> {
  try {
    const { cabinetId, userId } = await guard();

    const motif = String(formData.get("reason") ?? "").trim();
    if (!motif) {
      return {
        ok: false,
        error: "Indiquez pourquoi ce compte est fermé : le motif figure au rapport annuel.",
      };
    }

    const ferme = String(formData.get("closedAt") ?? "").trim();

    await closeTrustBankAccount({
      cabinetId,
      accountId: String(formData.get("accountId") ?? ""),
      userId,
      reason: motif,
      closedAt: ferme ? (date(ferme) ?? undefined) : undefined,
    });

    revalidatePath(PATH);
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}
