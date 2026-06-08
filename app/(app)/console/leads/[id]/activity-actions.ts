"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireCabinetAndUser } from "@/lib/auth/session";
import { isSafeIncCabinet } from "@/lib/safe-inc";
import { recomputeLeadScore } from "@/lib/services/crm/scoring";
import type { TypeActivity, CrmDirection } from "@prisma/client";

const VALID_TYPES: TypeActivity[] = [
  "LINKEDIN_LIKE",
  "LINKEDIN_COMMENT",
  "LINKEDIN_SHARE",
  "LINKEDIN_DM",
  "EMAIL_ENVOYE",
  "EMAIL_RECU",
  "EMAIL_OUVERT",
  "EMAIL_CLIQUE",
  "EMAIL_BOUNCE",
  "CALL",
  "MEETING",
  "DEMO",
  "NOTE",
  "AUDIT_SOUMIS",
  "BUNDLE_PROPOSE",
  "CONTRAT_SIGNE",
  "GO_LIVE",
  "CHURN_SIGNAL",
];
const VALID_DIRECTIONS: CrmDirection[] = ["INBOUND", "OUTBOUND", "INTERNAL"];

export type CreateActivityResult =
  | { ok: true }
  | { ok: false; error: string };

/**
 * Logge une activité (DM, appel, note, etc.) sur un Lead et recalcule son score.
 */
export async function createActivity(
  formData: FormData,
): Promise<CreateActivityResult> {
  try {
    const { cabinetId, userId } = await requireCabinetAndUser();
    if (!(await isSafeIncCabinet(cabinetId))) {
      return { ok: false, error: "Accès réservé à SAFE Inc." };
    }

    const leadId = String(formData.get("leadId") || "");
    const type = String(formData.get("type") || "") as TypeActivity;
    const direction = String(formData.get("direction") || "") as CrmDirection;
    const sujet = String(formData.get("sujet") || "").trim();
    const contenu = String(formData.get("contenu") || "").trim();

    if (!leadId) return { ok: false, error: "Lead manquant" };
    if (!VALID_TYPES.includes(type)) return { ok: false, error: "Type invalide" };
    if (!VALID_DIRECTIONS.includes(direction)) {
      return { ok: false, error: "Direction invalide" };
    }

    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      select: { id: true },
    });
    if (!lead) return { ok: false, error: "Lead introuvable" };

    await prisma.activity.create({
      data: {
        leadId,
        type,
        direction,
        sujet: sujet || null,
        contenu: contenu || null,
        createdBy: userId,
      },
    });

    await prisma.lead.update({
      where: { id: leadId },
      data: { dateDerniereActivite: new Date() },
    });

    // Recalcule le score (l'engagement peut avoir changé)
    await recomputeLeadScore(leadId);

    revalidatePath(`/console/leads/${leadId}`);
    revalidatePath("/console/leads");
    revalidatePath("/console/pipeline");

    return { ok: true };
  } catch (err) {
    console.error("createActivity error", err);
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Erreur inconnue",
    };
  }
}
