"use server";

import { revalidatePath } from "next/cache";
import { requireCabinetAndUser } from "@/lib/auth/session";
import { canEditBillingTrust } from "@/lib/auth/permissions";
import type { UserRole } from "@prisma/client";
import {
  certifyAnnualReport,
  generateAnnualReport,
  markAnnualReportSubmitted,
} from "@/lib/services/fideicommis/annual-report-service";

/**
 * Actions du rapport comptable annuel.
 *
 * Art. 42 B-1 r.5 : « au moins une fois par an et dans les 30 jours suivant la
 * réception d'une demande par le directeur de l'inspection professionnelle […] sur le
 * formulaire prescrit par le Comité exécutif, un rapport comptable annuel couvrant la
 * période de 12 mois identifiée dans la demande. »
 *
 * ⚠️ QUÉBEC SEULEMENT. Le service refuse de s'exécuter hors Québec : By-Law 9, lu
 * intégralement, n'impose aucun rapport annuel. Ses obligations périodiques s'arrêtent
 * à la comparaison mensuelle.
 */

export type ActionResult = { ok: true; id?: string } | { ok: false; error: string };

const PATH = "/inspection/rapport-annuel";

async function guard() {
  const { cabinetId, userId, role } = await requireCabinetAndUser();
  if (!canEditBillingTrust(role as UserRole)) {
    throw new Error("Vous n'avez pas le droit de modifier la comptabilité en fidéicommis.");
  }
  return { cabinetId, userId };
}

function fail(e: unknown): ActionResult {
  return { ok: false, error: e instanceof Error ? e.message : "Une erreur est survenue." };
}

const jour = (v: string) => /^\d{4}-\d{2}-\d{2}$/.test(v);

/**
 * Produit le rapport d'une période de douze mois.
 *
 * La date de la demande est FACULTATIVE, et c'est voulu : sans demande du directeur,
 * il n'y a pas d'échéance, seulement l'obligation de rendre compte « au moins une fois
 * par an ». Calculer un délai en son absence inventerait une date que le texte ne pose
 * pas.
 */
export async function generateAnnualReportAction(formData: FormData): Promise<ActionResult> {
  try {
    const { cabinetId, userId } = await guard();

    const periodStart = String(formData.get("periodStart") ?? "").trim();
    const trustBankAccountId = String(formData.get("trustBankAccountId") ?? "").trim();
    const raw = String(formData.get("bankStatementBalance") ?? "").replace(",", ".").trim();
    const demande = String(formData.get("requestReceivedAt") ?? "").trim();

    if (!/^\d{4}-\d{2}$/.test(periodStart)) {
      return { ok: false, error: "Choisissez le premier mois de la période de douze mois." };
    }
    if (!trustBankAccountId) {
      return { ok: false, error: "Choisissez le compte en fidéicommis." };
    }
    if (raw === "" || Number.isNaN(Number(raw))) {
      return {
        ok: false,
        error:
          "Inscrivez le solde de fin de période qui figure au relevé. C'est la seule donnée que SAFE ne peut pas calculer.",
      };
    }

    const report = await generateAnnualReport({
      cabinetId,
      trustBankAccountId,
      periodStart,
      bankStatementBalance: Number(raw),
      requestReceivedAt: demande && jour(demande) ? new Date(`${demande}T12:00:00.000Z`) : null,
      userId,
    });

    revalidatePath(PATH);
    return { ok: true, id: (report as { id?: string })?.id };
  } catch (e) {
    return fail(e);
  }
}

/** Certifie le rapport. Le service refuse si les douze mensuels ne le sont pas. */
export async function certifyAnnualReportAction(formData: FormData): Promise<ActionResult> {
  try {
    const { cabinetId, userId } = await guard();
    await certifyAnnualReport({
      cabinetId,
      annualReportId: String(formData.get("reportId") ?? ""),
      certifiedById: userId,
    });
    revalidatePath(PATH);
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

/**
 * Consigne la transmission au directeur de l'inspection professionnelle.
 *
 * ⚠️ SAFE NE TRANSMET RIEN. Le rapport se transmet sur le formulaire prescrit par le
 * Comité exécutif, que SAFE n'a pas obtenu (dépendance externe E-1). Prétendre l'avoir
 * envoyé serait doublement faux : le geste n'est pas fait, et la forme n'est pas connue.
 */
export async function markSubmittedAction(formData: FormData): Promise<ActionResult> {
  try {
    const { cabinetId, userId } = await guard();
    const raw = String(formData.get("submittedAt") ?? "").trim();

    if (!jour(raw)) {
      return { ok: false, error: "Précisez la date à laquelle vous avez transmis le rapport." };
    }

    await markAnnualReportSubmitted({
      cabinetId,
      annualReportId: String(formData.get("reportId") ?? ""),
      submittedAt: new Date(`${raw}T12:00:00.000Z`),
      userId,
    });

    revalidatePath(PATH);
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}
