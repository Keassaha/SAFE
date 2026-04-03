"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import type { UserRole } from "@prisma/client";
import {
  LayoutDashboard,
  Users,
  FolderOpen,
  Clock,
  FileText,
  Receipt,
  BookOpen,
  BarChart3,
  Scale,
  ChevronRight,
  ChevronDown,
  User,
  Wallet,
  ScrollText,
  Calculator,
  Upload,
  Settings,
  CalendarDays,
  Wrench,
  CreditCard,
  CheckCircle,
  Eye,
  FileCheck,
  FileMinus,
  Coins,
} from "lucide-react";
import {
  canViewClients,
  canViewDossiers,
  canManageDossiers,
  canManageInvoices,
  canManageExpenseJournal,
  canViewBillingTrust,
  canViewReports,
  canViewEmployees,
  canViewDocuments,
} from "@/lib/auth/permissions";
import { routes } from "@/lib/routes";

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */

type SubItem = {
  href: string;
  labelKey: string;
  icon: React.ComponentType<{ className?: string }>;
  show: (role: UserRole) => boolean;
};

type NavItem = {
  id: string;
  href: string;
  labelKey: string;
  icon: React.ComponentType<{ className?: string }>;
  show: (role: UserRole) => boolean;
  exactMatch?: boolean;
  children?: SubItem[];
};

/* -------------------------------------------------------------------------- */
/*  Navigation config — flat list, expandable children                        */
/* -------------------------------------------------------------------------- */

const NAV_ITEMS: NavItem[] = [
  {
    id: "dashboard",
    href: routes.tableauDeBord,
    labelKey: "nav.dashboard",
    icon: LayoutDashboard,
    show: () => true,
  },
  {
    id: "clients",
    href: routes.clients,
    labelKey: "nav.clients",
    icon: Users,
    show: canViewClients,
  },
  {
    id: "dossiers",
    href: routes.dossiers,
    labelKey: "nav.matters",
    icon: FolderOpen,
    show: canViewDossiers,
  },
  {
    id: "temps",
    href: routes.temps,
    labelKey: "nav.timesheets",
    icon: Clock,
    show: () => true,
  },
  {
    id: "facturation",
    href: routes.facturation,
    labelKey: "nav.billing",
    icon: FileText,
    show: canManageInvoices,
    exactMatch: true,
    children: [
      { href: routes.facturationHonoraires, labelKey: "nav.billableFees", icon: Coins, show: canManageInvoices },
      { href: routes.facturationVerification, labelKey: "nav.verification", icon: CheckCircle, show: canManageInvoices },
      { href: routes.facturationSuivi, labelKey: "nav.followUp", icon: Eye, show: canManageInvoices },
      { href: routes.facturationPaiements, labelKey: "nav.payments", icon: CreditCard, show: canManageInvoices },
      { href: routes.facturationNotesCredit, labelKey: "nav.creditNotes", icon: FileMinus, show: canManageInvoices },
      { href: routes.facturationFrais, labelKey: "nav.disbursements", icon: Receipt, show: canManageInvoices },
    ],
  },
  {
    id: "comptabilite",
    href: routes.comptabilite,
    labelKey: "nav.comptabilite",
    icon: BookOpen,
    show: (role) => canManageExpenseJournal(role) || canManageInvoices(role),
    children: [
      { href: routes.comptes, labelKey: "nav.trustAccounts", icon: Wallet, show: canViewBillingTrust },
    ],
  },
  {
    id: "outils",
    href: routes.rapports,
    labelKey: "sections.tools",
    icon: Wrench,
    show: () => true,
    exactMatch: true,
    children: [
      { href: routes.rapports, labelKey: "nav.reports", icon: BarChart3, show: canViewReports },
      { href: routes.gestionLexTrack, labelKey: "nav.planning", icon: CalendarDays, show: canManageDossiers },
      { href: routes.outilsGenerateurDocuments, labelKey: "nav.documentGenerator", icon: ScrollText, show: canViewDocuments },
      { href: routes.outilsCalculateurFamilial, labelKey: "nav.familyCalculator", icon: Calculator, show: canViewDocuments },
      { href: routes.safeImport, labelKey: "nav.safeImport", icon: Upload, show: () => true },
      { href: routes.employees, labelKey: "nav.employees", icon: Users, show: (role) => canViewEmployees(role as UserRole) },
    ],
  },
  {
    id: "parametres",
    href: routes.parametres,
    labelKey: "nav.settings",
    icon: Settings,
    show: () => true,
  },
];

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                   */
/* -------------------------------------------------------------------------- */

