import { Navbar } from "@/components/marketing/Navbar";
import { FeaturesGrid } from "@/components/landing/FeaturesGrid";
import { FinalCta } from "@/components/landing/FinalCta";
import { Footer } from "@/components/landing/Footer";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Fonctionnalités",
  description:
    "Facturation, suivi du temps, forfaits et comptabilité en fiducie : tout ce qu'un petit cabinet d'avocats québécois gère au quotidien, au même endroit.",
  path: "/fonctionnalites",
});

export default function FonctionnalitesPage() {
  return (
    <div className="flex flex-col min-h-screen bg-canvas font-sans text-text-body antialiased">
      <Navbar />
      <main className="flex-1 mt-[80px]">
        {/* We use the same FeaturesGrid designed for the landing page */}
        <FeaturesGrid />
        
        {/* The Final CTA wrapper with matching background */}
        <div className="bg-canvas border-y border-[0.5px] border-border pb-10">
           <FinalCta />
        </div>
      </main>
      <Footer />
    </div>
  );
}
