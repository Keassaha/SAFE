import type { Metadata } from "next";
import OnboardingChat from "@/components/onboarding/OnboardingChat";

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
