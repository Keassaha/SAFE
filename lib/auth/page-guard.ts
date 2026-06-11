import { redirect } from "next/navigation";
import type { UserRole } from "@prisma/client";
import { requireCabinetAndUser } from "./session";

/**
 * Garde de page (Server Component) : exige un rôle autorisé pour charger la page.
 *
 * Doctrine de sécurité SAFE : « le menu cache, il ne protège pas ». La navigation
 * peut masquer une entrée, mais une URL directe sert quand même la page. Toute page
 * qui charge des données sensibles (financières, RH, etc.) DOIT revérifier le rôle
 * côté serveur. Si le rôle n'est pas autorisé, on redirige vers le tableau de bord.
 *
 * @param allow prédicat de permission (les mêmes helpers que la navigation, pour
 *              garder UI et page strictement cohérentes).
 */
export async function requirePageAccess(
  allow: (role: UserRole) => boolean,
): Promise<{ cabinetId: string; userId: string; role: UserRole }> {
  const { cabinetId, userId, role } = await requireCabinetAndUser();
  const typedRole = role as UserRole;
  if (!allow(typedRole)) {
    redirect("/tableau-de-bord");
  }
  return { cabinetId, userId, role: typedRole };
}
