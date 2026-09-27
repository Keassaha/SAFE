"use client";

import { useState } from "react";
import type { Session } from "next-auth";
import { Header } from "@/components/layout/Header";
import type { AbonnementAlerte } from "@/components/layout/AlertCenter";
import { PageTransition } from "@/components/layout/PageTransition";
import { MobileSidebar } from "@/components/layout/MobileSidebar";
import { CabinetProvinceProvider } from "@/components/providers/CabinetProvinceProvider";
import { SupportWidget } from "@/components/support/SupportWidget";
import type { TrustReconciliationStatus } from "@/lib/services/trust-reconciliation-status";
import type { SidebarCounts } from "@/lib/services/sidebar-counts";

type AppChromeProps = {
  children: React.ReactNode;
  role: string;
  user: Session["user"];
  cabinetId: string | null;
  billingMode?: "forfait" | "horaire" | "mixed";
  activeNavIds?: string[] | null;
  hiddenNavIds?: string[];
  trustStatus?: TrustReconciliationStatus | null;
  abonnement?: AbonnementAlerte | null;
  /** Province du cabinet — localise la réglementation citée par le centre d'alertes. */
  province?: string | null;
  sidebarCounts?: SidebarCounts | null;
  isSafeInc?: boolean;
  /** Demandes du site en attente de réponse (Console SAFE Inc. seulement). */
  demandesEnAttente?: number;
};

export function AppChrome({ children, role, user, cabinetId, billingMode, activeNavIds, hiddenNavIds, trustStatus, province, sidebarCounts, isSafeInc, abonnement, demandesEnAttente }: AppChromeProps) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    // `safe-atmosphere` porte le fond de marque du canvas : forêt en haut à
    // gauche, ivoire chaud en bas à droite, amplitude faible. C'est ce qui rend
    // le verre du plan 3 lisible comme matière. Sur un aplat uni, un
    // `backdrop-filter` ne produirait aucune information (§5 de la doctrine).
    <div
      className="safe-atmosphere relative flex h-[100dvh] font-sans overflow-hidden text-[var(--safe-text-title)]"
    >
      <MobileSidebar
        open={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
        role={role}
        billingMode={billingMode}
        activeNavIds={activeNavIds}
        hiddenNavIds={hiddenNavIds}
        counts={sidebarCounts ?? null}
      />
      <div className="relative flex flex-1 flex-col min-w-0 min-h-0 overflow-hidden">
        <Header
          title="SAFE"
          user={user}
          cabinetId={cabinetId}
          billingMode={billingMode}
          activeNavIds={activeNavIds}
          role={role}
          isSafeInc={isSafeInc}
          demandesEnAttente={demandesEnAttente}
          onOpenMobileNav={() => setMobileNavOpen(true)}
          trustStatus={isSafeInc ? null : trustStatus}
          abonnement={isSafeInc ? null : abonnement}
          province={province}
        />
        {/* Le rembourrage VERTICAL vit sur la colonne, pas sur `main`.
            `main` est le conteneur de défilement : un `position: sticky;
            top: 0` posé dans une page s'arrête au bord de son contenu, donc
            sous son padding-top. Avec `py-6` ici, une barre collée laissait
            24 px au-dessus d'elle où le contenu défilant restait visible
            (vu sur « Nouvelle facture » le 2026-09-12 : la ligne des réglages
            passait au-dessus de l'en-tête). Sur la colonne, le même
            rembourrage donne exactement la même mise en page au repos, et
            `top-0` désigne enfin le bord visible. */}
        <main
          className="flex-1 px-3 sm:px-4 md:px-8 overflow-y-auto flex flex-col relative overscroll-contain bg-transparent"
          role="main"
        >
          <div className="relative z-10 w-full max-w-7xl mx-auto py-4 sm:py-6">
            <CabinetProvinceProvider province={province ?? null}>
              <PageTransition>{children}</PageTransition>
            </CabinetProvinceProvider>
          </div>
        </main>
      </div>
      {!isSafeInc && cabinetId && <SupportWidget cabinetId={cabinetId} />}
    </div>
  );
}
