import { Navbar } from "@/components/marketing/Navbar";
import { PricingGrid } from "@/components/landing/PricingGrid";
import { FinalCta } from "@/components/landing/FinalCta";
import { Footer } from "@/components/landing/Footer";

export default function TarificationPage() {
  return (
    <div className="flex flex-col min-h-screen bg-canvas font-sans text-text-body antialiased">
      <Navbar />
      <main className="flex-1 mt-[80px]">
        {/* We use the same PricingGrid designed for the landing page */}
        <PricingGrid />
        
        {/* The Final CTA wrapper with matching background */}
        <div className="bg-canvas border-y border-[0.5px] border-border pb-10">
           <FinalCta />
        </div>
      </main>
      <Footer />
    </div>
  );
}
