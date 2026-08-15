/**
 * Helpers pour identifier les superadmins SAFE Inc. (CEO et équipe interne).
 *
 * La Console SAFE Inc. (/console) est accessible uniquement aux utilisateurs
 * dont le Cabinet rattaché a pour nom "SAFE" (la stratégie dog food, ADR-006).
 *
 * En v2 multi-tenant, ce check sera remplacé par un check sur Workspace.
 */
import { cache } from "react";
import type { UserRole } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireCabinetAndUser } from "@/lib/auth/session";
import { canManageCabinetSettings } from "@/lib/auth/permissions";

const SAFE_INC_CABINET_NAME = "SAFE";

/**
 * Vérifie si un cabinet est le cabinet SAFE Inc. lui-même (dog food).
 *
 * `React.cache()` : appelée par le layout applicatif à chaque navigation ;
 * sans elle, une requête `Cabinet` de plus vient s'ajouter aux deux autres
 * déjà faites sur la même ligne dans le même rendu serveur.
 */
export const isSafeIncCabinet = cache(async (cabinetId: string): Promise<boolean> => {
  const cabinet = await prisma.cabinet.findUnique({
    where: { id: cabinetId },
    select: { nom: true },
  });
  return cabinet?.nom === SAFE_INC_CABINET_NAME;
});

/**
 * Accès Console : vrai si l'utilisateur est marqué interne (`User.isInternal`).
 *
 * Voie robuste qui ne dépend plus du nom de cabinet. Repli transitoire sur le
 * nom "SAFE" tant que les comptes internes ne sont pas tous flaggés : aucun
 * risque de verrouiller l'équipe pendant la bascule. À terme, retirer le repli.
 */
export async function isSafeInternalUser(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { isInternal: true, cabinet: { select: { nom: true } } },
  });
  if (!user) return false;
  return user.isInternal === true || user.cabinet?.nom === SAFE_INC_CABINET_NAME;
}

/**
 * Retourne le Workspace singleton SAFE Inc. (créé via seed).
 * Throw si non trouvé : le seed crm-workspace-and-leads.mjs doit avoir été lancé.
 */
export async function getSafeIncWorkspace() {
  const workspace = await prisma.workspace.findFirst({
    where: { nom: "SAFE Inc." },
  });

  if (!workspace) {
    throw new Error(
      "Workspace SAFE Inc. introuvable. Lancez `node prisma/seeds/crm-workspace-and-leads.mjs`.",
    );
  }

  return workspace;
}

/** Message d'erreur unique, pour ne pas renseigner un attaquant sur la cause. */
export const CONSOLE_ACCESS_DENIED = "Accès Console réservé aux administrateurs SAFE Inc.";

/**
 * Condition d'accès à la Console, sous forme booléenne.
 *
 * Deux exigences CUMULATIVES :
 *  - compte interne SAFE Inc. (`User.isInternal`, avec repli transitoire sur le
 *    nom de cabinet "SAFE") ;
 *  - rôle administrateur.
 *
 * Un compte interne non-admin ne doit pas voir les données de tous les clients,
 * et un admin d'un cabinet client ne doit pas voir la Console. Les deux
 * conditions se répondent : aucune ne suffit seule.
 *
 * Variante non-throwing, pour les endroits où l'accès Console n'est pas un
 * prérequis mais un privilège supplémentaire (support bidirectionnel).
 */
export async function hasConsoleAccess(
  userId: string,
  role: string,
): Promise<boolean> {
  if (!canManageCabinetSettings(role as UserRole)) return false;
  return isSafeInternalUser(userId);
}

/**
 * Garde d'accès unique de la Console SAFE Inc.
 *
 * Reproduit exactement la condition du layout pour que les server actions, qui
 * sont des endpoints POST autonomes, ne soient jamais plus permissives que
 * l'écran qui les affiche. Sans cela, masquer un bouton ne protège rien.
 *
 * À appeler en PREMIÈRE ligne de toute action Console. Ne jamais se contenter
 * de `isSafeIncCabinet` : appartenir au cabinet SAFE n'est pas un rôle.
 */
export async function requireConsoleAccess(): Promise<{
  userId: string;
  cabinetId: string;
}> {
  const { userId, cabinetId, role } = await requireCabinetAndUser();
  if (!(await hasConsoleAccess(userId, role))) {
    throw new Error(CONSOLE_ACCESS_DENIED);
  }
  return { userId, cabinetId };
}

/** Garde Console + workspace SAFE Inc., pour les actions qui ont besoin des deux. */
export async function requireSafeSuperadmin() {
  await requireConsoleAccess();
  return getSafeIncWorkspace();
}
