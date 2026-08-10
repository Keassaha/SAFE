"use server";

import { revalidatePath } from "next/cache";
import { requireCabinetAndUser } from "@/lib/auth/session";
import { canEditBillingTrust } from "@/lib/auth/permissions";
import type { UserRole } from "@prisma/client";
import {
  countersignTransferConfirmation,
  createTransferRequisition,
  recordTransferConfirmation,
  recordTransferExecution,
} from "@/lib/services/fideicommis/electronic-transfer-service";

/**
 * Actions des virements électroniques — By-Law 9, s. 12.
 *
 * ⚠️ ONTARIO SEULEMENT. Les services refusent de s'exécuter hors Ontario, et c'est le
 * point le plus important du chantier : B-1 r.5 n'a AUCUN équivalent de la s. 12.
 * L'art. 58 permet le virement vers un compte non fiduciaire ouvert au nom de
 * l'avocat, sans réquisition, sans double contrôle, sans formulaire prescrit. Imposer
 * le Form 9A à un cabinet québécois inventerait une obligation, faute aussi grave que
 * d'en omettre une.
 */

export type ActionResult = { ok: true; id?: string } | { ok: false; error: string };

const PATH = "/inspection/virements";

function fail(e: unknown): ActionResult {
  return { ok: false, error: e instanceof Error ? e.message : "Une erreur est survenue." };
}

const horodatage = (v: string): Date | null => {
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(v)) return new Date(v);
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return new Date(`${v}T12:00:00.000Z`);
  return null;
};

async function guard() {
  const { cabinetId, userId, role } = await requireCabinetAndUser();
  if (!canEditBillingTrust(role as UserRole)) {
    throw new Error("Vous n'avez pas le droit de modifier la comptabilité en fidéicommis.");
  }
  return { cabinetId, userId };
}

/**
 * Crée la réquisition signée du Form 9A.
 *
 * Elle est un OBJET DISTINCT, créé en premier, jamais un champ de la transaction : la
 * s. 12(2)4 exige qu'elle soit signée avant toute saisie dans le système de virement,
 * et cet ordre est vérifié. Une réquisition signée après coup régularise, elle ne
 * vérifie rien.
 */
export async function createRequisitionAction(formData: FormData): Promise<ActionResult> {
  try {
    const { cabinetId, userId } = await guard();

    const brut = String(formData.get("signedAt") ?? "").trim();
    const signedAt = horodatage(brut);
    if (!signedAt) return { ok: false, error: "Précisez la date et l'heure de la signature." };

    const montant = Number(String(formData.get("amount") ?? "").replace(",", ".").trim());
    if (!Number.isFinite(montant) || montant <= 0) {
      return { ok: false, error: "Le montant du virement doit être positif." };
    }

    const requis: [string, string][] = [
      ["clientName", "le nom du client"],
      ["recipientName", "le nom du destinataire"],
      ["recipientInstitution", "l'institution destinataire"],
      ["recipientAccountNumber", "le numéro de compte destinataire"],
      ["purpose", "l'objet du virement"],
    ];
    for (const [champ, libelle] of requis) {
      if (!String(formData.get(champ) ?? "").trim()) {
        return { ok: false, error: `Le formulaire 9A exige ${libelle}.` };
      }
    }

    const created = await createTransferRequisition({
      cabinetId,
      trustBankAccountId: String(formData.get("trustBankAccountId") ?? ""),
      signedByUserId: userId,
      signedAt,
      clientName: String(formData.get("clientName") ?? "").trim(),
      dossierRef: String(formData.get("dossierRef") ?? "").trim() || null,
      amount: montant,
      recipientName: String(formData.get("recipientName") ?? "").trim(),
      recipientInstitution: String(formData.get("recipientInstitution") ?? "").trim(),
      recipientBranch: String(formData.get("recipientBranch") ?? "").trim() || null,
      recipientBranchAddress: String(formData.get("recipientBranchAddress") ?? "").trim() || null,
      recipientAccountNumber: String(formData.get("recipientAccountNumber") ?? "").trim(),
      purpose: String(formData.get("purpose") ?? "").trim(),
      formType: (String(formData.get("formType") ?? "9A") as "9A" | "9B" | "9C") || "9A",
    });

    revalidatePath(PATH);
    return { ok: true, id: created.id };
  } catch (e) {
    return fail(e);
  }
}

