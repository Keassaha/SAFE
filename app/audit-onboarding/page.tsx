import type { Metadata } from "next";
import dynamic from "next/dynamic";

const OnboardingChat = dynamic(() => import("@/components/onboarding/OnboardingChat"), {
  ssr: false,
  loading: () => (
    <div className="flex-1 flex items-center justify-center h-screen">
      <div className="animate-pulse space-y-4 w-full max-w-xl px-4">
        <div className="h-12 bg-neutral-200 rounded-safe-sm w-3/4" />
        <div className="h-8 bg-neutral-100 rounded-safe-sm w-1/2" />
        <div className="h-32 bg-neutral-100 rounded-safe-sm" />
      </div>
    </div>
  ),
});

export const metadata: Metadata = {
  title: "Audit & Onboarding — SAFE | Configurez votre cabinet",
  description:
    "Répondez à quelques questions et obtenez une offre personnalisée pour votre cabinet d'avocats. Configuration sur mesure, sans frais.",
};

export default function AuditOnboardingPage() {
  return (
    <div className="relative flex flex-col h-screen bg-[var(--safe-white)]">
      <OnboardingChat />
    </div>
  );
}
