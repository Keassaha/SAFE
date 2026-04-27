"use client";

import { useState } from "react";
import type { Session } from "next-auth";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { PageTransition } from "@/components/layout/PageTransition";
import { MobileSidebar } from "@/components/layout/MobileSidebar";
import { TrustReconciliationBanner } from "@/components/layout/TrustReconciliationBanner";
import type { TrustReconciliationStatus } from "@/lib/services/trust-reconciliation-status";
import type { SidebarCounts } from "@/lib/services/sidebar-counts";

type AppChromeProps = {
  children: React.ReactNode;
  role: string;
  user: Session["user"];
  cabinetId: string | null;
  billingMode?: "forfait" | "horaire";
  activeNavIds?: string[] | null;
  hiddenNavIds?: string[];
  trustStatus?: TrustReconciliationStatus | null;
  sidebarCounts?: SidebarCounts | null;
};

export function AppChrome({ children, role, user, cabinetId, billingMode, activeNavIds, hiddenNavIds, trustStatus, sidebarCounts }: AppChromeProps) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div
      className="relative flex h-[100dvh] font-sans overflow-hidden bg-canvas text-[var(--safe-text-title)]"
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
          onOpenMobileNav={() => setMobileNavOpen(true)}
        />
        {trustStatus && <TrustReconciliationBanner status={trustStatus} />}
        <main
          className="flex-1 px-3 sm:px-4 md:px-8 py-4 sm:py-6 overflow-y-auto flex flex-col relative overscroll-contain bg-transparent"
          role="main"
        >
          <div className="relative z-10 w-full max-w-7xl mx-auto">
            <PageTransition>{children}</PageTransition>
          </div>
        </main>
      </div>
    </div>
  );
}
