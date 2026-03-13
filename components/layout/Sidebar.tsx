"use client";

import { useState, useEffect } from "react";
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
import { SafeLogo } from "@/components/branding/SafeLogo";
import { routes } from "@/lib/routes";

/* -----------------------------------------------------------------------------
   Layout constants
   ----------------------------------------------------------------------------- */
const ROW_HEIGHT = "h-11";
const ICON_BOX_SIZE = "w-5 h-5";
const PADDING_X = "px-3";
const GAP = "gap-3";
const ACTIVE_INDICATOR_CLASS =
  "absolute left-0 top-0 bottom-0 w-1.5 rounded-r-xl min-h-[2rem]";

type NavItem = {
  href: string;
  labelKey: string;
  icon: React.ComponentType<{ className?: string }>;
  show: (role: UserRole) => boolean;
  exactMatch?: boolean;
  children?: NavItem[];
};

type SectionKey = "principal" | "clientsDossiers" | "tempsFacturation" | "comptabilite" | "outils";

const SECTIONS_ORDER: SectionKey[] = [
  "principal",
  "clientsDossiers",
  "tempsFacturation",
  "comptabilite",
  "outils",
];

const SECTION_LABELS: Record<SectionKey, string> = {
  principal: "sections.main",
  clientsDossiers: "sections.clientsDossiers",
  tempsFacturation: "sections.tempsFacturation",
  comptabilite: "sections.comptabilite",
  outils: "sections.tools",
};

/* -----------------------------------------------------------------------------
   Nav config: 5 sections, max 2 levels
   ----------------------------------------------------------------------------- */
const NAV_CONFIG: Record<SectionKey, NavItem[]> = {
  principal: [
    {
      href: routes.tableauDeBord,
      labelKey: "nav.dashboard",
      icon: LayoutDashboard,
      show: () => true,
    },
  ],
  clientsDossiers: [
    { href: routes.clients, labelKey: "nav.clients", icon: Users, show: canViewClients },
    { href: routes.dossiers, labelKey: "nav.matters", icon: FolderOpen, show: canViewDossiers },
  ],
  tempsFacturation: [
    { href: routes.temps, labelKey: "nav.timesheets", icon: Clock, show: () => true },
    {
      href: routes.facturation,
      labelKey: "nav.billing",
      icon: FileText,
      show: canManageInvoices,
      exactMatch: true,
      children: [
        { href: routes.facturationHonoraires, labelKey: "nav.billableFees", icon: FileText, show: canManageInvoices },
        { href: routes.facturationVerification, labelKey: "nav.verification", icon: FileText, show: canManageInvoices },
        { href: routes.facturationSuivi, labelKey: "nav.followUp", icon: FileText, show: canManageInvoices },
        { href: routes.facturationPaiements, labelKey: "nav.payments", icon: FileText, show: canManageInvoices },
        { href: routes.facturationNotesCredit, labelKey: "nav.creditNotes", icon: FileText, show: canManageInvoices },
        { href: routes.facturationFrais, labelKey: "nav.disbursements", icon: FileText, show: canManageInvoices },
      ],
    },
  ],
  comptabilite: [
    {
      href: routes.comptabilite,
      labelKey: "nav.comptabilite",
      icon: BookOpen,
      show: (role) => canManageExpenseJournal(role) || canManageInvoices(role),
    },
    { href: routes.comptes, labelKey: "nav.trustAccounts", icon: Wallet, show: canViewBillingTrust },
  ],
  outils: [
    { href: routes.rapports, labelKey: "nav.reports", icon: BarChart3, show: canViewReports },
    { href: routes.gestionLexTrack, labelKey: "nav.planning", icon: CalendarDays, show: canManageDossiers },
    { href: routes.parametres, labelKey: "nav.settings", icon: Settings, show: () => true },
    { href: routes.outilsGenerateurDocuments, labelKey: "nav.documentGenerator", icon: ScrollText, show: canViewDocuments },
    { href: routes.outilsCalculateurFamilial, labelKey: "nav.familyCalculator", icon: Calculator, show: canViewDocuments },
    { href: routes.safeImport, labelKey: "nav.safeImport", icon: Upload, show: () => true },
    { href: routes.employees, labelKey: "nav.employees", icon: Users, show: (role) => canViewEmployees(role as UserRole) },
  ],
};

