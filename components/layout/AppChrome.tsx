"use client";

import { useState } from "react";
import type { Session } from "next-auth";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { PageTransition } from "@/components/layout/PageTransition";
import { MobileSidebar } from "@/components/layout/MobileSidebar";

type AppChromeProps = {
  children: React.ReactNode;
  role: string;
  user: Session["user"];
  cabinetId: string | null;
  billingMode?: "forfait" | "horaire";
};

export function AppChrome({ children, role, user, cabinetId, billingMode }: AppChromeProps) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="flex h-[100dvh] bg-[var(--safe-neutral-page)] font-sans overflow-hidden text-[var(--safe-text-title)]">
      <Sidebar role={role} billingMode={billingMode} />
      <MobileSidebar open={mobileNavOpen} onClose={() => setMobileNavOpen(false)} role={role} billingMode={billingMode} />
      <div className="flex flex-1 flex-col min-w-0 min-h-0 overflow-hidden">
        <Header
          title="SAFE"
          user={user}
          cabinetId={cabinetId}
          billingMode={billingMode}
          onOpenMobileNav={() => setMobileNavOpen(true)}
        />
        <main
          className="flex-1 px-3 sm:px-4 md:px-8 py-4 sm:py-6 overflow-y-auto flex flex-col relative bg-[var(--safe-neutral-page)] overscroll-contain"
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
