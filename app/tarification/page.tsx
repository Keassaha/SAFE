import { Navbar } from "@/components/marketing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { TarificationContent } from "@/components/tarification/TarificationContent";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Tarification",
  description:
    "Des plans simples et sans surprise, pensés pour les petits cabinets d'avocats du Québec. Découvrez la tarification de SAFE.",
  path: "/tarification",
});

export default function TarificationPage() {
  return (
    <div className="flex flex-col min-h-screen bg-canvas font-sans text-text-body antialiased">
      <Navbar />
      <main className="flex-1 mt-[80px]">
        <TarificationContent />
      </main>
      <Footer />
    </div>
  );
}
