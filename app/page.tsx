import React from 'react';
import { Navbar } from '@/components/marketing/Navbar';
import { Hero } from '@/components/landing/Hero';
import { ProblemSection } from '@/components/landing/ProblemSection';
import { Testimonial } from '@/components/landing/Testimonial';
import { FeaturesGrid } from '@/components/landing/FeaturesGrid';
import { VirtualEmployees } from '@/components/landing/VirtualEmployees';
import { ProcessTimeline } from '@/components/landing/ProcessTimeline';
import { PricingGrid } from '@/components/landing/PricingGrid';
import { FinalCta } from '@/components/landing/FinalCta';
import { Footer } from '@/components/landing/Footer';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-canvas font-sans text-text-body antialiased selection:bg-forest-100 selection:text-forest-600">
      <Navbar />
      <main className="pt-20">
        <Hero />
        <ProblemSection />
        <Testimonial />
        <FeaturesGrid />
        <VirtualEmployees />
        <ProcessTimeline />
        <PricingGrid />
        <FinalCta />
      </main>
      <Footer />
    </div>
  );
}
