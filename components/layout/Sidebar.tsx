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
   Layout constants: one system for all items
   ----------------------------------------------------------------------------- */
const ROW_HEIGHT = "h-11"; // 2.75rem / 44px fixed row height
const ICON_BOX_SIZE = "w-5 h-5"; // 20×20px icon wrapper (all icons same size)
const PADDING_X = "px-3"; // consistent horizontal padding
const GAP = "gap-3"; // space between icon, label, chevron
const ACTIVE_INDICATOR_CLASS =
  "absolute left-0 top-0 bottom-0 w-1.5 rounded-r-xl min-h-[2rem]";

/* -----------------------------------------------------------------------------
   SidebarItem — reusable nav row with active state
   - Rounded pill background when active; vertical indicator on the left (theme primary)
   - Indicator is absolute so the pill does not move; icon and label aligned with flexbox
   ----------------------------------------------------------------------------- */
function SidebarItem({
  href,
  label,
  icon: Icon,
  isActive,
  showChevronWhenActive = true,
  subItem = false,
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
          ${
            isActive
              ? "bg-white/18 text-white shadow-sm"
              : "text-white/95 hover:bg-white/10 hover:text-white"
          }
        `}
        aria-current={isActive ? "page" : undefined}
      >
        {isActive && (
          <span
            className={ACTIVE_INDICATOR_CLASS}
            style={{
              backgroundColor:
                "var(--safe-primary-600, var(--safe-green-700))",
            }}
            aria-hidden
          />
        )}
        <span
          className={`relative z-10 flex ${ICON_BOX_SIZE} shrink-0 items-center justify-center`}
          aria-hidden
        >
          <Icon className={`${ICON_BOX_SIZE} opacity-90`} aria-hidden />
        </span>
        <span className="relative z-10 min-w-0 flex-1 truncate text-left leading-none">
          {label}
        </span>
        {/* Chevron: always right-aligned, optional visibility */}
        {showChevronWhenActive && isActive && (
          <span
            className="relative z-10 ml-auto shrink-0 hidden xl:block"
            aria-hidden
          >
            <ChevronRight className="h-4 w-4 opacity-70" aria-hidden />
          </span>
        )}
      </Link>
    </li>
  );
}

/* -----------------------------------------------------------------------------
   SidebarSection — section with title + list of items
   ----------------------------------------------------------------------------- */
function SidebarSection({
  title,
  children,
  collapsible,
  expanded,
  onToggle,
}: {
  title: string;
  children: React.ReactNode;
  collapsible?: boolean;
  expanded?: boolean;
  onToggle?: () => void;
}) {
  if (collapsible) {
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
  return (
    <div className="space-y-2">
      <p className="px-3 text-[10px] font-semibold uppercase tracking-wider text-white/50 leading-none">
        {title}
      </p>
      <ul className="space-y-1" role="list">
        {children}
      </ul>
    </div>
  );
}

/* -----------------------------------------------------------------------------
   Nav config
   ----------------------------------------------------------------------------- */
const SECTION_LABELS = {
  principal: "sections.main",
  administratif: "sections.admin",
  temps: "sections.time",
  facturationSuivi: "sections.accounting",
  gestion: "sections.management",
  outils: "sections.tools",
  rapports: "sections.reports",
} as const;

type SectionKey = keyof typeof SECTION_LABELS;

const PROFILE_LABELS = {
  title: "profile.title",
  subtitle: "profile.subtitle",
};

const NAV_ITEMS: {
  href: string;
  labelKey: string;
  icon: React.ComponentType<{ className?: string }>;
  show: (role: UserRole) => boolean;
  section: SectionKey;
  subItem?: boolean;
  /** Si true, actif seulement quand pathname === href (pas les sous-routes) */
  exactMatch?: boolean;
}[] = [
  {
    href: routes.tableauDeBord,
    labelKey: "nav.dashboard",
    icon: LayoutDashboard,
    show: () => true,
    section: "principal",
  },
  {
    href: routes.clients,
    labelKey: "nav.clients",
    icon: Users,
    show: canViewClients,
    section: "administratif",
  },
  {
    href: routes.dossiers,
    labelKey: "nav.matters",
    icon: FolderOpen,
    show: canViewDossiers,
    section: "administratif",
  },
  {
    href: routes.employees,
    labelKey: "nav.employees",
    icon: Users,
    show: (role) => canViewEmployees(role as UserRole),
    section: "administratif",
  },
  {
    href: routes.temps,
    labelKey: "nav.timesheets",
    icon: Clock,
    show: () => true,
    section: "temps",
  },
  {
    href: routes.facturation,
    labelKey: "nav.billing",
    icon: FileText,
    show: canManageInvoices,
    section: "facturationSuivi",
    exactMatch: true,
  },
  {
    href: routes.facturationHonoraires,
    labelKey: "nav.billableFees",
    icon: FileText,
    show: canManageInvoices,
    section: "facturationSuivi",
    subItem: true,
  },
  {
    href: routes.facturationVerification,
    labelKey: "nav.verification",
    icon: FileText,
    show: canManageInvoices,
    section: "facturationSuivi",
    subItem: true,
  },
  {
    href: routes.facturationSuivi,
    labelKey: "nav.followUp",
    icon: FileText,
    show: canManageInvoices,
    section: "facturationSuivi",
    subItem: true,
  },
  {
    href: routes.facturationPaiements,
    labelKey: "nav.payments",
    icon: FileText,
    show: canManageInvoices,
    section: "facturationSuivi",
    subItem: true,
  },
  {
    href: routes.facturationNotesCredit,
    labelKey: "nav.creditNotes",
    icon: FileText,
    show: canManageInvoices,
    section: "facturationSuivi",
    subItem: true,
  },
  {
    href: routes.facturationFrais,
    labelKey: "nav.disbursements",
    icon: FileText,
    show: canManageInvoices,
    section: "facturationSuivi",
    subItem: true,
  },
  {
    href: routes.comptes,
    labelKey: "nav.trustAccounts",
    icon: Wallet,
    show: canViewBillingTrust,
    section: "facturationSuivi",
    subItem: true,
  },
  {
    href: routes.journalGeneral,
    labelKey: "nav.generalJournal",
    icon: BookOpen,
    show: canManageExpenseJournal,
    section: "facturationSuivi",
    subItem: true,
  },
  {
    href: routes.journalDepenses,
    labelKey: "nav.expenseJournal",
    icon: Receipt,
    show: canManageExpenseJournal,
    section: "facturationSuivi",
    subItem: true,
  },
  {
    href: routes.gestionLexTrack,
    labelKey: "nav.planning",
    icon: Scale,
    show: canManageDossiers,
    section: "gestion",
  },
  {
    href: routes.outilsGenerateurDocuments,
    labelKey: "nav.documentGenerator",
    icon: ScrollText,
    show: canViewDocuments,
    section: "outils",
  },
  {
    href: routes.outilsCalculateurFamilial,
    labelKey: "nav.familyCalculator",
    icon: Calculator,
    show: canViewDocuments,
    section: "outils",
  },
  {
    href: routes.safeImport,
    labelKey: "nav.safeImport",
    icon: Upload,
    show: () => true,
    section: "outils",
  },
  {
    href: routes.rapports,
    labelKey: "nav.reports",
    icon: BarChart3,
    show: canViewReports,
    section: "rapports",
  },
];

const SECTIONS_ORDER: SectionKey[] = [
  "principal",
  "administratif",
  "temps",
  "facturationSuivi",
  "gestion",
  "outils",
  "rapports",
];

/** Retourne la clé de section correspondant au pathname (pour ouvrir automatiquement la section courante). */
function getSectionForPathname(pathname: string): SectionKey | null {
  if (pathname === routes.tableauDeBord || pathname.startsWith(routes.tableauDeBord + "/"))
    return "principal";
  if (
    pathname.startsWith("/clients") ||
    pathname.startsWith("/dossiers") ||
    pathname.startsWith("/employees")
  )
    return "administratif";
  if (pathname.startsWith("/temps")) return "temps";
  if (
    pathname.startsWith("/facturation") ||
    pathname.startsWith("/journal") ||
    pathname.startsWith("/comptes")
  )
    return "facturationSuivi";
  if (pathname.startsWith("/gestion")) return "gestion";
  if (pathname.startsWith("/outils") || pathname.startsWith("/import")) return "outils";
  if (pathname.startsWith("/rapports")) return "rapports";
  return null;
}

/* -----------------------------------------------------------------------------
   Sidebar — main component
   ----------------------------------------------------------------------------- */
export function Sidebar({ role }: { role?: string }) {
  const t = useTranslations("shell.sidebar");
  const pathname = usePathname();
  const userRole = (role as UserRole) ?? "avocat";
  const filtered = NAV_ITEMS.filter((item) => item.show(userRole));
  const currentSection = getSectionForPathname(pathname);

  const [expandedSections, setExpandedSections] = useState<Set<string>>(() =>
    currentSection ? new Set([currentSection]) : new Set()
  );

  useEffect(() => {
    if (currentSection) {
      setExpandedSections((prev) => {
        const next = new Set(prev);
        next.add(currentSection);
        return next;
      });
    }
  }, [currentSection]);

  const bySection = filtered.reduce<Record<string, typeof NAV_ITEMS>>(
    (acc, item) => {
      const s = item.section;
      if (!acc[s]) acc[s] = [];
      acc[s].push(item);
      return acc;
    },
    {}
  );

  return (
    <aside className="relative h-full w-sidebar flex flex-col shrink-0 hidden lg:flex safe-glass-sidebar overflow-hidden">
      <div className="relative flex min-h-0 flex-1 flex-col">
        {/* Logo block — sans fond, intégré à la sidebar */}
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
              const items = bySection[sectionKey];
              if (!items?.length) return null;
              const title = t(SECTION_LABELS[sectionKey]);
              const expanded = expandedSections.has(sectionKey);
              return (
                <SidebarSection
                  key={sectionKey}
                  title={title}
                  collapsible
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
                    const isActive = item.exactMatch
                      ? pathname === item.href
                      : pathname === item.href || pathname.startsWith(item.href + "/");
                    return (
                      <SidebarItem
                        key={item.href}
                        href={item.href}
                        label={t(item.labelKey)}
                        icon={item.icon}
                        isActive={isActive}
                        showChevronWhenActive
                        subItem={item.subItem}
                      />
                    );
                  })}
                </SidebarSection>
              );
            })}
          </div>
        </nav>

        {/* Profile block — same min height and icon box, two-line label ok */}
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
            <span
              className={`flex ${ICON_BOX_SIZE} shrink-0 items-center justify-center rounded-full bg-white/15`}
            >
              <User className={`${ICON_BOX_SIZE} text-[#E6F4EF]`} aria-hidden />
            </span>
            <div className="min-w-0 flex-1 truncate text-left">
              <span className="block text-sm font-medium leading-none text-[#E6F4EF] truncate">
                {t(PROFILE_LABELS.title)}
              </span>
              <span className="block text-xs leading-none text-white/55 truncate mt-0.5">
                {t(PROFILE_LABELS.subtitle)}
              </span>
            </div>
            <ChevronRight
              className="h-4 w-4 shrink-0 text-white/50"
              aria-hidden
            />
          </Link>
        </div>
      </div>
    </aside>
  );
}
