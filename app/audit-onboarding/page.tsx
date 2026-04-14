import type { Metadata } from "next";
import dynamic from "next/dynamic";

const OnboardingChat = dynamic(
  () => import("@/components/onboarding/OnboardingChat"),
  {
    loading: () => (
      <div className="flex items-center justify-center h-screen bg-[var(--safe-white)]">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-neutral-100" />
          <div className="h-4 w-48 bg-neutral-100 rounded" />
        </div>
      </div>
    ),
  }
);

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
