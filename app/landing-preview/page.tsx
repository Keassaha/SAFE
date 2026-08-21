import React from 'react';
import { Nav } from '@/components/public-site/shared';
import { HeroPreview } from '@/components/landing/preview/HeroPreview';
import { ReperesPreview } from '@/components/landing/preview/ReperesPreview';
import { CoutDesordre } from '@/components/landing/preview/CoutDesordre';
import { PointDeVue } from '@/components/landing/preview/PointDeVue';
import { TroisActes } from '@/components/landing/preview/TroisActes';
import { ContinuitePreview } from '@/components/landing/preview/ContinuitePreview';
import { OffrePreview } from '@/components/landing/preview/OffrePreview';
import { ObjectionsPreview } from '@/components/landing/preview/ObjectionsPreview';
import { CtaFinalPreview } from '@/components/landing/preview/CtaFinalPreview';
import { Footer } from '@/components/landing/Footer';
import { buildMetadata } from '@/lib/seo';

export const metadata = buildMetadata({
  title: 'SAFE — Ébauche landing (direction Linear, brouillon interne)',
  description: 'Support de discussion interne, ne pas indexer.',
  path: '/landing-preview',
  noindex: true,
});

// Ébauche isolée — docs/product/DIRECTION_LANDING_SAFE_INSPIREE_LINEAR_2026.md §14.
// Ne remplace PAS app/page.tsx (route de production). Recomposition v2 : discipline Linear
// appliquée pour de vrai — tout aligné à gauche, grille narrative (numéro/titre à gauche,
// texte à droite, scène pleine largeur dessous) sur chaque section, scènes produit animées en DOM.
// 01 Hero · 02 Repères · 03 Coût du désordre · 04 Point de vue · 05 Trois actes ·
// 06 Continuité · 07 Offre et prix · 08 Objections · 09 CTA final.
export default function LandingPreviewPage() {
  return (
    <div className="min-h-screen bg-canvas font-sans text-text-body antialiased selection:bg-forest-100 selection:text-forest-600">
      <Nav />
      <main className="pt-20">
        <HeroPreview />
        <ReperesPreview />
        <CoutDesordre />
        <PointDeVue />
        <TroisActes />
        <ContinuitePreview />
        <OffrePreview />
        <ObjectionsPreview />
        <CtaFinalPreview />
      </main>
      <Footer />
    </div>
  );
}
