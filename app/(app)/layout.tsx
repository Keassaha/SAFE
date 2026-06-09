import { getServerSession } from "next-auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { AppChrome } from "@/components/layout/AppChrome";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { TimerProvider } from "@/lib/contexts/TimerContext";
import { getCabinetInterfaceDerived } from "@/lib/services/cabinet-interface";
import { getTrustReconciliationStatus } from "@/lib/services/trust-reconciliation-status";
import { getSidebarCounts } from "@/lib/services/sidebar-counts";
import { QuickCapture } from "@/components/capture/QuickCapture";
import { isSafeIncCabinet } from "@/lib/safe-inc";
import { getCabinetSubscriptionState } from "@/lib/services/subscription-state";
import {
  isSubscriptionExemptPath,
  shouldBlockForSubscription,
} from "@/lib/services/subscription-guard";

export default async function AppLayout({
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
  const headerList = await headers();
  const pathname = headerList.get("x-pathname") ?? "";

  if (cabinetId && !isSubscriptionExemptPath(pathname)) {
    const subscription = await getCabinetSubscriptionState(cabinetId);
    if (shouldBlockForSubscription(pathname, subscription)) {
      redirect("/parametres/abonnement");
    }
  }

  // Detect billing mode + nav visibility from CabinetInterface
  // (cached per-request via React.cache — shared with pages that need the same config)
  const { billingMode, activeNavIds, hiddenNavIds } = cabinetId
    ? await getCabinetInterfaceDerived(cabinetId)
    : { billingMode: "horaire" as const, activeNavIds: null, hiddenNavIds: [] };

  // Trust reconciliation status — used to show a global compliance banner
  const trustStatus = cabinetId ? await getTrustReconciliationStatus(cabinetId) : null;

  // Sidebar live counts (clients actifs, dossiers ouverts, factures à traiter)
  const userId = (session.user as { id?: string }).id ?? undefined;
  const sidebarCounts = cabinetId ? await getSidebarCounts(cabinetId, userId) : null;

  // Mode consultant : SAFE Inc. (dog food) bascule sur une navigation unique
  // dédiée consultant au lieu du menu cabinet d'avocats. Spec : CONSOLE_CONSULTANT_REFACTOR_v1.
  const isSafeInc = cabinetId ? await isSafeIncCabinet(cabinetId) : false;

  return (
    <QueryProvider>
      <TimerProvider>
        <AppChrome
          role={role}
          user={session.user}
          cabinetId={cabinetId}
          billingMode={billingMode}
          activeNavIds={activeNavIds}
          hiddenNavIds={hiddenNavIds}
          trustStatus={isSafeInc ? null : trustStatus}
          sidebarCounts={sidebarCounts}
          isSafeInc={isSafeInc}
        >
          {children}
        </AppChrome>
        <QuickCapture />
      </TimerProvider>
    </QueryProvider>
  );
}
