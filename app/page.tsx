import dynamic from "next/dynamic";
import { Navbar } from "@/components/marketing/Navbar";
import { Hero } from "@/components/marketing/Hero";
import { PainPoints } from "@/components/marketing/PainPoints";
import { Footer } from "@/components/marketing/Footer";

/* Lazy-load below-the-fold sections — reduces initial JS bundle */
const About = dynamic(() => import("@/components/marketing/About").then(m => ({ default: m.About })));
const FeaturesGrid = dynamic(() => import("@/components/marketing/FeaturesGrid").then(m => ({ default: m.FeaturesGrid })));
const ProcessTimeline = dynamic(() => import("@/components/marketing/ProcessTimeline").then(m => ({ default: m.ProcessTimeline })));
const Pricing = dynamic(() => import("@/components/marketing/Pricing").then(m => ({ default: m.Pricing })));
const FinalCTA = dynamic(() => import("@/components/marketing/FinalCTA").then(m => ({ default: m.FinalCTA })));

export default function HomePage() {
  return (
    <div className="relative flex flex-col min-h-screen text-[var(--safe-white)] scroll-smooth">
      <Navbar />
      <main className="relative z-10 flex-1">
        <Hero />
        <PainPoints />
        <About />
        <FeaturesGrid />
        <ProcessTimeline />
        <Pricing />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
}
