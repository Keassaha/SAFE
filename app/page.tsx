import { Navbar } from "@/components/marketing/Navbar";
import { Hero } from "@/components/marketing/Hero";
import { LogosTicker } from "@/components/marketing/LogosTicker";
import { PainPoints } from "@/components/marketing/PainPoints";
import { About } from "@/components/marketing/About";
import { FeaturesGrid } from "@/components/marketing/FeaturesGrid";
import { ProcessTimeline } from "@/components/marketing/ProcessTimeline";
import { TestimonialSlider } from "@/components/marketing/TestimonialSlider";
import { Pricing } from "@/components/marketing/Pricing";
import { FinalCTA } from "@/components/marketing/FinalCTA";
import { Footer } from "@/components/marketing/Footer";

export default function HomePage() {
  return (
    <div className="relative flex flex-col min-h-screen bg-[var(--safe-darkest)] text-[var(--safe-white)] scroll-smooth">
      <Navbar />
      <main className="flex-1">
        {/* 1. Hook — accroche + proposition de valeur */}
        <Hero />
        {/* 2. Crédibilité rapide */}
        <LogosTicker />
        {/* 3. Agitation — nommer les douleurs */}
        <PainPoints />
        {/* 4. Transition problème → solution */}
        <About />
        {/* 5. Solution — bénéfices concrets */}
        <FeaturesGrid />
        {/* 6. Comment ça marche — réduire la friction */}
        <ProcessTimeline />
        {/* 7. Preuve sociale — témoignages quantifiés */}
        <TestimonialSlider />
        {/* 8. Prix — ancrage + toggle annuel */}
        <Pricing />
        {/* 9. CTA final — urgence + garantie */}
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
}
