/**
 * Helpers pour identifier les superadmins SAFE Inc. (CEO et équipe interne).
 *
 * La Console SAFE Inc. (/console) est accessible uniquement aux utilisateurs
 * dont le Cabinet rattaché a pour nom "SAFE" (la stratégie dog food, ADR-006).
 *
 * En v2 multi-tenant, ce check sera remplacé par un check sur Workspace.
 */
import { prisma } from "@/lib/db";

const SAFE_INC_CABINET_NAME = "SAFE";

/** Vérifie si un cabinet est le cabinet SAFE Inc. lui-même (dog food). */
export async function isSafeIncCabinet(cabinetId: string): Promise<boolean> {
  const cabinet = await prisma.cabinet.findUnique({
    where: { id: cabinetId },
    select: { nom: true },
  });
  return cabinet?.nom === SAFE_INC_CABINET_NAME;
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

/** Vérifie superadmin SAFE Inc. + retourne le workspace. */
export async function requireSafeSuperadmin(cabinetId: string) {
  const ok = await isSafeIncCabinet(cabinetId);
  if (!ok) {
    throw new Error("Accès Console réservé aux administrateurs SAFE Inc.");
  }
  return getSafeIncWorkspace();
}
