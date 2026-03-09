"use server";

import { prisma } from "@/lib/db";
import type { UserRole } from "@prisma/client";
import { canEditDossierAsAvocat } from "@/lib/auth/permissions";

/**
 * Vérifie si l'utilisateur peut modifier le dossier (isolation cabinet + avocat responsable).
 */
export async function canUserEditDossier(
  dossierId: string,
  cabinetId: string,
  userId: string,
  role: UserRole
): Promise<boolean> {
  const dossier = await prisma.dossier.findFirst({
    where: { id: dossierId, cabinetId },
    select: { avocatResponsableId: true },
  });
  if (!dossier) return false;
  return canEditDossierAsAvocat(role, dossier.avocatResponsableId, userId);
}

/**
 * Vérifie si l'utilisateur peut accéder au dossier (lecture : même cabinet ; écriture via canEditDossierAsAvocat).
 */
export async function getDossierWithAccessCheck(
  dossierId: string,
  cabinetId: string,
  userId: string,
  role: UserRole
) {
  const dossier = await prisma.dossier.findFirst({
    where: { id: dossierId, cabinetId },
    include: { client: true, avocatResponsable: true },
  });
  if (!dossier) return null;
  const canEdit = canEditDossierAsAvocat(role, dossier.avocatResponsableId, userId);
  return { dossier, canEdit };
}
