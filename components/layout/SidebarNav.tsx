"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
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
  Wallet,
  Upload,
  Settings,
  Wrench,
  CreditCard,
  ListChecks,
  ShieldCheck,
  ClipboardCheck,
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
import type { SidebarCounts } from "@/lib/services/sidebar-counts";
import type { Session } from "next-auth";

type IconProps = {
  className?: string;
  strokeWidth?: number | string;
  style?: React.CSSProperties;
};

type SubItem = {
  id?: string; // Optional id for CabinetInterface filtering. Defaults to a slug derived from href.
  href: string;
  labelKey: string;
  icon: React.ComponentType<IconProps>;
  show: (role: UserRole) => boolean;
};

type NavItem = {
  id: string;
  href: string;
  labelKey: string;
  icon: React.ComponentType<IconProps>;
  show: (role: UserRole) => boolean;
  exactMatch?: boolean;
  children?: SubItem[];
  dividerBefore?: boolean; // Renders a thin separator above this item
};

const NAV_ITEMS: NavItem[] = [
  // ── Tableau de bord (Toujours visible) ────────────────────
  {
    id: "dashboard",
    href: routes.tableauDeBord,
    labelKey: "nav.dashboard",
    icon: LayoutDashboard,
    show: () => true,
  },

  // ── Pratique (Dossiers & Clients & Employés) ──────────────
  {
    id: "gestion",
    href: routes.clients,
    labelKey: "nav.practice",
    icon: FolderOpen,
    show: () => true,
    exactMatch: true,
    dividerBefore: true,
    children: [
      { id: "clients", href: routes.clients, labelKey: "nav.clients", icon: Users, show: canViewClients },
      { id: "dossiers", href: routes.dossiers, labelKey: "nav.matters", icon: FolderOpen, show: canViewDossiers },
      // File assistante — couche assistante active. Visible pour assistante, admin_cabinet, avocat.
      // Doctrine: docs/product/ACTIVE_ASSISTANT_LAYER.md
      {
        id: "file-assistante",
        href: routes.gestionAssistante,
        labelKey: "nav.assistantQueue",
        icon: ClipboardCheck,
        show: (role) => role === "assistante" || role === "admin_cabinet" || role === "avocat",
      },
      { id: "employees", href: routes.employees, labelKey: "nav.employees", icon: Users, show: (role) => canViewEmployees(role as UserRole) },
    ],
  },


  // ── Finances ─────────────────────────────────────────────
  {
    id: "finances",
    href: routes.facturation,
    labelKey: "nav.finances",
    icon: Receipt,
    show: (role) => canManageInvoices(role) || canManageExpenseJournal(role),
    exactMatch: true,
    dividerBefore: true,
    children: [
      { id: "facturation", href: routes.facturation, labelKey: "nav.billing", icon: Receipt, show: canManageInvoices },
      { id: "comptabilite", href: routes.comptabilite, labelKey: "nav.comptabilite", icon: BookOpen, show: (role) => canManageExpenseJournal(role) || canManageInvoices(role) },
      { id: "comptes", href: routes.comptes, labelKey: "nav.trustAccounts", icon: Wallet, show: canViewBillingTrust },
      { id: "temps", href: routes.temps, labelKey: "nav.timesheets", icon: Clock, show: () => true }, // Prestation & honoraires (Temps)
    ],
  },

  // ── Outils ───────────────────────────────────────────────
  {
    id: "outils",
    href: routes.rapports,
    labelKey: "nav.tools",
    icon: Wrench,
    show: () => true,
    exactMatch: true,
    dividerBefore: true,
    children: [
      { id: "edition", href: routes.edition, labelKey: "nav.edition", icon: FileText, show: canViewDocuments },
      { id: "rapports", href: routes.rapports, labelKey: "nav.reports", icon: BarChart3, show: canViewReports },
      { id: "safe-import", href: routes.safeImport, labelKey: "nav.safeImport", icon: Upload, show: () => true },
    ],
  },

  // ── Paramètres ───────────────────────────────────────────
  {
    id: "parametres",
    href: routes.parametres,
    labelKey: "nav.settings",
    icon: Settings,
    show: () => true,
    dividerBefore: true,
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

const SIDEBAR_EXPAND_STORAGE_KEY = "safe.sidebar.expanded";

function loadExpandedFromStorage(): Set<string> | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(SIDEBAR_EXPAND_STORAGE_KEY);
    if (!raw) return null;
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return null;
    return new Set(arr.filter((x) => typeof x === "string"));
  } catch {
    return null;
  }
}

