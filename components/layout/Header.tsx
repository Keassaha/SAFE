"use client";

import { useEffect, useRef, useState } from "react";
import { signOutClient } from "@/lib/auth/sign-out-client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Search,
  Menu,
  Settings,
  LogOut,
  User as UserIcon,
  LayoutDashboard,
  Users,
  FolderOpen,
  Receipt,
  BookOpen,
  BarChart3,
  Upload,
  Clock,
  ChevronDown,
  Wrench,
  Briefcase,
  Wallet,
  FileText,
  Building2,
  LifeBuoy,
  GitBranch,
  Flame,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { routes } from "@/lib/routes";
import { GlobalTimer } from "@/components/temps/GlobalTimer";
import { LocaleSwitcher } from "@/components/layout/LocaleSwitcher";
import { motion, AnimatePresence } from "framer-motion";

interface HeaderProps {
  title?: string;
  user?: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
    id?: string;
  };
  cabinetId?: string | null;
  hasUnreadNotifications?: boolean;
  onOpenMobileNav?: () => void;
  billingMode?: "forfait" | "horaire" | "mixed";
  activeNavIds?: string[] | null;
  role?: string;
  isSafeInc?: boolean;
}

/* ───────────────────────────────────────────────────────────
 *  Nav spec — groupes éditoriaux
 *  ─────────────────────────────────────────────────────────── */

type NavChild = {
  labelKey?: string;
  label?: string; // Libellé littéral (mode consultant, sans i18n)
  href: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  descriptionKey?: string;
  description?: string; // Description littérale (mode consultant)
};

type NavGroup =
  | {
      id: string;
      labelKey?: string;
      label?: string;
      href: string;
      icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
    }
  | {
      id: string;
      labelKey?: string;
      label?: string;
      icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
      children: NavChild[];
      matchPrefixes: string[];
    };

const NAV: NavGroup[] = [
  {
    id: "dashboard",
    labelKey: "navDashboard",
    href: routes.tableauDeBord,
    icon: LayoutDashboard,
  },
  {
    id: "pratique",
    labelKey: "navPractice",
    icon: Briefcase,
    matchPrefixes: [routes.clients, routes.dossiers, routes.employees],
    children: [
      {
        labelKey: "navClients",
        href: routes.clients,
        icon: Users,
        descriptionKey: "navClientsDesc",
      },
      {
        labelKey: "navMatters",
        href: routes.dossiers,
        icon: FolderOpen,
        descriptionKey: "navMattersDesc",
      },
      {
        labelKey: "navEmployees",
        href: routes.employees,
        icon: Users,
        descriptionKey: "navEmployeesDesc",
      },
    ],
  },
  {
    id: "finances",
    labelKey: "navFinances",
    icon: Wallet,
    matchPrefixes: [routes.facturation, routes.comptabilite, routes.comptes],
    children: [
      {
        labelKey: "navBilling",
        href: routes.facturation,
        icon: Receipt,
        descriptionKey: "navBillingDesc",
      },
      {
        labelKey: "navAccounting",
        href: routes.comptabilite,
        icon: BookOpen,
        descriptionKey: "navAccountingDesc",
      },
      {
        labelKey: "navTrust",
        href: routes.comptes,
        icon: Wallet,
        descriptionKey: "navTrustDesc",
      },
      {
        labelKey: "navTimeFees",
        href: routes.temps,
        icon: Clock,
        descriptionKey: "navTimeFeesDesc",
      },
    ],
  },
  {
    id: "outils",
    labelKey: "navTools",
    icon: Wrench,
    matchPrefixes: [
      routes.edition,
      routes.rapports,
      routes.safeImport,
    ],
    children: [
      {
        labelKey: "navEdition",
        href: routes.edition,
        icon: FileText,
        descriptionKey: "navEditionDesc",
      },
      {
        labelKey: "navReports",
        href: routes.rapports,
        icon: BarChart3,
        descriptionKey: "navReportsDesc",
      },
      {
        labelKey: "navSafeImport",
        href: routes.safeImport,
        icon: Upload,
        descriptionKey: "navSafeImportDesc",
      },
    ],
  },
  {
    id: "parametres",
    labelKey: "navSettings",
    href: routes.parametres,
    icon: Settings,
  },
];

/* ───────────────────────────────────────────────────────────
 *  Menu consultant unifié (mode SAFE Inc. dog food)
 *  Spec : docs/product/CONSOLE_CONSULTANT_REFACTOR_v1.md
 *  Remplace entièrement le menu cabinet quand isSafeInc = true.
 *  ─────────────────────────────────────────────────────────── */

