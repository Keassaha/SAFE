import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { AppChrome } from "@/components/layout/AppChrome";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { TimerProvider } from "@/lib/contexts/TimerContext";
import { prisma } from "@/lib/db";
import { getTrustReconciliationStatus } from "@/lib/services/trust-reconciliation-status";

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
  let billingMode: "forfait" | "horaire" = "horaire";
  let activeNavIds: string[] | null = null;
  let hiddenNavIds: string[] = [];
  if (cabinetId) {
    const interfaceConfig = await prisma.cabinetInterface.findUnique({
      where: { cabinetId },
      select: { modules: true, ongletsActifs: true, ongletsMasques: true },
    });
    if (interfaceConfig?.modules) {
      try {
        const modules = JSON.parse(interfaceConfig.modules);
        if (modules?.facturation?.principal === "forfait") billingMode = "forfait";
      } catch { /* ignore parse errors */ }
    }
    if (interfaceConfig?.ongletsActifs) {
      try {
        const parsed = JSON.parse(interfaceConfig.ongletsActifs);
        if (Array.isArray(parsed) && parsed.length > 0) activeNavIds = parsed;
      } catch { /* ignore */ }
    }
    if (interfaceConfig?.ongletsMasques) {
      try {
        const parsed = JSON.parse(interfaceConfig.ongletsMasques);
        if (Array.isArray(parsed)) hiddenNavIds = parsed;
      } catch { /* ignore */ }
    }
  }

  // Trust reconciliation status — used to show a global compliance banner
  const trustStatus = cabinetId ? await getTrustReconciliationStatus(cabinetId) : null;

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
        >
          {children}
        </AppChrome>
      </TimerProvider>
    </QueryProvider>
  );
}
