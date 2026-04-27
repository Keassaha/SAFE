import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { AppChrome } from "@/components/layout/AppChrome";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { TimerProvider } from "@/lib/contexts/TimerContext";
import { getCabinetInterfaceDerived } from "@/lib/services/cabinet-interface";
import { getTrustReconciliationStatus } from "@/lib/services/trust-reconciliation-status";
import { getSidebarCounts } from "@/lib/services/sidebar-counts";

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

  // Detect billing mode + nav visibility from CabinetInterface
  // (cached per-request via React.cache — shared with pages that need the same config)
  const { billingMode, activeNavIds, hiddenNavIds } = cabinetId
    ? await getCabinetInterfaceDerived(cabinetId)
    : { billingMode: "horaire" as const, activeNavIds: null, hiddenNavIds: [] };

  // Trust reconciliation status — used to show a global compliance banner
  const trustStatus = cabinetId ? await getTrustReconciliationStatus(cabinetId) : null;

  // Sidebar live counts (clients actifs, dossiers ouverts, factures à traiter)
  const sidebarCounts = cabinetId ? await getSidebarCounts(cabinetId) : null;

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
          trustStatus={trustStatus}
          sidebarCounts={sidebarCounts}
        >
          {children}
        </AppChrome>
      </TimerProvider>
    </QueryProvider>
  );
}
