import React from 'react';
import { Navbar } from '@/components/marketing/Navbar';
import { Hero } from '@/components/landing/Hero';
import { ProblemSection } from '@/components/landing/ProblemSection';
import { NotYourFault } from '@/components/landing/NotYourFault';
import { VirtualEmployees } from '@/components/landing/VirtualEmployees';
import { PourLadjointe } from '@/components/landing/PourLadjointe';
import { FeaturesGrid } from '@/components/landing/FeaturesGrid';
import { ProduitEnVrai } from '@/components/landing/ProduitEnVrai';
import { Objections } from '@/components/landing/Objections';
import { ProcessTimeline } from '@/components/landing/ProcessTimeline';
import { PricingGrid } from '@/components/landing/PricingGrid';
import { FoundingOffer } from '@/components/landing/FoundingOffer';
import { FinalCta } from '@/components/landing/FinalCta';
import { Footer } from '@/components/landing/Footer';
import { JsonLd } from '@/components/seo/JsonLd';
import { buildMetadata, organizationSchema, softwareApplicationSchema } from '@/lib/seo';

export const metadata = buildMetadata({
  title: 'SAFE — Logiciel de gestion pour cabinets d’avocats au Québec',
  description:
    'Facturation, suivi du temps, forfaits et comptabilité en fiducie pour petits cabinets d’avocats. Conforme au Barreau du Québec.',
  path: '/',
});

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-canvas font-sans text-text-body antialiased selection:bg-forest-100 selection:text-forest-600">
      <JsonLd schema={[organizationSchema(), softwareApplicationSchema()]} />
      <Navbar />
      <main className="pt-20">
        {/* Entonnoir fermé : enjeu → pourquoi → coéquipier → système → objections → action */}
        <Hero />
        <ProblemSection />
        <NotYourFault />
        <VirtualEmployees />
        <PourLadjointe />
        <FeaturesGrid />
        <ProduitEnVrai />
        <Objections />
        <ProcessTimeline />
        <PricingGrid />
        <FoundingOffer />
        <FinalCta />
      </main>
      <Footer />
    </div>
  );
}
