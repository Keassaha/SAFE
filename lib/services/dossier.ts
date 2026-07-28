/**
 * Module SERVEUR (bibliothèque interne), pas un fichier d'actions.
 *
 * La directive "use server" a été retirée (audit sécurité 2026-07-28, §E4) : elle
 * transformait chaque fonction exportée en point d'entrée RPC adressable depuis le
 * navigateur. Or ces fonctions reçoivent `cabinetId` en PARAMÈTRE au lieu de le
 * dériver de la session : un appelant qui obtenait l'identifiant d'action pouvait
 * passer le cabinetId d'un autre cabinet et lire, écrire ou supprimer hors du sien.
 *
 * Ce module est importé par des routes API et des actions serveur qui portent déjà
 * leur propre garde de session. Ne PAS remettre "use server" ici.
 */

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
