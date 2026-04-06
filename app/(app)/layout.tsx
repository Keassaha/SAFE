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
        <div className="flex h-screen bg-[var(--safe-neutral-page)] font-sans overflow-hidden text-[var(--safe-text-title)]">
          <Sidebar role={role} />
          <div className="flex flex-1 flex-col min-w-0 min-h-0 overflow-hidden">
            <Header title="SAFE" user={session.user} cabinetId={cabinetId} />
            <main className="flex-1 px-4 md:px-8 py-6 overflow-y-auto flex flex-col relative bg-[var(--safe-neutral-page)]" role="main">
              <div className="relative z-10 w-full max-w-7xl mx-auto">
                <PageTransition>{children}</PageTransition>
              </div>
            </main>
          </div>
        </div>
      </TimerProvider>
    </QueryProvider>
  );
}
