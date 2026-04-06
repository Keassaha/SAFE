"use client";

import { useEffect } from "react";
import { signOutClient } from "@/lib/auth/sign-out-client";
import Link from "next/link";
import { Search, Plus, Bell, Settings } from "lucide-react";
import { useTranslations } from "next-intl";
import { SafeLogo } from "@/components/branding/SafeLogo";
import { routes } from "@/lib/routes";
import { GlobalTimer } from "@/components/temps/GlobalTimer";
import { LocaleSwitcher } from "@/components/layout/LocaleSwitcher";

interface HeaderProps {
  title?: string;
  user?: { name?: string | null; email?: string | null; image?: string | null; id?: string };
  cabinetId?: string | null;
  /** Afficher le dot de notification sur la cloche (ex. notifications non lues) */
  hasUnreadNotifications?: boolean;
}

export function Header({ title = "SAFE", user, cabinetId, hasUnreadNotifications = false }: HeaderProps) {
  const t = useTranslations("shell.header");
  const currentUserId = (user as { id?: string })?.id ?? "";

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        document.getElementById("header-search")?.focus();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <header className="h-20 shrink-0 flex items-center justify-between px-4 md:px-8 gap-4 bg-white border-b border-[var(--safe-neutral-border)]">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <Link
          href={routes.tableauDeBord}
          className="shrink-0 lg:hidden transition-opacity hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-white/30 rounded-safe-sm"
        >
          <span className="sr-only">{title}</span>
          <SafeLogo variant="dark" className="shrink-0" />
        </Link>
        <div className="flex-1 max-w-md min-w-0">
          <label htmlFor="header-search" className="sr-only">
            {t("searchLabel")}
          </label>
          <div className="relative">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none"
              aria-hidden
            />
            <input
              id="header-search"
              type="search"
              placeholder={t("searchPlaceholder")}
              className="w-full h-12 pl-12 pr-20 rounded-safe-md bg-white border border-gray-100 outline-none transition-all duration-200 text-sm text-gray-800 focus:ring-2 focus:ring-green-600 focus:border-transparent shadow-sm"
            />
            <kbd className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none hidden sm:inline-flex items-center gap-0.5 rounded-safe-sm border border-gray-200 bg-gray-50 px-2 py-1 text-xs text-gray-500 font-mono">
              <span>⌘</span>K
            </kbd>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="safe-topbar-locale text-gray-600">
          <LocaleSwitcher />
        </div>
        <GlobalTimer cabinetId={cabinetId ?? null} currentUserId={currentUserId} />
        
        <button
          type="button"
          className="relative w-10 h-10 rounded-full bg-white border border-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors duration-200 shadow-sm"
          title={t("notifications")}
          aria-label={t("notifications")}
        >
          <Bell className="w-5 h-5" />
          {hasUnreadNotifications && (
            <span
              className="absolute right-2.5 top-2 w-2 h-2 rounded-full bg-red-500"
              aria-hidden
            />
          )}
        </button>

        <div className="flex items-center gap-3 bg-white pr-4 pl-1.5 py-1.5 rounded-full border border-gray-100 cursor-pointer shadow-sm hover:shadow-md transition-shadow">
          <div
            className="w-8 h-8 rounded-full bg-green-800 flex items-center justify-center text-white text-sm font-semibold"
            aria-hidden
          >
            {user?.name?.[0] ?? user?.email?.[0] ?? "?"}
          </div>
          <span className="text-sm font-semibold text-gray-800 hidden sm:block">
            {user?.name ?? user?.email?.split('@')[0] ?? "Utilisateur"}
          </span>
        </div>

        <button
          type="button"
          onClick={() => void signOutClient("/")}
          className="text-gray-500 ml-2 px-3 py-2 text-sm font-medium rounded-safe transition-colors duration-200 hover:text-green-800 hover:bg-green-50"
        >
          {t("signOut")}
        </button>
      </div>
    </header>
  );
}
