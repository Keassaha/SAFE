import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { AppChrome } from "@/components/layout/AppChrome";
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
        <AppChrome role={role} user={session.user} cabinetId={cabinetId}>
          {children}
        </AppChrome>
      </TimerProvider>
    </QueryProvider>
  );
}