function isPathActive(pathname: string, href: string, exact?: boolean): boolean {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(href + "/");
}

function getExpandedId(pathname: string): string | null {
  for (const item of NAV_ITEMS) {
    if (!item.children) continue;
    if (isPathActive(pathname, item.href)) return item.id;
    for (const child of item.children) {
      if (isPathActive(pathname, child.href)) return item.id;
    }
  }
  return null;
}

/* -------------------------------------------------------------------------- */
/*  SidebarNavItem                                                            */
/* -------------------------------------------------------------------------- */

function NavLink({
  href,
  label,
  icon: Icon,
  isActive,
  isSubItem,
  hasChildren,
  isExpanded,
  onToggle,
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  isActive: boolean;
  isSubItem?: boolean;
  hasChildren?: boolean;
  isExpanded?: boolean;
  onToggle?: () => void;
}) {
  const content = (
    <>
      <span
        className={`
          flex w-9 h-9 shrink-0 items-center justify-center rounded-lg transition-colors duration-200
          ${isActive && !isSubItem ? "bg-green-700 text-white shadow-sm" : ""}
          ${isActive && isSubItem ? "bg-white/10 text-green-400" : ""}
          ${!isActive ? "text-white/50 group-hover:text-white group-hover:bg-white/10" : ""}
        `}
      >
        <Icon className={`w-[18px] h-[18px] ${isActive ? "[stroke-width:2.2]" : "[stroke-width:1.8]"}`} />
      </span>
      <span
        className={`
          flex-1 min-w-0 truncate text-[13.5px] font-medium leading-none
          ${isActive ? "text-white font-semibold" : "text-white/70 group-hover:text-white"}
        `}
      >
        {label}
      </span>
      {hasChildren && (
        <span className="shrink-0 text-white/40 transition-transform duration-200">
          {isExpanded ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
        </span>
      )}
    </>
  );

  const baseClasses = `
    group relative flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl
    transition-all duration-200 cursor-pointer
    ${isSubItem ? "ml-5 pl-3" : ""}
    ${isActive && !isSubItem ? "bg-white/10" : ""}
    ${isActive && isSubItem ? "bg-white/5" : ""}
    ${!isActive ? "hover:bg-white/[0.07]" : ""}
  `;

  if (hasChildren && onToggle) {
    return (
      <button
        type="button"
        onClick={onToggle}
        className={`${baseClasses} w-full text-left`}
        aria-expanded={isExpanded}
      >
        {content}
      </button>
    );
  }

  return (
    <Link
      href={href}
      className={baseClasses}
      aria-current={isActive ? "page" : undefined}
    >
      {content}
    </Link>
  );
}

/* -------------------------------------------------------------------------- */
/*  Sidebar                                                                   */
/* -------------------------------------------------------------------------- */

export function Sidebar({ role }: { role?: string }) {
  const t = useTranslations("shell.sidebar");
  const pathname = usePathname();
  const userRole = (role as UserRole) ?? "avocat";

  const [expandedId, setExpandedId] = useState<string | null>(() => getExpandedId(pathname));

  useEffect(() => {
    const active = getExpandedId(pathname);
    if (active) setExpandedId(active);
  }, [pathname]);

  const toggleExpand = useCallback((id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  }, []);

  return (
    <aside className="relative h-full w-[260px] flex flex-col shrink-0 hidden lg:flex bg-green-950 overflow-hidden z-10">
      {/* ---- Logo ---- */}
      <div className="flex items-center gap-3 px-5 pt-6 pb-5">
        <Link
          href={routes.tableauDeBord}
          className="flex items-center gap-3 transition-opacity duration-200 hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-green-700/30 rounded-lg"
        >
          <div className="w-9 h-9 bg-green-700 rounded-xl flex items-center justify-center shadow-sm">
            <Scale className="w-5 h-5 text-white" strokeWidth={2} />
          </div>
          <span className="font-heading font-bold text-[22px] tracking-tight text-white">
            SAFE
          </span>
        </Link>
      </div>

      {/* ---- Navigation ---- */}
      <nav className="flex-1 overflow-y-auto px-3 pb-3 hide-scrollbar" aria-label={t("navigationLabel")}>
        <ul className="flex flex-col gap-0.5" role="list">
          {NAV_ITEMS.map((item) => {
            if (!item.show(userRole)) return null;

            const visibleChildren = item.children?.filter((c) => c.show(userRole)) ?? [];
            const hasChildren = visibleChildren.length > 0;
            const isExpanded = expandedId === item.id;

            // Check if this item or any child is active
            const isParentActive = isPathActive(pathname, item.href, item.exactMatch);
            const anyChildActive = visibleChildren.some((c) => isPathActive(pathname, c.href));
            const isActive = isParentActive || anyChildActive;

            return (
              <li key={item.id}>
                <NavLink
                  href={item.href}
                  label={t(item.labelKey)}
                  icon={item.icon}
                  isActive={isActive}
                  hasChildren={hasChildren}
                  isExpanded={isExpanded}
                  onToggle={hasChildren ? () => toggleExpand(item.id) : undefined}
                />

                {/* Sub-items with smooth expand */}
                {hasChildren && isExpanded && (
                  <ul
                    className="flex flex-col gap-0.5 mt-0.5 animate-fade-in"
                    role="list"
                  >
                    {/* Link to parent page when it has children */}
                    {!item.exactMatch && (
                      <li>
                        <NavLink
                          href={item.href}
                          label={t(item.labelKey)}
                          icon={item.icon}
                          isActive={isParentActive && !anyChildActive}
                          isSubItem
                        />
                      </li>
                    )}
                    {visibleChildren.map((child) => (
                      <li key={child.href}>
                        <NavLink
                          href={child.href}
                          label={t(child.labelKey)}
                          icon={child.icon}
                          isActive={isPathActive(pathname, child.href)}
                          isSubItem
                        />
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      </nav>

      {/* ---- Bottom section ---- */}
      <div className="px-3 pb-4 pt-2 border-t border-white/10 space-y-3">
        {/* Pro CTA */}
        <div className="bg-white/[0.07] rounded-2xl p-4 relative overflow-hidden border border-white/10">
          <h4 className="text-white/90 font-semibold text-[13px] leading-snug mb-2.5">
            Passez à la vitesse supérieure avec SAFE Pro.
          </h4>
          <button className="bg-green-700 text-white font-semibold text-xs px-3.5 py-2 rounded-lg hover:brightness-110 transition-all shadow-sm">
            Découvrir Pro
          </button>
          <div className="absolute -right-4 -bottom-4 w-20 h-20 border-[10px] border-white/5 rounded-full pointer-events-none" />
        </div>

        {/* Profile link */}
        <Link
          href={routes.parametres}
          className="
            flex items-center gap-2.5 px-2.5 py-2
            rounded-xl bg-white/[0.07] hover:bg-white/10
            transition-colors duration-200 border border-white/10
            focus:outline-none focus:ring-2 focus:ring-green-700/30
          "
        >
          <span className="flex w-8 h-8 shrink-0 items-center justify-center rounded-full bg-green-700/20 border border-green-700/30">
            <User className="w-4 h-4 text-green-400" />
          </span>
          <div className="min-w-0 flex-1">
            <span className="block text-[13px] font-semibold leading-none text-white truncate">
              {t("profile.title")}
            </span>
            <span className="block text-[11px] leading-none text-white/50 truncate mt-1">
              {t("profile.subtitle")}
            </span>
          </div>
          <ChevronRight className="h-3.5 w-3.5 shrink-0 text-white/40" />
        </Link>
      </div>
    </aside>
  );
}