/** Returns which section contains the current path (for auto-expand). */
function getSectionForPathname(pathname: string): SectionKey | null {
  if (pathname === routes.tableauDeBord || pathname.startsWith(routes.tableauDeBord + "/")) return "principal";
  if (pathname.startsWith("/clients") || pathname.startsWith("/dossiers")) return "clientsDossiers";
  if (pathname.startsWith("/temps")) return "tempsFacturation";
  if (pathname.startsWith("/facturation") || pathname.startsWith("/journal") || pathname.startsWith("/comptes") || pathname.startsWith("/comptabilite")) return "comptabilite";
  if (pathname.startsWith("/rapports") || pathname.startsWith("/gestion") || pathname.startsWith("/parametres") || pathname.startsWith("/outils") || pathname.startsWith("/import") || pathname.startsWith("/employees")) return "outils";
  return null;
}

/* -----------------------------------------------------------------------------
   SidebarItem — nav row with active state (level 1 or 2)
   ----------------------------------------------------------------------------- */
function SidebarItem({
  href,
  label,
  icon: Icon,
  isActive,
  showChevronWhenActive,
  subItem,
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  isActive: boolean;
  showChevronWhenActive?: boolean;
  subItem?: boolean;
}) {
  return (
    <li className={subItem ? "pl-4" : undefined}>
      <Link
        href={href}
        className={`
          relative flex items-center ${ROW_HEIGHT} ${PADDING_X} ${GAP}
          rounded-xl text-sm font-medium
          transition-colors duration-200
          ${subItem ? "text-white/90" : ""}
          ${isActive ? "bg-white/18 text-white shadow-sm" : "text-white/95 hover:bg-white/10 hover:text-white"}
        `}
        aria-current={isActive ? "page" : undefined}
      >
        {isActive && (
          <span
            className={ACTIVE_INDICATOR_CLASS}
            style={{ backgroundColor: "var(--safe-primary-600, var(--safe-green-700))" }}
            aria-hidden
          />
        )}
        <span className={`relative z-10 flex ${ICON_BOX_SIZE} shrink-0 items-center justify-center`} aria-hidden>
          <Icon className={`${ICON_BOX_SIZE} opacity-90`} aria-hidden />
        </span>
        <span className="relative z-10 min-w-0 flex-1 truncate text-left leading-none">{label}</span>
        {showChevronWhenActive && isActive && (
          <span className="relative z-10 ml-auto shrink-0 hidden xl:block" aria-hidden>
            <ChevronRight className="h-4 w-4 opacity-70" aria-hidden />
          </span>
        )}
      </Link>
    </li>
  );
}

/* -----------------------------------------------------------------------------
   SidebarSection — collapsible section with title + items (max 2 levels)
   ----------------------------------------------------------------------------- */
function SidebarSection({
  title,
  children,
  expanded,
  onToggle,
}: {
  title: string;
  children: React.ReactNode;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center gap-2 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-white/50 hover:text-white/70 transition-colors rounded-lg hover:bg-white/5"
        aria-expanded={expanded}
      >
        {expanded ? (
          <ChevronDown className="h-3.5 w-3.5 shrink-0" aria-hidden />
        ) : (
          <ChevronRight className="h-3.5 w-3.5 shrink-0" aria-hidden />
        )}
        <span className="flex-1 text-left">{title}</span>
      </button>
      {expanded && (
        <ul className="space-y-1" role="list">
          {children}
        </ul>
      )}
    </div>
  );
}

/* -----------------------------------------------------------------------------
   Sidebar — main component
   ----------------------------------------------------------------------------- */
