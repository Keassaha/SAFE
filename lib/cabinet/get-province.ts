import { prisma } from "@/lib/db";
import { parseCabinetConfig } from "@/lib/cabinet-config";

/**
 * Récupère la province d'un cabinet depuis `Cabinet.config.province`.
 * Server-only (accès Prisma). Renvoie null si introuvable.
 *
 * Sert à localiser la réglementation affichée (fidéicommis, conformité) :
 * QC → Barreau du Québec (B-1, r. 5) ; sinon LSO Ontario.
 */
export async function getCabinetProvince(
  cabinetId: string | null | undefined,
): Promise<string | null> {
  if (!cabinetId) return null;
  const cabinet = await prisma.cabinet.findUnique({
    where: { id: cabinetId },
    select: { config: true },
  });
  return parseCabinetConfig(cabinet?.config ?? null).province ?? null;
}
