"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireCabinetAndUser } from "@/lib/auth/session";
import { isSafeIncCabinet } from "@/lib/safe-inc";
import type { StageLead } from "@prisma/client";

const VALID_STAGES: StageLead[] = [
  "AWARENESS",
  "ENGAGED",
  "CONTACTED",
  "CONVERSING",
  "LEAD_MAGNET_SENT",
  "AUDIT_PROPOSED",
  "AUDIT_SCHEDULED",
  "AUDIT_COMPLETED",
  "CONSULTATION_PHASE2",
  "READY_TO_SIGN",
  "SIGNED",
  "ACTIVATION_IN_PROGRESS",
  "LIVE",
  "AMBASSADOR",
];

/**
 * Update le stage d'un Lead suite à un drag-and-drop dans le pipeline.
 * Garde-fous : auth + cabinet SAFE Inc. + stage valide + lead existant.
 */
export async function updateLeadStage(
  leadId: string,
  newStage: StageLead,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const { cabinetId } = await requireCabinetAndUser();

    const isSafe = await isSafeIncCabinet(cabinetId);
    if (!isSafe) {
      return { ok: false, error: "Accès non autorisé" };
    }

    if (!VALID_STAGES.includes(newStage)) {
      return { ok: false, error: "Stage invalide" };
    }

    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      select: { id: true, stageLead: true },
    });
    if (!lead) {
      return { ok: false, error: "Lead introuvable" };
    }

    if (lead.stageLead === newStage) {
      return { ok: true };
    }

    await prisma.lead.update({
      where: { id: leadId },
      data: { stageLead: newStage, dateDerniereActivite: new Date() },
    });

    revalidatePath("/console/pipeline");
    revalidatePath("/console/leads");
    revalidatePath(`/console/leads/${leadId}`);

    return { ok: true };
  } catch (err) {
    console.error("updateLeadStage error", err);
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Erreur inconnue",
    };
  }
}