const CONSULTANT_NAV: NavGroup[] = [
  {
    id: "console-dashboard",
    label: "Tableau de bord",
    href: "/console",
    icon: LayoutDashboard,
  },
  {
    id: "console-safe-lead",
    label: "SAFE Lead",
    href: "/console/safe-lead",
    icon: Flame,
  },
  {
    id: "console-clients",
    label: "Clients",
    href: "/console/clients",
    icon: Building2,
  },
  {
    id: "console-pipeline",
    label: "Pipeline",
    href: "/console/pipeline",
    icon: GitBranch,
  },
  {
    id: "console-finances",
    label: "Finances",
    icon: Wallet,
    matchPrefixes: [routes.facturation, routes.comptabilite, routes.temps],
    children: [
      {
        label: "Facturation",
        description: "Abonnements facturés aux cabinets",
        href: routes.facturation,
        icon: Receipt,
      },
      {
        label: "Comptabilité",
        description: "Comptabilité de SAFE Inc.",
        href: routes.comptabilite,
        icon: BookOpen,
      },
      {
        label: "Services de consultant",
        description: "Prestations et honoraires de conseil",
        href: routes.temps,
        icon: Clock,
      },
    ],
  },
  {
    id: "console-support",
    label: "Support",
    href: "/console/support",
    icon: LifeBuoy,
  },
  {
    id: "console-parametres",
    label: "Paramètres",
    href: routes.parametres,
    icon: Settings,
  },
];

function isGroupActive(group: NavGroup, pathname: string): boolean {
  if ("href" in group) {
    return pathname === group.href || pathname.startsWith(`${group.href}/`);
  }
  return group.matchPrefixes.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}

