import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { AppChrome } from "@/components/layout/AppChrome";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { TimerProvider } from "@/lib/contexts/TimerContext";
import { prisma } from "@/lib/db";

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

  // Detect billing mode for sidebar/header
  let billingMode: "forfait" | "horaire" = "horaire";
  if (cabinetId) {
    const interfaceConfig = await prisma.cabinetInterface.findUnique({
      where: { cabinetId },
      select: { modules: true },
    });
    if (interfaceConfig?.modules) {
      try {
        const modules = JSON.parse(interfaceConfig.modules);
        if (modules?.facturation?.principal === "forfait") billingMode = "forfait";
      } catch { /* ignore parse errors */ }
    }
  }

  return (
    <QueryProvider>
      <TimerProvider>
        <AppChrome role={role} user={session.user} cabinetId={cabinetId} billingMode={billingMode}>
          {children}
        </AppChrome>
      </TimerProvider>
    </QueryProvider>
  );
}
