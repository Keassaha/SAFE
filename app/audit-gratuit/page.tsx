import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { Navbar } from "@/components/marketing/Navbar";

const AuditChat = dynamic(() => import("@/components/audit/AuditChat"), {
  loading: () => (
    <div className="flex-1 flex items-center justify-center">
      <div className="animate-pulse space-y-4 w-full max-w-xl px-4">
        <div className="h-12 bg-neutral-200 rounded-safe-sm w-3/4" />
        <div className="h-8 bg-neutral-100 rounded-safe-sm w-1/2" />
        <div className="h-32 bg-neutral-100 rounded-safe-sm" />
      </div>
    </div>
  ),
});

export const metadata: Metadata = {
  title: "Audit gratuit — SAFE | Évaluez l'efficacité de votre cabinet",
  description:
    "Répondez à quelques questions et recevez un rapport d'audit personnalisé pour votre cabinet d'avocats. Gratuit et confidentiel.",
};

export default function AuditGratuitPage() {
  return (
    <div className="relative flex flex-col h-screen overflow-hidden bg-[var(--safe-white)]">
      <Navbar />
      <main className="flex-1 overflow-hidden pt-24">
        <AuditChat />
      </main>
    </div>
  );
}