function isChildActive(href: string, pathname: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

/* ───────────────────────────────────────────────────────────
 *  Header
 *  ─────────────────────────────────────────────────────────── */

export function Header({
  user,
  cabinetId,
  onOpenMobileNav,
  billingMode,
  isSafeInc,
}: HeaderProps) {
  const t = useTranslations("shell.header");
  const tMisc = useTranslations("miscUi");
  const pathname = usePathname();

  // Mode consultant (SAFE Inc.) : menu unifié au lieu du menu cabinet.
  const navGroups = isSafeInc ? CONSULTANT_NAV : NAV;
  // Résout le libellé : littéral (consultant) ou clé i18n (cabinet).
  const navLabel = (o: { label?: string; labelKey?: string }) =>
    o.label ?? (o.labelKey ? tMisc(o.labelKey) : "");
  const currentUserId = (user as { id?: string })?.id ?? "";
  const initial = (user?.name ?? user?.email ?? "?")[0].toUpperCase();
  const displayName =
    user?.name ?? user?.email?.split("@")[0] ?? tMisc("defaultUserName");

  const [openGroupId, setOpenGroupId] = useState<string | null>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const navRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // ⌘K focuses search
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

  // Close dropdowns on outside click / Escape / route change
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setOpenGroupId(null);
      }
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(e.target as Node)
      ) {
        setUserMenuOpen(false);
      }
    };
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpenGroupId(null);
        setUserMenuOpen(false);
      }
    };
    window.addEventListener("mousedown", onClick);
    window.addEventListener("keydown", onEsc);
    return () => {
      window.removeEventListener("mousedown", onClick);
      window.removeEventListener("keydown", onEsc);
    };
  }, []);

  useEffect(() => {
    setOpenGroupId(null);
    setUserMenuOpen(false);
  }, [pathname]);

  return (
    <header
      className="shrink-0 flex items-center justify-between px-4 md:px-6 gap-4 h-16 border-b-[0.5px] bg-si-surface/95 backdrop-blur-sm z-30 relative"
      style={{ borderBottomColor: "var(--si-line)" }}
    >
      {/* ── LEFT: Mobile menu + Logo + Cabinet ───────────────── */}
      <div className="flex items-center gap-4 min-w-0">
        {onOpenMobileNav ? (
          <button
            type="button"
            onClick={onOpenMobileNav}
            className="shrink-0 lg:hidden p-1.5 -ml-1.5 rounded-md hover:bg-[var(--si-canvas)] transition-colors"
            aria-label={t("openMenu")}
          >
            <Menu className="w-5 h-5 text-text-body" strokeWidth={1.75} />
          </button>
        ) : null}

        <Link
          href={routes.tableauDeBord}
          className="flex items-center gap-2.5 rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-si-forest/30"
          aria-label={tMisc("logoHomeAria")}
        >
          <span
            aria-hidden
            className="flex items-center justify-center rounded-[7px] bg-si-forest text-si-surface font-serif leading-none"
            style={{ width: 28, height: 28, fontSize: 17 }}
          >
            S
          </span>
          <span className="hidden sm:block font-serif text-[17px] tracking-[-0.02em] text-si-ink">
            Safe
          </span>
        </Link>

        <span
          className="hidden xl:block w-px h-6"
          style={{ background: "var(--si-line)" }}
        />

        <span className="hidden xl:block text-[13px] font-sans font-medium text-text-body truncate max-w-[200px]">
          {user?.name ?? tMisc("myFirm")}
        </span>
      </div>

      {/* ── CENTER: Navigation groups with dropdowns ─────────── */}
      <nav
        ref={navRef}
        className="flex-1 hidden lg:flex items-center justify-center gap-1"
        aria-label={tMisc("mainNavigationAria")}
      >
        {navGroups.map((group) => {
          const active = isGroupActive(group, pathname);
          const Icon = group.icon;

          // Simple link group
          if ("href" in group) {
            return (
              <Link
                key={group.id}
                href={group.href}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[7px] text-[13px] font-sans font-medium transition-colors ${
                  active
                    ? "bg-[var(--si-canvas)] text-text-primary"
                    : "text-text-muted hover:text-text-primary hover:bg-si-canvas/60"
                }`}
                aria-current={active ? "page" : undefined}
              >
                <Icon className="w-4 h-4" strokeWidth={1.75} />
                {navLabel(group)}
              </Link>
            );
          }

          // Dropdown group
          const isOpen = openGroupId === group.id;
          return (
            <div key={group.id} className="relative">
              <button
                type="button"
                onClick={() => setOpenGroupId(isOpen ? null : group.id)}
                onMouseEnter={() => setOpenGroupId(group.id)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[7px] text-[13px] font-sans font-medium transition-colors ${
                  active || isOpen
                    ? "bg-[var(--si-canvas)] text-text-primary"
                    : "text-text-muted hover:text-text-primary hover:bg-si-canvas/60"
                }`}
                aria-haspopup="menu"
                aria-expanded={isOpen}
              >
                <Icon className="w-4 h-4" strokeWidth={1.75} />
                {navLabel(group)}
                <motion.span
                  animate={{ rotate: isOpen ? 180 : 0 }}
                  transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                  className="flex items-center"
                >
                  <ChevronDown
                    className="w-3.5 h-3.5 text-si-muted"
                    strokeWidth={1.75}
                  />
                </motion.span>
              </button>

              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                    role="menu"
                    onMouseLeave={() => setOpenGroupId(null)}
                    className="absolute left-1/2 -translate-x-1/2 mt-2 w-[320px] bg-surface border border-[0.5px] border-border rounded-[10px] shadow-[0_20px_60px_-20px_rgba(15,23,42,0.25)] overflow-hidden"
                  >
                    <span
                      aria-hidden
                      className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-si-forest to-transparent"
                    />
                    <div className="px-4 pt-4 pb-2">
                      <span className="text-[10.5px] font-sans uppercase tracking-[0.15em] text-si-forest font-medium">
                        {navLabel(group)}
                      </span>
                    </div>
                    <ul role="list" className="pb-2">
                      {group.children.map((child) => {
                        const ChildIcon = child.icon;
                        const childActive = isChildActive(
                          child.href,
                          pathname,
                        );
                        return (
                          <li key={child.href}>
                            <Link
                              href={child.href}
                              role="menuitem"
                              className={`group flex items-start gap-3 px-4 py-2.5 transition-colors ${
                                childActive
                                  ? "bg-si-forest/5"
                                  : "hover:bg-[var(--si-canvas)]"
                              }`}
                              onClick={() => setOpenGroupId(null)}
                            >
                              <span
                                className={`shrink-0 mt-0.5 w-7 h-7 rounded-[7px] flex items-center justify-center border border-[0.5px] transition-colors ${
                                  childActive
                                    ? "bg-si-forest border-si-forest text-white"
                                    : "bg-[var(--si-canvas)] border-border text-si-forest group-hover:bg-si-forest/10 group-hover:border-si-forest/30"
                                }`}
                              >
                                <ChildIcon
                                  className="w-3.5 h-3.5"
                                  strokeWidth={1.75}
                                />
                              </span>
                              <span className="min-w-0 flex-1">
                                <span
                                  className={`block text-[13px] font-sans font-medium leading-tight ${
                                    childActive
                                      ? "text-si-forest"
                                      : "text-text-primary"
                                  }`}
                                >
                                  {navLabel(child)}
                                </span>
                                {(child.description ?? child.descriptionKey) && (
                                  <span className="block text-[11.5px] font-sans text-text-muted mt-0.5 leading-[1.4]">
                                    {child.description ??
                                      (child.descriptionKey ? tMisc(child.descriptionKey) : "")}
                                  </span>
                                )}
                              </span>
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </nav>

      {/* ── RIGHT: Search, Locale, Timer, User menu ──────────── */}
      <div className="flex items-center gap-2 lg:gap-3 shrink-0">
        <div className="relative hidden md:block w-44 lg:w-56">
          <Search
            className="absolute left-2.5 top-1/2 -translate-y-1/2 w-[14px] h-[14px] text-si-muted"
            strokeWidth={1.75}
          />
          <input
            id="header-search"
            type="search"
            placeholder={t("searchPlaceholder")}
            aria-label={t("searchLabel")}
            className="w-full h-[32px] pl-8 pr-10 rounded-[7px] bg-[var(--si-canvas)] border border-[0.5px] border-border text-[12.5px] font-sans text-text-body outline-none focus:border-si-forest/40 focus:bg-surface transition-all placeholder:text-si-muted"
          />
          <kbd className="absolute right-2 top-1/2 -translate-y-1/2 px-1 bg-surface border border-[0.5px] border-border text-si-muted text-[9px] font-mono rounded pointer-events-none uppercase">
            ⌘K
          </kbd>
        </div>

        <div className="safe-topbar-locale scale-90 origin-right">
          <LocaleSwitcher />
        </div>

        {billingMode !== "forfait" && (
          <div className="scale-90 origin-right">
            <GlobalTimer
              cabinetId={cabinetId ?? null}
              currentUserId={currentUserId}
            />
          </div>
        )}

        {/* User menu */}
        <div className="relative" ref={userMenuRef}>
          <button
            type="button"
            onClick={() => setUserMenuOpen((v) => !v)}
            className="w-[32px] h-[32px] rounded-full bg-si-forest flex items-center justify-center text-white text-[12px] font-semibold hover:opacity-90 transition-opacity ml-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-si-forest/40"
            aria-label={displayName}
            aria-haspopup="menu"
            aria-expanded={userMenuOpen}
          >
            {initial}
          </button>

          <AnimatePresence>
            {userMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: -6, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.98 }}
                transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                role="menu"
                className="absolute right-0 mt-2 w-64 bg-surface border border-[0.5px] border-border rounded-[10px] shadow-[0_20px_60px_-20px_rgba(15,23,42,0.25)] overflow-hidden z-50"
              >
                <div className="px-4 py-3 border-b border-[0.5px] border-border/70 bg-si-canvas/60">
                  <p className="text-[11px] font-sans uppercase tracking-[0.12em] text-si-forest font-medium">
                    {tMisc("account")}
                  </p>
                  <p className="font-serif text-[15px] text-text-primary mt-1 truncate">
                    {displayName}
                  </p>
                  {user?.email && (
                    <p className="text-[12px] font-sans text-text-muted truncate mt-0.5">
                      {user.email}
                    </p>
                  )}
                </div>

                <div className="py-1.5">
                  <Link
                    href={routes.parametres}
                    role="menuitem"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-2 text-[13px] font-sans text-text-body hover:bg-[var(--si-canvas)] hover:text-text-primary transition-colors"
                  >
                    <Settings className="w-4 h-4" strokeWidth={1.75} />
                    {t("settings")}
                  </Link>
                  <Link
                    href={routes.parametres}
                    role="menuitem"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-2 text-[13px] font-sans text-text-body hover:bg-[var(--si-canvas)] hover:text-text-primary transition-colors"
                  >
                    <UserIcon className="w-4 h-4" strokeWidth={1.75} />
                    {tMisc("myProfile")}
                  </Link>
                </div>

                <div className="border-t border-[0.5px] border-border/70 py-1.5">
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setUserMenuOpen(false);
                      void signOutClient("/");
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2 text-[13px] font-sans text-[#B84A3E] hover:bg-[#B84A3E]/5 transition-colors"
                  >
                    <LogOut className="w-4 h-4" strokeWidth={1.75} />
                    {t("signOut")}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
