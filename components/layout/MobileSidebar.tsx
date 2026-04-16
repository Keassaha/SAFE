"use client";

import { useEffect } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import { useTranslations } from "next-intl";
import { SafeLogo } from "@/components/branding/SafeLogo";
import { routes } from "@/lib/routes";
import { SidebarBottomSection, SidebarNavList } from "@/components/layout/SidebarNav";

export function MobileSidebar({
  open,
  onClose,
  role,
  billingMode,
}: {
  open: boolean;
  onClose: () => void;
  role?: string;
  billingMode?: "forfait" | "horaire";
}) {
  const t = useTranslations("shell.header");

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    const onEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (open) window.addEventListener("keydown", onEscape);
    return () => window.removeEventListener("keydown", onEscape);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] lg:hidden" role="dialog" aria-modal="true" aria-label={t("menuTitle")}>
      <button
        type="button"
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        aria-label={t("closeMenu")}
        onClick={onClose}
      />
      <div className="absolute left-0 top-0 bottom-0 w-[min(100vw-3rem,280px)] flex flex-col bg-green-950 shadow-2xl border-r border-white/10 animate-mobile-drawer-in pt-[env(safe-area-inset-top,0px)] pb-[env(safe-area-inset-bottom,0px)]">
        <div className="flex items-center justify-between gap-2 px-4 pt-3 sm:pt-4 pb-4 border-b border-white/10 shrink-0">
          <Link
            href={routes.tableauDeBord}
            className="flex items-center min-w-0"
            onClick={onClose}
          >
            <SafeLogo className="shrink-0" variant="dark" noPulse />
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 p-2 rounded-safe text-white/70 hover:text-white hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-green-700/40"
            aria-label={t("closeMenu")}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <SidebarNavList role={role} billingMode={billingMode} onNavigate={onClose} navClassName="flex-1 overflow-y-auto px-3 py-3 hide-scrollbar min-h-0" />

        <SidebarBottomSection onNavigate={onClose} />
      </div>
    </div>
  );
}
