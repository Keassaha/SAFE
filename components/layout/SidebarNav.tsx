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
  FileMinus,
  Coins,
  ListChecks,
  ShieldCheck,
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

type SubItem = {
  id?: string; // Optional id for CabinetInterface filtering. Defaults to a slug derived from href.
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
    labelKey: "nav.timesheets", // Overridden dynamically for forfait mode
    icon: Clock, // Overridden dynamically for forfait mode
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
      { id: "facturation-honoraires", href: routes.facturationHonoraires, labelKey: "nav.billableFees", icon: Coins, show: canManageInvoices },
      { id: "facturation-verification", href: routes.facturationVerification, labelKey: "nav.verification", icon: CheckCircle, show: canManageInvoices },
      { id: "facturation-suivi", href: routes.facturationSuivi, labelKey: "nav.followUp", icon: Eye, show: canManageInvoices },
      { id: "facturation-paiements", href: routes.facturationPaiements, labelKey: "nav.payments", icon: CreditCard, show: canManageInvoices },
      { id: "facturation-notes-credit", href: routes.facturationNotesCredit, labelKey: "nav.creditNotes", icon: FileMinus, show: canManageInvoices },
      { id: "facturation-frais", href: routes.facturationFrais, labelKey: "nav.disbursements", icon: Receipt, show: canManageInvoices },
    ],
  },
  {
    id: "comptabilite",
    href: routes.comptabilite,
    labelKey: "nav.comptabilite",
    icon: BookOpen,
    show: (role) => canManageExpenseJournal(role) || canManageInvoices(role),
    children: [{ id: "comptes", href: routes.comptes, labelKey: "nav.trustAccounts", icon: Wallet, show: canViewBillingTrust }],
  },
  {
    id: "documents",
    href: routes.outilsGenerateurDocuments,
    labelKey: "nav.documentGenerator",
    icon: ScrollText,
    show: canViewDocuments,
  },
  {
    id: "conformite",
    href: "/conformite",
    labelKey: "nav.compliance",
    icon: ShieldCheck,
    show: () => true,
  },
  {
    id: "outils",
    href: routes.rapports,
    labelKey: "sections.tools",
    icon: Wrench,
    show: () => true,
    exactMatch: true,
    children: [
      { id: "rapports", href: routes.rapports, labelKey: "nav.reports", icon: BarChart3, show: canViewReports },
      { id: "planning", href: routes.gestionLexTrack, labelKey: "nav.planning", icon: CalendarDays, show: canManageDossiers },
      { id: "outils-calculateur-familial", href: routes.outilsCalculateurFamilial, labelKey: "nav.familyCalculator", icon: Calculator, show: canViewDocuments },
      { id: "safe-import", href: routes.safeImport, labelKey: "nav.safeImport", icon: Upload, show: () => true },
      { id: "employees", href: routes.employees, labelKey: "nav.employees", icon: Users, show: (role) => canViewEmployees(role as UserRole) },
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

/**
 * Filter NAV_ITEMS by CabinetInterface settings.
 *
 * - If `activeNavIds` is provided (whitelist), only items whose id matches are kept.
 * - Items whose id is in `hiddenNavIds` (blacklist) are filtered out.
 * - Children are filtered by their id (or href slug fallback) using the same rules.
 *
 * Whitelist takes precedence: if both are set, an id must be in `activeNavIds`
 * AND not in `hiddenNavIds` to be visible.
 */
function filterByCabinetInterface(
  items: NavItem[],
  activeNavIds: string[] | null | undefined,
  hiddenNavIds: string[] | undefined
): NavItem[] {
  const hidden = new Set(hiddenNavIds ?? []);
  const active = activeNavIds && activeNavIds.length > 0 ? new Set(activeNavIds) : null;

  return items
    .filter((item) => {
      if (hidden.has(item.id)) return false;
      if (active && !active.has(item.id)) return false;
      return true;
    })
    .map((item) => {
      if (!item.children) return item;
      const filteredChildren = item.children.filter((c) => {
        const cid = c.id ?? c.href;
        if (hidden.has(cid)) return false;
        // Children are not subject to the active whitelist (parent already passed it)
        return true;
      });
      return { ...item, children: filteredChildren };
    });
}

export function isPathActive(pathname: string, href: string, exact?: boolean): boolean {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function getExpandedId(pathname: string): string | null {
  for (const item of NAV_ITEMS) {
    if (!item.children) continue;
    if (isPathActive(pathname, item.href)) return item.id;
    for (const child of item.children) {
      if (isPathActive(pathname, child.href)) return item.id;
    }
  }
  return null;
}

function NavLink({
  href,
  label,
  icon: Icon,
  isActive,
  isSubItem,
  hasChildren,
  isExpanded,
  onToggle,
  onNavigate,
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  isActive: boolean;
  isSubItem?: boolean;
  hasChildren?: boolean;
  isExpanded?: boolean;
  onToggle?: () => void;
  onNavigate?: () => void;
}) {
  const content = (
    <>
      <span
        className={`
          flex w-9 h-9 shrink-0 items-center justify-center rounded-safe-sm transition-colors duration-200
          ${isActive && !isSubItem ? "bg-green-700 text-white shadow-sm" : ""}
          ${isActive && isSubItem ? "bg-white/10 text-green-400" : ""}
          ${!isActive ? "text-white/50 group-hover:text-white group-hover:bg-white/10" : ""}
        `}
      >
        <Icon className={`w-[18px] h-[18px] ${isActive ? "[stroke-width:2.2]" : "[stroke-width:1.8]"}`} />
      </span>
      <span
        className={`
          flex-1 min-w-0 truncate text-sm font-medium leading-none
          ${isActive ? "text-white font-semibold" : "text-white/70 group-hover:text-white"}
        `}
      >
        {label}
      </span>
      {hasChildren && (
        <span className="shrink-0 text-white/40 transition-transform duration-200">
          {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </span>
      )}
    </>
  );

  const baseClasses = `
    group relative flex items-center gap-3 px-3 py-1.5 rounded-safe
    transition-all duration-200 cursor-pointer
    ${isSubItem ? "ml-5 pl-3" : ""}
    ${isActive && !isSubItem ? "bg-white/10" : ""}
    ${isActive && isSubItem ? "bg-white/5" : ""}
    ${!isActive ? "hover:bg-white/[0.07]" : ""}
  `;

  if (hasChildren && onToggle) {
    return (
      <button type="button" onClick={onToggle} className={`${baseClasses} w-full text-left`} aria-expanded={isExpanded}>
        {content}
      </button>
    );
  }

  return (
    <Link href={href} className={baseClasses} aria-current={isActive ? "page" : undefined} onClick={() => onNavigate?.()}>
      {content}
    </Link>
  );
}

export function SidebarNavList({
  role,
  onNavigate,
  navClassName,
  billingMode,
  activeNavIds,
  hiddenNavIds,
}: {
  role?: string;
  onNavigate?: () => void;
  navClassName?: string;
  billingMode?: "forfait" | "horaire";
  activeNavIds?: string[] | null;
  hiddenNavIds?: string[];
}) {
  const t = useTranslations("shell.sidebar");
  const pathname = usePathname();
  const userRole = (role as UserRole) ?? "avocat";
  const isForfait = billingMode === "forfait";
  const [expandedId, setExpandedId] = useState<string | null>(() => getExpandedId(pathname));

  useEffect(() => {
    const active = getExpandedId(pathname);
    if (active) setExpandedId(active);
  }, [pathname]);

  const toggleExpand = useCallback((id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  }, []);

  const visibleItems = filterByCabinetInterface(NAV_ITEMS, activeNavIds, hiddenNavIds);

  return (
    <nav className={navClassName} aria-label={t("navigationLabel")}>
      <ul className="flex flex-col gap-0.5" role="list">
        {visibleItems.map((item) => {
          if (!item.show(userRole)) return null;

          // Override for forfait mode: "temps" → "Task Register"
          const displayLabel = item.id === "temps" && isForfait ? "Task Register" : t(item.labelKey);
          const DisplayIcon = item.id === "temps" && isForfait ? ListChecks : item.icon;

          const visibleChildren = item.children?.filter((c) => c.show(userRole)) ?? [];
          const hasChildren = visibleChildren.length > 0;
          const isExpanded = expandedId === item.id;
          const isParentActive = isPathActive(pathname, item.href, item.exactMatch);
          const anyChildActive = visibleChildren.some((c) => isPathActive(pathname, c.href));
          const isActive = isParentActive || anyChildActive;

          return (
            <li key={item.id}>
              <NavLink
                href={item.href}
                label={displayLabel}
                icon={DisplayIcon}
                isActive={isActive}
                hasChildren={hasChildren}
                isExpanded={isExpanded}
                onToggle={hasChildren ? () => toggleExpand(item.id) : undefined}
                onNavigate={hasChildren ? undefined : onNavigate}
              />

              {hasChildren && isExpanded && (
                <ul className="flex flex-col gap-0.5 mt-0.5 animate-fade-in" role="list">
                  {!item.exactMatch && (
                    <li>
                      <NavLink
                        href={item.href}
                        label={t(item.labelKey)}
                        icon={item.icon}
                        isActive={isParentActive && !anyChildActive}
                        isSubItem
                        onNavigate={onNavigate}
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
                        onNavigate={onNavigate}
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
  );
}

export function SidebarBottomSection({ onNavigate }: { onNavigate?: () => void }) {
  const t = useTranslations("shell.sidebar");

  return (
    <div className="px-3 pb-4 pt-2 border-t border-white/10 space-y-3 shrink-0">
      <div className="bg-white/[0.07] rounded-safe-md p-4 relative overflow-hidden border border-white/10">
        <h4 className="text-white/90 font-semibold text-sm leading-snug mb-2.5 tracking-tight">
          Passez à la vitesse supérieure avec SAFE Pro.
        </h4>
        <button
          type="button"
          className="bg-green-700 text-white font-semibold text-xs px-3.5 py-2 rounded-safe-sm hover:brightness-110 transition-all shadow-sm"
        >
          Découvrir Pro
        </button>
        <div className="absolute -right-4 -bottom-4 w-20 h-20 border-[10px] border-white/5 rounded-full pointer-events-none" />
      </div>

      <Link
        href={routes.parametres}
        onClick={() => onNavigate?.()}
        className="
          flex items-center gap-3 px-3 py-2
          rounded-safe bg-white/[0.07] hover:bg-white/10
          transition-colors duration-200 border border-white/10
          focus:outline-none focus:ring-2 focus:ring-green-700/30
        "
      >
        <span className="flex w-8 h-8 shrink-0 items-center justify-center rounded-full bg-green-700/20 border border-green-700/30">
          <User className="w-4 h-4 text-green-400" />
        </span>
        <div className="min-w-0 flex-1">
          <span className="block text-sm font-semibold leading-none text-white truncate">{t("profile.title")}</span>
          <span className="block text-xs leading-none text-white/50 truncate mt-1">{t("profile.subtitle")}</span>
        </div>
        <ChevronRight className="h-3.5 w-3.5 shrink-0 text-white/40" />
      </Link>
    </div>
  );
}