function saveExpandedToStorage(set: Set<string>) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      SIDEBAR_EXPAND_STORAGE_KEY,
      JSON.stringify(Array.from(set))
    );
  } catch {
    /* ignore quota/storage errors */
  }
}

/**
 * Éditorial Chaleureux nav row:
 *   [icon black 1.5px]  [label black]  ...  [count forest green]  [chevron?]
 *
 * Active (parent): white background + 3px forest-green left accent + label semibold
 * Active (sub):    forest-green text (no pill)
 * Hover:           sand-50 background
 */
function NavLink({
  href,
  label,
  icon: Icon,
  isActive,
  isSubItem,
  hasChildren,
  isExpanded,
  count,
  onToggle,
  onNavigate,
}: {
  href: string;
  label: string;
  icon: React.ComponentType<IconProps>;
  isActive: boolean;
  isSubItem?: boolean;
  hasChildren?: boolean;
  isExpanded?: boolean;
  count?: number;
  onToggle?: () => void;
  onNavigate?: () => void;
}) {
  const showActivePill = isActive && !isSubItem;

  const content = (
    <>
      {showActivePill && (
        <span
          aria-hidden
          className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-full"
          style={{ background: "var(--brand-800)" }}
        />
      )}
      <Icon
        className={`w-[18px] h-[18px] shrink-0 ${isActive && isSubItem ? "" : ""}`}
        strokeWidth={isActive ? 2 : 1.5}
        style={{
          color: isActive && isSubItem ? "var(--brand-800)" : "var(--zinc-950)",
        }}
      />
      <span
        className={`flex-1 min-w-0 truncate text-[13.5px] leading-none ${
          isActive ? "font-semibold" : "font-medium"
        }`}
        style={{
          color: isActive && isSubItem ? "var(--brand-800)" : "var(--zinc-950)",
        }}
      >
        {label}
      </span>
      {typeof count === "number" && count > 0 && (
        <span
          className="shrink-0 text-[12px] font-semibold tabular-nums leading-none"
          style={{ color: "var(--brand-800)" }}
        >
          {count}
        </span>
      )}
      {hasChildren && (
        <motion.span
          className="shrink-0 flex items-center justify-center"
          style={{ color: "var(--sand-600)" }}
          animate={{ rotate: isExpanded ? 90 : 0 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        >
          <ChevronRight className="w-3.5 h-3.5" strokeWidth={1.75} />
        </motion.span>
      )}
    </>
  );

  const baseClasses = [
    "group relative flex items-center gap-2.5 rounded-md transition-colors duration-150 cursor-pointer",
    isSubItem ? "ml-6 pl-3 py-1.5 pr-2.5" : "pl-3 pr-2.5 py-2",
    showActivePill ? "bg-white" : "",
    !isActive ? "hover:bg-[var(--sand-50)]" : "",
  ]
    .filter(Boolean)
    .join(" ");

  if (hasChildren && onToggle) {
    return (
      <button
        type="button"
        onClick={onToggle}
        className={`${baseClasses} w-full text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-800)]/40`}
        aria-expanded={isExpanded}
      >
        {content}
      </button>
    );
  }

  return (
    <Link
      href={href}
      className={`${baseClasses} focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-800)]/40`}
      aria-current={isActive ? "page" : undefined}
      onClick={() => onNavigate?.()}
    >
      {content}
    </Link>
  );
}

/** Map nav item id → count key from SidebarCounts. */
function countFor(id: string, counts?: SidebarCounts | null): number | undefined {
  if (!counts) return undefined;
  switch (id) {
    case "clients":
      return counts.clients;
    case "dossiers":
      return counts.dossiers;
    case "facturation":
      return counts.facturation;
    default:
      return undefined;
  }
}

export function SidebarNavList({
  role,
  onNavigate,
  navClassName,
  billingMode,
  activeNavIds,
  hiddenNavIds,
  counts,
}: {
  role?: string;
  onNavigate?: () => void;
  navClassName?: string;
  billingMode?: "forfait" | "horaire";
  activeNavIds?: string[] | null;
  hiddenNavIds?: string[];
  counts?: SidebarCounts | null;
}) {
  const t = useTranslations("shell.sidebar");
  const pathname = usePathname();
  const userRole = (role as UserRole) ?? "avocat";
  const isForfait = billingMode === "forfait";

  // État multi-collapse : plusieurs groupes peuvent être ouverts en parallèle.
  // Hydratation côté client depuis localStorage + auto-ouverture du groupe actif.
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => {
    const set = new Set<string>();
    const active = getExpandedId(pathname);
    if (active) set.add(active);
    return set;
  });

  // Charge l'état persisté au montage (évite mismatch SSR).
  useEffect(() => {
    const stored = loadExpandedFromStorage();
    const active = getExpandedId(pathname);
    setExpandedIds((prev) => {
      const next = new Set<string>(stored ?? prev);
      if (active) next.add(active); // garde toujours le groupe actif ouvert
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-ouvre le groupe du chemin actif à chaque navigation.
  useEffect(() => {
    const active = getExpandedId(pathname);
    if (!active) return;
    setExpandedIds((prev) => {
      if (prev.has(active)) return prev;
      const next = new Set(prev);
      next.add(active);
      saveExpandedToStorage(next);
      return next;
    });
  }, [pathname]);

  const toggleExpand = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      saveExpandedToStorage(next);
      return next;
    });
  }, []);

  const visibleItems = filterByCabinetInterface(NAV_ITEMS, activeNavIds, hiddenNavIds);

  return (
    <nav className={navClassName} aria-label={t("navigationLabel")}>
      <ul className="flex flex-col gap-0.5" role="list">
        {visibleItems.map((item) => {
          if (!item.show(userRole)) return null;

          // Override for forfait mode: "temps" → "Fiche de temps" / "Task Register" (task register view)
          const displayLabel = item.id === "temps" && isForfait ? t("nav.taskRegister") : t(item.labelKey);
          const DisplayIcon = item.id === "temps" && isForfait ? ListChecks : item.icon;

          const visibleChildren = item.children?.filter((c) => c.show(userRole)) ?? [];
          const hasChildren = visibleChildren.length > 0;
          const isExpanded = expandedIds.has(item.id);
          const isParentActive = isPathActive(pathname, item.href, item.exactMatch);
          const anyChildActive = visibleChildren.some((c) => isPathActive(pathname, c.href));
          const isActive = isParentActive || anyChildActive;

          return (
            <li key={item.id}>
              {item.dividerBefore && (
                <hr
                  className="my-2 border-0 h-px"
                  style={{ background: "var(--sand-400)" }}
                />
              )}
              <NavLink
                href={item.href}
                label={displayLabel}
                icon={DisplayIcon}
                isActive={isActive}
                hasChildren={hasChildren}
                isExpanded={isExpanded}
                count={countFor(item.id, counts)}
                onToggle={hasChildren ? () => toggleExpand(item.id) : undefined}
                onNavigate={hasChildren ? undefined : onNavigate}
              />

              {hasChildren && (
                <AnimatePresence initial={false}>
                  {isExpanded && (
                    <motion.ul
                      key={`${item.id}-children`}
                      role="list"
                      className="flex flex-col gap-0.5 mt-0.5 overflow-hidden"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                    >
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
                            count={countFor(child.id ?? "", counts)}
                            onNavigate={onNavigate}
                          />
                        </li>
                      ))}
                    </motion.ul>
                  )}
                </AnimatePresence>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export function SidebarBottomSection({
  onNavigate,
  user,
}: {
  onNavigate?: () => void;
  user?: Session["user"];
}) {
  const t = useTranslations("shell.sidebar");

  const displayName = user?.name ?? t("profile.title");
  const initial = (displayName?.[0] ?? "S").toUpperCase();
  const subtitle = user?.email ?? t("profile.subtitle");

  return (
    <div
      className="px-3 pb-3 pt-2 border-t shrink-0"
      style={{ borderTopColor: "var(--sand-400)" }}
    >
      <Link
        href={routes.parametres}
        onClick={() => onNavigate?.()}
        className="flex items-center gap-2.5 px-2 py-2 rounded-md transition-colors duration-150 hover:bg-[var(--sand-50)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-800)]/40"
      >
        <span
          className="flex w-8 h-8 shrink-0 items-center justify-center rounded-full text-[13px] font-semibold"
          style={{ background: "var(--brand-800)", color: "#FFFFFF" }}
          aria-hidden
        >
          {initial}
        </span>
        <div className="min-w-0 flex-1">
          <span
            className="block text-[13px] font-semibold leading-tight truncate"
            style={{ color: "var(--zinc-950)" }}
          >
            {displayName}
          </span>
          <span
            className="block text-[11px] leading-tight truncate mt-0.5"
            style={{ color: "var(--sand-600)" }}
          >
            {subtitle}
          </span>
        </div>
        <ChevronRight
          className="h-3.5 w-3.5 shrink-0"
          strokeWidth={1.75}
          style={{ color: "var(--sand-600)" }}
        />
      </Link>
    </div>
  );
}
