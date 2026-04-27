"use client";

import { useEffect } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import { useTranslations } from "next-intl";
import { routes } from "@/lib/routes";
import { SidebarBottomSection, SidebarNavList } from "@/components/layout/SidebarNav";
import type { SidebarCounts } from "@/lib/services/sidebar-counts";

/**
 * Éditorial Chaleureux — mobile drawer variant of the sidebar.
 * Matches desktop Sidebar: sand-300 bg, black logo + Safe wordmark,
 * forest-green counts. Slides in from the left over a dimmed backdrop.
 */
export function MobileSidebar({
  open,
  onClose,
  role,
  billingMode,
  activeNavIds,
  hiddenNavIds,
  counts,
}: {
  open: boolean;
  onClose: () => void;
  role?: string;
  billingMode?: "forfait" | "horaire";
  activeNavIds?: string[] | null;
  hiddenNavIds?: string[];
  counts?: SidebarCounts | null;
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
        className="absolute inset-0 bg-[var(--zinc-950)]/40 backdrop-blur-sm"
        aria-label={t("closeMenu")}
        onClick={onClose}
      />
      <div
        className="absolute left-0 top-0 bottom-0 w-[min(100vw-3rem,280px)] flex flex-col shadow-2xl border-r animate-mobile-drawer-in pt-[env(safe-area-inset-top,0px)] pb-[env(safe-area-inset-bottom,0px)]"
        style={{
          background: "var(--sand-300)",
          borderRightColor: "var(--sand-400)",
        }}
      >
        <div
          className="flex items-center justify-between gap-2 px-4 pt-3 sm:pt-4 pb-4 border-b shrink-0"
          style={{ borderBottomColor: "var(--sand-400)" }}
        >
          <Link
            href={routes.tableauDeBord}
            className="flex items-center gap-2.5 min-w-0"
            onClick={onClose}
          >
            <span
              className="flex w-8 h-8 shrink-0 items-center justify-center rounded-md text-[13px] font-bold tracking-tight"
              style={{ background: "var(--zinc-950)", color: "var(--sand-100)" }}
              aria-hidden
            >
              S
            </span>
            <span
              className="text-[17px] font-semibold tracking-tight leading-none"
              style={{ color: "var(--zinc-950)" }}
            >
              Safe
            </span>
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 p-2 rounded-md transition-colors hover:bg-[var(--sand-50)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-800)]/40"
            aria-label={t("closeMenu")}
            style={{ color: "var(--zinc-950)" }}
          >
            <X className="w-6 h-6" strokeWidth={1.5} />
          </button>
        </div>

        <SidebarNavList
          role={role}
          billingMode={billingMode}
          activeNavIds={activeNavIds}
          hiddenNavIds={hiddenNavIds}
          counts={counts}
          onNavigate={onClose}
          navClassName="flex-1 overflow-y-auto px-3 py-3 hide-scrollbar min-h-0"
        />

        <SidebarBottomSection onNavigate={onClose} />
      </div>
    </div>
  );
}
