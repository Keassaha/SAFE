/**
 * Service de facturation par étape (B4).
 * Dossiers immigration 6-18 mois: facturer par étape validée (préparation/soumission/suivi).
 */

import { prisma } from "@/lib/db";
import { createAuditLog } from "@/lib/services/audit";

export interface CreateBillingStagesParams {
  dossierId: string;
  cabinetId: string;
  totalForfait: number;
  stages: { nom: string; pourcentage: number }[];
  userId: string;
}

/** Create billing stages for a dossier (typically at opening). */
export async function createBillingStages(params: CreateBillingStagesParams) {
  const { dossierId, cabinetId, totalForfait, stages, userId } = params;

  // Delete existing stages if re-configuring
  await prisma.dossierBillingStage.deleteMany({ where: { dossierId } });

  const created = [];
  for (let i = 0; i < stages.length; i++) {
    const stage = stages[i];
    const montant = Math.round((totalForfait * stage.pourcentage) / 100 * 100) / 100;
    const record = await prisma.dossierBillingStage.create({
      data: {
        dossierId,
        nom: stage.nom,
        ordre: i + 1,
        montant,
        pourcentage: stage.pourcentage,
        statut: "pending",
      },
    });
    created.push(record);
  }

  await createAuditLog({
    cabinetId,
    userId,
    entityType: "Dossier",
    entityId: dossierId,
    action: "create",
    metadata: {
      type: "billing_stages",
      totalForfait,
      nbStages: stages.length,
    },
    performedBy: userId,
    performedAt: new Date(),
  });

  return created;
}

/** Mark a stage as ready to invoice. */
export async function markStageReady(params: {
  stageId: string;
  dossierId: string;
  cabinetId: string;
  userId: string;
}) {
  const { stageId, dossierId, cabinetId, userId } = params;

  const stage = await prisma.dossierBillingStage.findFirst({
    where: { id: stageId, dossierId },
  });
  if (!stage) throw new Error("Billing stage not found");
  if (stage.statut !== "pending") throw new Error("Stage is not in pending status");

  // Verify previous stages are invoiced
  const prevStages = await prisma.dossierBillingStage.findMany({
    where: { dossierId, ordre: { lt: stage.ordre } },
  });
  const allPrevInvoiced = prevStages.every((s) => s.statut === "invoiced");
  if (!allPrevInvoiced) {
    throw new Error("Previous stages must be invoiced before this stage can be marked ready");
  }

  await prisma.dossierBillingStage.update({
    where: { id: stageId },
    data: { statut: "ready" },
  });

  await createAuditLog({
    cabinetId,
    userId,
    entityType: "Dossier",
    entityId: dossierId,
    action: "update",
    metadata: { type: "billing_stage_ready", stageNom: stage.nom, ordre: stage.ordre },
    performedBy: userId,
    performedAt: new Date(),
  });
}

/** Get billing stages for a dossier. */
export async function getBillingStages(dossierId: string) {
  return prisma.dossierBillingStage.findMany({
    where: { dossierId },
    orderBy: { ordre: "asc" },
    include: {
      invoice: { select: { id: true, numero: true, statut: true, montantTotal: true } },
    },
  });
}

/** Default immigration billing stages (50/25/25 split). */
export const DEFAULT_IMMIGRATION_STAGES = [
  { nom: "File Preparation", pourcentage: 50 },
  { nom: "Application Submission", pourcentage: 25 },
  { nom: "Follow-up & Decision", pourcentage: 25 },
];
