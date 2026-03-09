import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { PageTransition } from "@/components/layout/PageTransition";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { TimerProvider } from "@/lib/contexts/TimerContext";

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

  return (
    <QueryProvider>
      <TimerProvider>
        <div className="safe-app-layout flex h-screen min-h-screen overflow-hidden">
          <Sidebar role={role} />
          <div className="flex flex-1 flex-col min-w-0 min-h-0 overflow-hidden">
            <Header title="SAFE" user={session.user} cabinetId={cabinetId} />
            <main className="safe-app-main flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-4 md:p-6" role="main">
              <PageTransition>{children}</PageTransition>
            </main>
          </div>
        </div>
      </TimerProvider>
    </QueryProvider>
  );
}