/** Consigne la saisie et l'autorisation, et vérifie le double contrôle de la s. 12(2)1. */
export async function recordExecutionAction(formData: FormData): Promise<ActionResult> {
  try {
    const { cabinetId, userId } = await guard();

    const saisieLe = horodatage(String(formData.get("dataEnteredAt") ?? "").trim());
    const autoriseLe = horodatage(String(formData.get("authorizedAt") ?? "").trim());
    if (!saisieLe || !autoriseLe) {
      return { ok: false, error: "Précisez quand la saisie et l'autorisation ont eu lieu." };
    }

    const autorisePar = String(formData.get("authorizedByUserId") ?? "").trim();
    if (!autorisePar) {
      return { ok: false, error: "Indiquez qui a autorisé le virement." };
    }

    await recordTransferExecution({
      cabinetId,
      requisitionId: String(formData.get("requisitionId") ?? ""),
      dataEnteredByUserId: String(formData.get("dataEnteredByUserId") ?? "") || userId,
      dataEnteredAt: saisieLe,
      authorizedByUserId: autorisePar,
      authorizedAt: autoriseLe,
      userId,
    });

    revalidatePath(PATH);
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

/**
 * Enregistre la confirmation de l'institution.
 *
 * Les éléments manquants sont SIGNALÉS, jamais bloquants : la confirmation vient de la
 * banque, le cabinet ne la fabrique pas. Refuser de l'enregistrer parce qu'elle est
 * incomplète priverait le dossier de la seule preuve disponible.
 */
export async function recordConfirmationAction(formData: FormData): Promise<ActionResult> {
  try {
    const { cabinetId, userId } = await guard();

    const envoyeeLe = horodatage(String(formData.get("confirmationSentAt") ?? "").trim());
    if (!envoyeeLe) {
      return {
        ok: false,
        error:
          "Précisez quand l'institution a envoyé la confirmation : c'est de cette date que court la contresignature.",
      };
    }
    const recueLe = horodatage(String(formData.get("institutionReceivedAt") ?? "").trim());

    await recordTransferConfirmation({
      cabinetId,
      requisitionId: String(formData.get("requisitionId") ?? ""),
      confirmation: {
        sourceAccountNumber: String(formData.get("sourceAccountNumber") ?? "").trim() || null,
        recipientInstitution: String(formData.get("recipientInstitution") ?? "").trim() || null,
        recipientName: String(formData.get("recipientName") ?? "").trim() || null,
        recipientAccountNumber: String(formData.get("recipientAccountNumber") ?? "").trim() || null,
        institutionReceivedAt: recueLe,
        confirmationSentAt: envoyeeLe,
      },
      userId,
    });

    revalidatePath(PATH);
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

/** Les quatre gestes de la s. 12(5) : imprimer, comparer, annoter, signer et dater. */
export async function countersignAction(formData: FormData): Promise<ActionResult> {
  try {
    const { cabinetId, userId } = await guard();

    const client = String(formData.get("annotatedClientId") ?? "").trim();
    if (!client) {
      return {
        ok: false,
        error:
          "La s. 12(5)(c) exige d'indiquer le client sur la copie imprimée. Choisissez-le avant de signer.",
      };
    }

    await countersignTransferConfirmation({
      cabinetId,
      requisitionId: String(formData.get("requisitionId") ?? ""),
      countersignedByUserId: userId,
      countersignedAt: new Date(),
      annotatedClientId: client,
      annotatedDossierId: String(formData.get("annotatedDossierId") ?? "").trim() || null,
    });

    revalidatePath(PATH);
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}
