"use client";

import { signOut } from "next-auth/react";
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
}

export function Header({ title = "SAFE", user, cabinetId }: HeaderProps) {
  const t = useTranslations("shell.header");
  const currentUserId = (user as { id?: string })?.id ?? "";
  return (
    <header className="safe-glass-topbar h-14 shrink-0 flex items-center justify-between px-4 md:px-6 gap-4">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <Link
          href={routes.tableauDeBord}
          className="shrink-0 lg:hidden transition-opacity hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-white/30 rounded-lg"
        >
          <span className="sr-only">{title}</span>
          <SafeLogo variant="dark" className="w-[104px]" />
        </Link>
        <div className="flex-1 max-w-md min-w-0">
          <label htmlFor="header-search" className="sr-only">
            {t("searchLabel")}
          </label>
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/70"
              aria-hidden
            />
            <input
              id="header-search"
              type="search"
              data-topbar-input
              placeholder={t("searchPlaceholder")}
              className="w-full h-10 pl-10 pr-4 rounded-xl border outline-none transition-all duration-200 text-sm focus:ring-2 focus:ring-white/20"
            />
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 safe-topbar-text">
        <div className="safe-topbar-locale">
          <LocaleSwitcher />
        </div>
        <GlobalTimer cabinetId={cabinetId ?? null} currentUserId={currentUserId} />
        <Link
          href={routes.clientNouveau}
          className="w-9 h-9 rounded-xl flex items-center justify-center text-white/90 hover:bg-white/10 hover:text-white transition-colors duration-200 font-medium"
          title={t("addTitle")}
          aria-label={t("addClient")}
        >
          <Plus className="w-5 h-5" />
        </Link>
        <button
          type="button"
          className="w-9 h-9 rounded-xl flex items-center justify-center text-white/90 hover:bg-white/10 hover:text-white transition-colors duration-200"
          title={t("notifications")}
          aria-label={t("notifications")}
        >
          <Bell className="w-4 h-4" />
        </button>
        <div
          className="w-8 h-8 rounded-full bg-white/18 flex items-center justify-center text-white text-sm font-semibold border border-white/25"
          aria-hidden
        >
          {user?.name?.[0] ?? user?.email?.[0] ?? "?"}
        </div>
        <Link
          href={routes.parametres}
          className="w-9 h-9 rounded-xl flex items-center justify-center text-white/90 hover:bg-white/10 hover:text-white transition-colors duration-200"
          title={t("settings")}
          aria-label={t("settings")}
        >
          <Settings className="w-4 h-4" />
        </Link>
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/" })}
          className="safe-topbar-text-muted ml-1 px-3 py-2 text-sm font-medium rounded-xl transition-colors duration-200 hover:text-white hover:bg-white/10"
        >
          {t("signOut")}
        </button>
      </div>
    </header>
  );
}
