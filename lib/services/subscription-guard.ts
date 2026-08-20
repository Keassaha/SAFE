import type { CabinetSubscriptionState } from "./subscription-state";
import { isBlocageAbonnementActif } from "@/lib/flags";

export function isSubscriptionExemptPath(pathname: string): boolean {
  return (
    pathname === "/parametres/abonnement" ||
    pathname.startsWith("/parametres/abonnement/")
  );
}

/**
 * Faut-il fermer l'application ?
 *
 * Non, sauf si quelqu'un l'a explicitement demandé (`SAFE_BLOCAGE_ABONNEMENT=on`).
 * Un abonnement inactif se RAPPELLE désormais dans le centre d'alertes ; il
 * n'enferme plus personne. Voir `isBlocageAbonnementActif` pour le raisonnement.
 *
 * La condition d'origine est conservée derrière le drapeau, telle quelle : le
 * jour où on rallume le mur, il bloque exactement ce qu'il bloquait avant, et
 * la page d'abonnement reste la seule porte de sortie.
 */
export function shouldBlockForSubscription(
  pathname: string,
  state: Pick<CabinetSubscriptionState, "active">,
): boolean {
  if (!isBlocageAbonnementActif()) return false;
  return !state.active && !isSubscriptionExemptPath(pathname);
}