export function Sidebar({ role }: { role?: string }) {
  const t = useTranslations("shell.sidebar");
  const pathname = usePathname();
  const userRole = (role as UserRole) ?? "avocat";
  const currentSection = getSectionForPathname(pathname);

  const [expandedSections, setExpandedSections] = useState<Set<SectionKey>>(() =>
    currentSection ? new Set([currentSection]) : new Set(["principal"])
  );

  useEffect(() => {
    if (currentSection) {
      setExpandedSections((prev) => new Set(prev).add(currentSection));
    }
  }, [currentSection]);

  const isItemActive = (item: NavItem, child?: NavItem) => {
    const href = child?.href ?? item.href;
    const exact = child ? false : item.exactMatch;
    if (exact) return pathname === href;
    return pathname === href || pathname.startsWith(href + "/");
  };

  return (
    <aside className="relative h-full w-sidebar flex flex-col shrink-0 hidden lg:flex safe-glass-sidebar overflow-hidden">
      <div className="relative flex min-h-0 flex-1 flex-col">
        <div className="p-4 pb-4" data-sidebar-section="top">
          <Link
            href={routes.tableauDeBord}
            className="block transition-opacity duration-200 hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-white/30 focus:ring-offset-2 focus:ring-offset-[var(--safe-sidebar-bg)] rounded-lg"
          >
            <SafeLogo variant="dark" className="w-full max-w-[160px]" />
          </Link>
        </div>

        <nav className="flex-1 overflow-y-auto p-3" aria-label={t("navigationLabel")}>
          <div className="space-y-6">
            {SECTIONS_ORDER.map((sectionKey) => {
              const items = NAV_CONFIG[sectionKey].filter((item) => item.show(userRole));
              if (!items.length) return null;

              const title = t(SECTION_LABELS[sectionKey]);
              const expanded = expandedSections.has(sectionKey);

              return (
                <SidebarSection
                  key={sectionKey}
                  title={title}
                  expanded={expanded}
                  onToggle={() => {
                    setExpandedSections((prev) => {
                      const next = new Set(prev);
                      if (next.has(sectionKey)) next.delete(sectionKey);
                      else next.add(sectionKey);
                      return next;
                    });
                  }}
                >
                  {items.map((item) => {
                    const visibleChildren = item.children?.filter((c) => c.show(userRole)) ?? [];
                    if (item.children?.length && visibleChildren.length > 0) {
                      const parentActive = isItemActive(item);
                      return (
                        <span key={item.href}>
                          <SidebarItem
                            href={item.href}
                            label={t(item.labelKey)}
                            icon={item.icon}
                            isActive={parentActive}
                            showChevronWhenActive
                          />
                          {visibleChildren.map((child) => (
                            <SidebarItem
                              key={child.href}
                              href={child.href}
                              label={t(child.labelKey)}
                              icon={child.icon}
                              isActive={isItemActive(item, child)}
                              showChevronWhenActive={false}
                              subItem
                            />
                          ))}
                        </span>
                      );
                    }
                    return (
                      <SidebarItem
                        key={item.href}
                        href={item.href}
                        label={t(item.labelKey)}
                        icon={item.icon}
                        isActive={isItemActive(item)}
                        showChevronWhenActive
                        subItem={false}
                      />
                    );
                  })}
                </SidebarSection>
              );
            })}
          </div>
        </nav>

        <div className="p-4 pt-3" data-sidebar-section="bottom">
          <Link
            href={routes.parametres}
            className={`
              flex items-center min-h-11 ${GAP} ${PADDING_X}
              rounded-xl bg-white/5 hover:bg-white/10 text-[#E6F4EF]
              transition-colors duration-200
              focus:outline-none focus:ring-2 focus:ring-white/20
            `}
          >
            <span className={`flex ${ICON_BOX_SIZE} shrink-0 items-center justify-center rounded-full bg-white/15`}>
              <User className={`${ICON_BOX_SIZE} text-[#E6F4EF]`} aria-hidden />
            </span>
            <div className="min-w-0 flex-1 truncate text-left">
              <span className="block text-sm font-medium leading-none text-[#E6F4EF] truncate">
                {t("profile.title")}
              </span>
              <span className="block text-xs leading-none text-white/55 truncate mt-0.5">
                {t("profile.subtitle")}
              </span>
            </div>
            <ChevronRight className="h-4 w-4 shrink-0 text-white/50" aria-hidden />
          </Link>
        </div>
      </div>
    </aside>
  );
}
