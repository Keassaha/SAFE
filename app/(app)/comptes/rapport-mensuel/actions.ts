"use server";

import { revalidatePath } from "next/cache";
import { requireCabinetAndUser } from "@/lib/auth/session";
import { canEditBillingTrust } from "@/lib/auth/permissions";
import type { UserRole } from "@prisma/client";
import {
  attachBankStatement,
  certifyMonthlyReport,
  generateMonthlyReport,
  recordDiscrepancyReason,
} from "@/lib/services/fideicommis/monthly-report-service";

/**
 * Actions de l'écran du rapport comptable mensuel.
 *
 * Art. 41 B-1 r.5 · s. 18(8) By-Law 9.
 *
 * Aucune règle réglementaire ne vit ici : tout est délégué au service, qui porte les
 * garde-fous et les articles. Ces fonctions ne font que traduire un formulaire en
 * appel de service et remonter le message d'erreur tel quel — celui du service porte
 * déjà l'article et la porte de sortie (PR-2, PR-4).
 */

export type ActionResult = { ok: true; id?: string } | { ok: false; error: string };

const PATH = "/comptes/rapport-mensuel";

async function requireTrustEditor() {
  const { cabinetId, userId, role } = await requireCabinetAndUser();
  if (!canEditBillingTrust(role as UserRole)) {
    throw new Error("Vous n'avez pas le droit de modifier la comptabilité en fidéicommis.");
  }
  return { cabinetId, userId };
}

function fail(e: unknown): ActionResult {
  return { ok: false, error: e instanceof Error ? e.message : "Une erreur est survenue." };
}

/**
 * Produit le rapport d'un mois.
 *
 * Le solde du relevé bancaire est SAISI, jamais déduit : c'est la seule donnée du
 * rapport que SAFE ne possède pas. La déduire depuis le journal rendrait la
 * comparaison de l'art. 41(5) circulaire, et l'écart serait nul par construction.
 */
export async function generateReportAction(formData: FormData): Promise<ActionResult> {
  try {
    const { cabinetId, userId } = await requireTrustEditor();

    const periode = String(formData.get("periode") ?? "").trim();
    const trustBankAccountId = String(formData.get("trustBankAccountId") ?? "").trim();
    const raw = String(formData.get("bankStatementBalance") ?? "").replace(",", ".").trim();

    if (!/^\d{4}-\d{2}$/.test(periode)) {
      return { ok: false, error: "Choisissez le mois du rapport." };
    }
    if (!trustBankAccountId) {
      return { ok: false, error: "Choisissez le compte en fidéicommis." };
    }
    if (raw === "" || Number.isNaN(Number(raw))) {
      return {
        ok: false,
        error:
          "Inscrivez le solde de fin de mois qui figure au relevé de l'institution. C'est la seule donnée que SAFE ne peut pas calculer, et l'art. 41(5) compare le journal à ce chiffre.",
      };
    }

    const depositInTransitTransactionIds = formData
      .getAll("depositInTransit")
      .map((v) => String(v))
      .filter(Boolean);

    const report = await generateMonthlyReport({
      cabinetId,
      trustBankAccountId,
      periode,
      bankStatementBalance: Number(raw),
      depositInTransitTransactionIds,
      userId,
    });

    revalidatePath(PATH);
    return { ok: true, id: (report as { id?: string })?.id };
  } catch (e) {
    return fail(e);
  }
}

/**
 * Consigne le motif d'un écart.
 *
 * Le texte n'interdit pas l'écart : l'art. 41(5) exige un état comparatif, et la
 * s. 18(8) exige « the reasons for any differences ». Un écart motivé est conforme,
 * un écart silencieux ne l'est pas.
 */
export async function recordDiscrepancyAction(formData: FormData): Promise<ActionResult> {
  try {
    const { cabinetId, userId } = await requireTrustEditor();

    const reportId = String(formData.get("reportId") ?? "");
    const kind = String(formData.get("kind") ?? "") as "BANK" | "LEDGER";
    const amount = Number(String(formData.get("amount") ?? "0").replace(",", "."));
    const explanation = String(formData.get("explanation") ?? "");

    if (kind !== "BANK" && kind !== "LEDGER") {
      return { ok: false, error: "Écart inconnu." };
    }

    await recordDiscrepancyReason({ cabinetId, reportId, kind, amount, explanation, userId });
    revalidatePath(PATH);
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

/** Rattache le relevé de l'institution (art. 41(7) / s. 18(8)). */
export async function attachBankStatementAction(formData: FormData): Promise<ActionResult> {
  try {
    const { cabinetId, userId } = await requireTrustEditor();
    const reportId = String(formData.get("reportId") ?? "");
    const documentId = String(formData.get("documentId") ?? "");

    if (!documentId) {
      return {
        ok: false,
        error: "Choisissez le relevé du mois. Un rapport sans relevé ne compare rien.",
      };
    }

    await attachBankStatement({ cabinetId, reportId, documentId, userId });
    revalidatePath(PATH);
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

/**
 * Certifie le rapport.
 *
 * Le service refuse si un bloqueur subsiste, et fige le rapport (PR-5). L'écran
 * n'anticipe pas ce refus en désactivant le bouton sans rien dire : les bloqueurs
 * sont affichés, nommés, avec leur article.
 */
export async function certifyReportAction(formData: FormData): Promise<ActionResult> {
  try {
    const { cabinetId, userId } = await requireTrustEditor();
    const reportId = String(formData.get("reportId") ?? "");

    await certifyMonthlyReport({ cabinetId, reportId, certifiedById: userId });
    revalidatePath(PATH);
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}
