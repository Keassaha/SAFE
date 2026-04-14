import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { Navbar } from "@/components/marketing/Navbar";

const AuditChat = dynamic(() => import("@/components/audit/AuditChat"), {
  loading: () => (
    <div className="flex items-center justify-center flex-1">
      <div className="animate-pulse flex flex-col items-center gap-4">
        <div className="h-12 w-12 rounded-full bg-neutral-100" />
        <div className="h-4 w-48 bg-neutral-100 rounded" />
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
