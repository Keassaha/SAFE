"use server";

import { revalidatePath } from "next/cache";
import { requireCabinetAndUser } from "@/lib/auth/session";
import { canManageCabinetSettings } from "@/lib/auth/permissions";
import { prisma } from "@/lib/db";
import { createAuditLog } from "@/lib/services/audit";
import type { UserRole } from "@prisma/client";
import { MAX_ACCESS_DAYS } from "@/lib/compliance/inspection-access";
import {
  grantInspectionAccess,
  revokeInspectionAccess,
} from "@/lib/services/compliance/inspection-access-service";

/**
 * Actions de l'accès d'inspection — art. 29 B-1 r.5.
 *
 * ⚠️ CE QUE CES ACTIONS FONT AUJOURD'HUI. Elles CONSIGNENT un accès : qui, quel
 * organisme, pour quel motif, jusqu'à quand, et sa révocation. Elles n'ouvrent aucune
 * porte : SAFE n'a pas de portail de consultation pour l'inspecteur, et le jeton
 * produit par le service n'est donc jamais affiché. Le montrer laisserait croire qu'il
 * donne accès à quelque chose.
 *
 * La consultation se fait aujourd'hui par la trousse d'inspection, que le cabinet
 * remet lui-même.
 */

export type ActionResult = { ok: true } | { ok: false; error: string };

const PATH = "/inspection/conservation";

function fail(e: unknown): ActionResult {
  return { ok: false, error: e instanceof Error ? e.message : "Une erreur est survenue." };
}

const jour = (v: string) => /^\d{4}-\d{2}-\d{2}$/.test(v);
const date = (v: string) => (jour(v) ? new Date(`${v}T12:00:00.000Z`) : null);

async function guard() {
  const { cabinetId, userId, role } = await requireCabinetAndUser();
  if (!canManageCabinetSettings(role as UserRole)) {
    throw new Error("Seul un administrateur du cabinet peut ouvrir ou fermer un accès d'inspection.");
  }
  return { cabinetId, userId };
}

/**
 * Règle la fin de l'exercice financier du cabinet.
 *
 * ⚠️ POURQUOI CE RÉGLAGE VIT ICI. La donnée est un paramètre du cabinet, mais aucun
 * écran de paramètres ne la posait, et c'est cet écran qui se bloque sans elle. Un
 * blocage qui renvoie vers une page où le champ n'existe pas ne se lève jamais.
 */
export async function setFiscalYearEndAction(formData: FormData): Promise<ActionResult> {
  try {
    const { cabinetId, userId } = await guard();

    const brut = String(formData.get("fiscalYearEnd") ?? "").trim();
    // Le champ est un `<input type="date">` : l'année saisie ne sert à rien, seul le
    // jour et le mois sont conservés. L'exercice revient chaque année.
    const m = /^\d{4}-(\d{2})-(\d{2})$/.exec(brut);
    if (!m) {
      return { ok: false, error: "Choisissez la date de fin de l'exercice financier." };
    }
    const mois = Number(m[1]);
    const jourDuMois = Number(m[2]);
    if (mois < 1 || mois > 12 || jourDuMois < 1 || jourDuMois > 31) {
      return { ok: false, error: "Cette date n'est pas valide." };
    }

    const valeur = `${String(mois).padStart(2, "0")}-${String(jourDuMois).padStart(2, "0")}`;
    const avant = await prisma.cabinet.findUnique({
      where: { id: cabinetId },
      select: { fiscalYearEnd: true },
    });

    await prisma.cabinet.update({ where: { id: cabinetId }, data: { fiscalYearEnd: valeur } });

    // Cette date décide de toutes les échéances de destruction. La changer déplace des
    // durées de conservation : la trace doit exister.
    await createAuditLog({
      cabinetId,
      userId,
      entityType: "Cabinet",
      entityId: cabinetId,
      action: "update",
      oldValues: { fiscalYearEnd: avant?.fiscalYearEnd ?? null },
      newValues: {
        type: "fiscal_year_end",
        fiscalYearEnd: valeur,
        reference: "B-1 r.5, art. 32 · By-Law 9, s. 23",
      },
      performedBy: userId,
    });

    revalidatePath(PATH);
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

/** Consigne un accès accordé à un inspecteur. */
export async function grantInspectionAccessAction(formData: FormData): Promise<ActionResult> {
  try {
    const { cabinetId, userId } = await guard();

    const brut = String(formData.get("days") ?? "").trim();
    const jours = brut === "" ? null : Number(brut);
    if (jours !== null && (!Number.isFinite(jours) || jours < 1 || jours > MAX_ACCESS_DAYS)) {
      return {
        ok: false,
        error: `La durée doit être comprise entre 1 et ${MAX_ACCESS_DAYS} jours.`,
      };
    }

    const du = String(formData.get("scopeFrom") ?? "").trim();
    const au = String(formData.get("scopeTo") ?? "").trim();

    await grantInspectionAccess({
      cabinetId,
      inspectorName: String(formData.get("inspectorName") ?? ""),
      inspectorOrganization: String(formData.get("inspectorOrganization") ?? ""),
      purpose: String(formData.get("purpose") ?? ""),
      days: jours,
      scopeFrom: du ? date(du) : null,
      scopeTo: au ? date(au) : null,
      grantedByUserId: userId,
    });

    revalidatePath(PATH);
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

/**
 * Ferme un accès avant son terme.
 *
 * La session n'est pas supprimée : son journal doit rester lisible. Un accès révoqué
 * dont l'historique disparaîtrait ne prouverait plus rien.
 */
export async function revokeInspectionAccessAction(formData: FormData): Promise<ActionResult> {
  try {
    const { cabinetId, userId } = await guard();

    await revokeInspectionAccess({
      cabinetId,
      sessionId: String(formData.get("sessionId") ?? ""),
      reason: String(formData.get("reason") ?? "").trim() || null,
      revokedByUserId: userId,
    });

    revalidatePath(PATH);
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}
