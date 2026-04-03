import type { Metadata } from "next";
import { Navbar } from "@/components/marketing/Navbar";
import { Footer } from "@/components/marketing/Footer";
import AuditChat from "@/components/audit/AuditChat";

export const metadata: Metadata = {
  title: "Audit gratuit — SAFE | Évaluez l'efficacité de votre cabinet",
  description:
    "Répondez à quelques questions et recevez un rapport d'audit personnalisé pour votre cabinet d'avocats. Gratuit et confidentiel.",
};

export default function AuditGratuitPage() {
  return (
    <div className="relative flex flex-col min-h-screen bg-[#F8FDF9]">
      <Navbar />
      <main className="flex-1 pt-24">
        <AuditChat />
      </main>
      <Footer />
    </div>
  );
}
