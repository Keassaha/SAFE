import { getServerSession } from "next-auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { TimerProvider } from "@/lib/contexts/TimerContext";
import { getCabinetSubscriptionState } from "@/lib/services/subscription-state";
import {
  isSubscriptionExemptPath,
  shouldBlockForSubscription,
} from "@/lib/services/subscription-guard";
import { getSidebarCounts } from "@/lib/services/sidebar-counts";
import { ShellV2 } from "./_components/ShellV2";

/**
 * Layout de la structure parallèle /v2 — évaluation du design « Calme opérationnel ».
 *
 * NOTE : la garde auth + abonnement est volontairement DUPLIQUÉE depuis
 * app/(app)/layout.tsx (pas de factorisation : zéro risque pour l'app actuelle).
 * Si la logique d'abonnement évolue côté (app), répercuter ici.
 * Référence design : docs/design/SAFE_INTERFACE_DIRECTION_2026.md.
 */
export default async function AppV2Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/connexion");
  }

  const role = (session.user as { role?: string }).role ?? "avocat";
  const cabinetId = (session.user as { cabinetId?: string }).cabinetId ?? null;
  const userId = (session.user as { id?: string }).id ?? undefined;
  const headerList = await headers();
  const pathname = headerList.get("x-pathname") ?? "";

  if (cabinetId && !isSubscriptionExemptPath(pathname)) {
    const subscription = await getCabinetSubscriptionState(cabinetId);
    if (shouldBlockForSubscription(pathname, subscription)) {
      redirect("/parametres/abonnement");
    }
  }

  const counts = cabinetId ? await getSidebarCounts(cabinetId, userId) : null;
  const userName =
    (session.user as { name?: string | null }).name ??
    session.user.email ??
    "Utilisateur";

  return (
    <QueryProvider>
      <TimerProvider>
        <ShellV2
          role={role}
          userName={userName}
          dossierCount={counts?.dossiers ?? 0}
        >
          {children}
        </ShellV2>
      </TimerProvider>
    </QueryProvider>
  );
}
