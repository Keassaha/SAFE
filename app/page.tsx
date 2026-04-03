import { Navbar } from "@/components/marketing/Navbar";
import { Hero } from "@/components/marketing/Hero";
import { LogosTicker } from "@/components/marketing/LogosTicker";
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
        <Hero />
        <LogosTicker />
        <About />
        <FeaturesGrid />
        <ProcessTimeline />
        <TestimonialSlider />
        <Pricing />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
}
