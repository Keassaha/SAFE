import type { CabinetSubscriptionState } from "./subscription-state";

export function isSubscriptionExemptPath(pathname: string): boolean {
  return (
    pathname === "/parametres/abonnement" ||
    pathname.startsWith("/parametres/abonnement/")
  );
}

export function shouldBlockForSubscription(
  pathname: string,
  state: Pick<CabinetSubscriptionState, "active">,
): boolean {
  return !state.active && !isSubscriptionExemptPath(pathname);
}
