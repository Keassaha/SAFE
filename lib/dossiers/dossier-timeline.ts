import { prisma } from "@/lib/db";
import { dossierAuditLabel } from "@/lib/dossiers/dossier-resume";

/**
 * Timeline d'un dossier — journal d'audit complet (même source que le bloc
 * « Où j'en étais ? » : AuditLog, entityType Dossier). Lecture seule, pour
 * l'onglet Activité de la page dossier v2.
 */
export interface DossierTimelineItem {
  id: string;
  /** Libellé lisible de l'action (via dossierAuditLabel). */
  label: string;
  /** Code d'action brut (badge). */
  action: string;
  userName: string | null;
  createdAt: Date;
}

export async function getDossierTimeline(
  cabinetId: string,
  dossierId: string,
  limit = 50,
): Promise<DossierTimelineItem[]> {
  const rows = await prisma.auditLog.findMany({
    where: { cabinetId, entityType: "Dossier", entityId: dossierId },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      action: true,
      createdAt: true,
      user: { select: { nom: true } },
    },
  });

  return rows.map((row) => ({
    id: row.id,
    label: dossierAuditLabel(row.action, "fr"),
    action: row.action,
    userName: row.user?.nom ?? null,
    createdAt: row.createdAt,
  }));
}
