"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
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
  ClipboardCheck,
  Sunrise,
  ShieldCheck,
  Wallet,
  FileText,
  Building2,
  LifeBuoy,
  GitBranch,
  Flame,
  CalendarDays,
  Calculator,
} from "lucide-react";
import { useTranslations } from "next-intl";
import type { UserRole } from "@prisma/client";
import {
  canViewAssistantQueue,
  canViewBillingTrust,
  canViewClients,
  canViewComptabilite,
  canViewDossiers,
  canViewEmployees,
  canViewReports,
} from "@/lib/auth/permissions";
import { routes } from "@/lib/routes";
import { GlobalTimer } from "@/components/temps/GlobalTimer";
import { LocaleSwitcher } from "@/components/layout/LocaleSwitcher";
import { AlertCenter } from "@/components/layout/AlertCenter";
import type { TrustReconciliationStatus } from "@/lib/services/trust-reconciliation-status";
import { SafeLogo } from "@/components/branding/SafeLogo";
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
  /** Obligations ouvertes du cabinet, présentées par le centre d'alertes. */
  trustStatus?: TrustReconciliationStatus | null;
  /** Pilote la réglementation citée, jamais la langue de l'interface. */
  province?: string | null;
}

/* ───────────────────────────────────────────────────────────
 *  Nav spec — groupes éditoriaux
 *  ─────────────────────────────────────────────────────────── */

/**
 * `show` : le menu ne propose que des portes qui s'ouvrent.
 *
 * La garde de page reste seule juge (« le menu cache, il ne protège pas »),
 * mais afficher une entrée que le rôle ne peut pas ouvrir produisait un aller
 * simple vers le tableau de bord. Chaque prédicat reprend donc EXACTEMENT la
 * garde de la page visée ; une entrée sans `show` mène à une page ouverte à
 * tous les rôles connectés.
 */
type NavChild = {
  labelKey?: string;
  label?: string; // Libellé littéral (mode consultant, sans i18n)
  href: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  descriptionKey?: string;
  description?: string; // Description littérale (mode consultant)
  show?: (role: UserRole) => boolean;
};

type NavGroup =
  | {
      id: string;
      labelKey?: string;
      label?: string;
      href: string;
      icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
      show?: (role: UserRole) => boolean;
    }
  | {
      id: string;
      labelKey?: string;
      label?: string;
      icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
      children: NavChild[];
      matchPrefixes: string[];
      show?: (role: UserRole) => boolean;
    };

/**
 * Retire du menu les entrées que le rôle ne peut pas ouvrir, et le groupe qui
 * n'a plus rien à proposer. Le menu latéral mobile filtre déjà de son côté
 * (`SidebarNav`) : sur ordinateur, cette barre est la seule navigation, elle
 * doit donc dire la même chose.
 */
function filterNavByRole(groups: NavGroup[], role: UserRole): NavGroup[] {
  return groups
    .filter((group) => group.show?.(role) ?? true)
    .map((group) =>
      "children" in group
        ? { ...group, children: group.children.filter((child) => child.show?.(role) ?? true) }
        : group,
    )
    .filter((group) => !("children" in group) || group.children.length > 0);
}

const NAV: NavGroup[] = [
  {
    id: "dashboard",
    labelKey: "navDashboard",
    href: routes.tableauDeBord,
    icon: LayoutDashboard,
  },
  {
    // « Aujourd'hui » est l'accueil de l'assistante. Il vivait dans le tiroir mobile
    // seulement : au bureau, personne ne pouvait y arriver par le menu.
    id: "aujourdhui",
    labelKey: "navToday",
    icon: Sunrise,
    href: routes.aujourdhui,
  },
  {
    id: "pratique",
    labelKey: "navPractice",
    icon: Briefcase,
    matchPrefixes: [routes.clients, routes.dossiers, routes.employees, routes.gestionLexTrack, routes.gestionAssistante, routes.mesHeures],
    children: [
      {
        labelKey: "navClients",
        href: routes.clients,
        icon: Users,
        descriptionKey: "navClientsDesc",
        show: canViewClients,
      },
      {
        labelKey: "navMatters",
        href: routes.dossiers,
        icon: FolderOpen,
        descriptionKey: "navMattersDesc",
        show: canViewDossiers,
      },
      {
        labelKey: "navAgenda",
        href: routes.gestionLexTrack,
        icon: CalendarDays,
        descriptionKey: "navAgendaDesc",
      },
      {
        labelKey: "navEmployees",
        href: routes.employees,
        icon: Users,
        descriptionKey: "navEmployeesDesc",
        show: canViewEmployees,
      },
      {
        // File assistante et Mon temps existaient dans le tiroir mobile seul.
        labelKey: "navAssistantQueue",
        href: routes.gestionAssistante,
        icon: ClipboardCheck,
        descriptionKey: "navAssistantQueueDesc",
        show: canViewAssistantQueue,
      },
      {
        labelKey: "navMyHours",
        href: routes.mesHeures,
        icon: Clock,
        descriptionKey: "navMyHoursDesc",
      },
    ],
  },
  {
    id: "finances",
    labelKey: "navFinances",
    icon: Wallet,
    matchPrefixes: [routes.facturation, routes.comptabilite, routes.comptes, routes.inspection, routes.conformite],
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
        show: canViewComptabilite,
      },
      {
        labelKey: "navTrust",
        href: routes.comptes,
        icon: Wallet,
        descriptionKey: "navTrustDesc",
        show: canViewBillingTrust,
      },
      {
        // Section Inspection : tout ce qu'un inspecteur demande, au meme endroit.
        labelKey: "navInspection",
        href: routes.inspection,
        icon: ClipboardCheck,
        descriptionKey: "navInspectionDesc",
        show: canViewBillingTrust,
      },
      {
        // Conformite existait dans le tiroir mobile et PAS ici : le tableau de bord
        // de conformite etait donc inatteignable depuis un ordinateur.
        labelKey: "navCompliance",
        href: routes.conformite,
        icon: ShieldCheck,
        descriptionKey: "navComplianceDesc",
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
      routes.outils,
    ],
    children: [
      {
        // La suite d'outils autonomes. Sans cette entrée, le calculateur existait et
        // rien n'y menait : on y arrivait par l'URL, et on n'y revenait jamais.
        labelKey: "navPatrimoineFamilial",
        href: "/outils/patrimoine-familial",
        icon: Calculator,
        descriptionKey: "navPatrimoineFamilialDesc",
      },
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
        show: canViewReports,
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

/**
 * Forme compacte d'un nom pour la barre du haut.
 *
 * Un nom complet avec titre (« Me Agboko Jean-Jacques Dadié ») ne tient jamais
 * dans une largeur de barre de navigation, et une coupure au milieu d'un prénom
 * (« Jean-Jac… ») se lit comme un accident plutôt qu'une mise en forme. Garder
 * le premier mot (le titre s'il y en a un, sinon le prénom) et le dernier (le
 * nom de famille) couvre les deux cas avec la même règle. Le nom complet reste
 * accessible : au survol (`title`) et dans le menu du compte.
 */
function nomCompact(nomComplet: string | null | undefined): string | null {
  if (!nomComplet) return null;
  const mots = nomComplet.trim().split(/\s+/).filter(Boolean);
  if (mots.length <= 2) return mots.join(" ");
  return `${mots[0]} ${mots[mots.length - 1]}`;
}

/* ───────────────────────────────────────────────────────────
 *  Header
 *  ─────────────────────────────────────────────────────────── */

export function Header({
  user,
  cabinetId,
  onOpenMobileNav,
  billingMode,
  role,
  isSafeInc,
  trustStatus,
  province,
}: HeaderProps) {
  const t = useTranslations("shell.header");
  const tMisc = useTranslations("miscUi");
  const pathname = usePathname();

  // Même repli que le layout applicatif quand la session ne porte pas de rôle.
  const effectiveRole = (role ?? "avocat") as UserRole;
  // Mode consultant (SAFE Inc.) : menu unifié au lieu du menu cabinet.
  // Puis retrait des entrées que le rôle ne peut pas ouvrir : sur ordinateur
  // cette barre est la seule navigation, et une entrée refusée par la garde de
  // page se soldait par un aller simple vers le tableau de bord.
  const navGroups = filterNavByRole(isSafeInc ? CONSULTANT_NAV : NAV, effectiveRole);
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

  /**
   * Entrée survolée.
   *
   * Ne sert plus qu'à ouvrir le bon panneau déroulant. La pastille grise qui
   * suivait le curseur a été retirée : elle se lisait comme une sélection
   * alors que rien n'était sélectionné. Le zoom suffit à dire où est le doigt.
   */
  const [, setSurvole] = useState<string | null>(null);

  /**
   * Loupe de navigation.
   *
   * Chaque entrée grossit selon sa distance au curseur, suivant une courbe
   * en cloche. L'entrée sous le pointeur atteint son amplitude maximale, ses
   * voisines la reprennent en s'atténuant, et l'ensemble se soulève très
   * légèrement. Le résultat n'est pas un survol qui s'allume : c'est une
   * surface qui se déforme sous le doigt.
   *
   * Trois précautions :
   * - les styles sont écrits directement dans le DOM depuis une boucle
   *   d'animation, jamais par un rendu React : une position de souris ne
   *   déclenche pas soixante rendus par seconde ;
   * - l'amplitude reste basse (1,14) et le rayon large (150 px), sinon la
   *   barre gondole au lieu de respirer ;
   * - `prefers-reduced-motion` neutralise tout, sans casser la navigation.
   */
  const trameRef = useRef<number | null>(null);
  const souriseRef = useRef<number | null>(null);

  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const AMPLITUDE = 0.10;
    const RAYON = 170;

    const peindre = () => {
      trameRef.current = null;
      const entrees = nav.querySelectorAll<HTMLElement>("[data-nav-item]");
      const x = souriseRef.current;
      entrees.forEach((entree) => {
        if (x === null) {
          entree.style.transform = "";
          return;
        }
        const r = entree.getBoundingClientRect();
        const centre = r.left + r.width / 2 - nav.getBoundingClientRect().left;
        const d = (centre - x) / RAYON;
        const cloche = Math.exp(-d * d);
        const echelle = 1 + AMPLITUDE * cloche;
        entree.style.transform = `scale(${echelle.toFixed(3)}) translateY(${(-2 * cloche).toFixed(2)}px)`;
      });
    };

    const demander = () => {
      if (trameRef.current === null) trameRef.current = requestAnimationFrame(peindre);
    };

    const surDeplacement = (e: PointerEvent) => {
      souriseRef.current = e.clientX - nav.getBoundingClientRect().left;
      demander();
    };
    const surSortie = () => {
      souriseRef.current = null;
      // `pointerleave` est natif et fiable, là où le `onMouseLeave` de React
      // repose sur une synthèse à partir de `mouseout` qui ne se déclenche pas
      // dans tous les cas.
      setSurvole(null);
      demander();
    };

    nav.addEventListener("pointermove", surDeplacement);
    nav.addEventListener("pointerleave", surSortie);
    return () => {
      nav.removeEventListener("pointermove", surDeplacement);
      nav.removeEventListener("pointerleave", surSortie);
      if (trameRef.current !== null) cancelAnimationFrame(trameRef.current);
    };
  }, []);
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
    // Plan 3, niveau subtle : la barre supérieure surplombe le canvas et son
    // défilement. Le travail continue d'exister derrière elle et doit rester
    // perceptible, ce que seul le verre exprime honnêtement.
    <header className="shrink-0 px-3 pt-3 sm:px-5 sm:pt-4 z-30 relative">
      {/* Barre flottante, en verre.
         Elle ne touche plus les bords et ne barre plus l'écran : un retrait la
         détache, une ombre unique dit qu'elle passe au-dessus du travail, et
         le verre laisse deviner le contenu qui défile dessous. C'est la seule
         justification du verre (P10) : exprimer une superposition réelle. */}
      <div
        className="mx-auto flex h-14 w-full max-w-[1320px] items-center justify-between gap-3 rounded-xl border px-3 sm:px-4"
        style={{
          background: "rgb(var(--si-surface-rgb) / 0.72)",
          backdropFilter: "blur(20px) saturate(1.4)",
          WebkitBackdropFilter: "blur(20px) saturate(1.4)",
          borderColor: "rgb(var(--si-line-ink-rgb) / 0.09)",
          boxShadow: "0 14px 34px -22px rgb(var(--si-line-ink-rgb) / 0.42)",
        }}
      >
      {/* ── LEFT: Mobile menu + Logo + Cabinet ───────────────── */}
      <div className="flex shrink-0 items-center gap-3">
        {onOpenMobileNav ? (
          <button
            type="button"
            onClick={onOpenMobileNav}
            className="safe-zoom-menu shrink-0 lg:hidden p-1.5 -ml-1.5 rounded-md"
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
          {/* Verrou canonique. Cet entête recopiait le mot à la main, en serif et
              avec le ton « fond sombre » sur un fond clair : voir IDENTITE_SAFE §4.8. */}
          <SafeLogo size={20} alt="SAFE" wordClassName="hidden sm:block" />
        </Link>

        <span
          className="hidden xl:block w-px h-6"
          style={{ background: "var(--si-line)" }}
        />

        {/* Un nom complet avec titre (« Me Agboko Jean-Jacques Dadié ») ne tient
            jamais dans cette largeur, et une coupure au milieu d'un prénom
            (« Jean-Jac… ») se lisait comme un accident. La forme compacte
            (titre + nom de famille) tient presque toujours ; `truncate` reste
            un filet de sécurité pour les cas restants. Le nom complet reste
            accessible au survol et dans le menu du compte. */}
        <span
          className="hidden xl:block shrink-0 text-[13px] font-sans font-medium text-text-body truncate max-w-[140px]"
          title={user?.name ?? undefined}
        >
          {nomCompact(user?.name) ?? tMisc("myFirm")}
        </span>
      </div>

      {/* ── CENTER: Navigation groups with dropdowns ─────────── */}
      <nav
        ref={navRef}
        className="relative hidden min-w-0 flex-1 items-center justify-center gap-0.5 lg:flex"
        aria-label={tMisc("mainNavigationAria")}
        onMouseLeave={() => setSurvole(null)}
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
                data-nav-item={group.id}
                data-actif={active}
                aria-label={navLabel(group)}
                title={navLabel(group)}
                onMouseEnter={() => setSurvole(group.id)}
                onFocus={() => setSurvole(group.id)}
                onBlur={() => setSurvole(null)}
                className={`relative z-10 inline-flex shrink-0 origin-bottom items-center gap-2 whitespace-nowrap rounded-lg px-3.5 py-2 text-[13px] font-sans font-medium transition-[color,transform] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] will-change-transform ${
                  active ? "text-si-ink" : "text-si-muted hover:text-si-ink"
                }`}
                aria-current={active ? "page" : undefined}
              >
                <Icon className="w-4 h-4" strokeWidth={1.75} />
                {/* Sous 1280 px, six libellés ne tiennent pas sans écraser la
                    marque. L'icône porte alors seule, le nom accessible reste. */}
                <span className="hidden xl:inline">{navLabel(group)}</span>
              </Link>
            );
          }

          // Dropdown group
          const isOpen = openGroupId === group.id;
          return (
            <div key={group.id} className="relative z-10">
              <button
                type="button"
                data-nav-item={group.id}
                data-actif={active || isOpen}
                aria-label={navLabel(group)}
                title={navLabel(group)}
                onClick={() => setOpenGroupId(isOpen ? null : group.id)}
                onMouseEnter={() => {
                  setOpenGroupId(group.id);
                  setSurvole(group.id);
                }}
                onFocus={() => setSurvole(group.id)}
                onBlur={() => setSurvole(null)}
                className={`inline-flex shrink-0 origin-bottom items-center gap-2 whitespace-nowrap rounded-lg px-3.5 py-2 text-[13px] font-sans font-medium transition-[color,transform] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] will-change-transform ${
                  active || isOpen ? "text-si-ink" : "text-si-muted hover:text-si-ink"
                }`}
                aria-haspopup="menu"
                aria-expanded={isOpen}
              >
                <Icon className="w-4 h-4" strokeWidth={1.75} />
                {/* Sous 1280 px, six libellés ne tiennent pas sans écraser la
                    marque. L'icône porte alors seule, le nom accessible reste. */}
                <span className="hidden xl:inline">{navLabel(group)}</span>
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
                    initial={{ opacity: 0, y: -6, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.97 }}
                    transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
                    style={{ originY: 0, originX: 0.5 }}
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
                    {/* `px-1.5` : les entrées s'insèrent au lieu de border le
                        panneau. Sans ce retrait, le zoom souple les ferait
                        grandir dans le bord `overflow-hidden` et se rogner. */}
                    <ul role="list" className="px-1.5 pb-2">
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
                              /* Le survol ne peint plus un rectangle gris : il
                                 soulève l'entrée. Le fond teinté ne sert plus
                                 qu'à dire « vous êtes ici », ce qui est un état
                                 et non un survol. */
                              className={`safe-zoom-menu group flex items-start gap-3 rounded-lg px-2.5 py-2.5 ${
                                childActive ? "bg-si-forest/5" : ""
                              }`}
                              onClick={() => setOpenGroupId(null)}
                            >
                              <span
                                className={`shrink-0 mt-0.5 w-7 h-7 rounded-[7px] flex items-center justify-center border border-[0.5px] transition-colors ${
                                  childActive
                                    ? "safe-action-degrade border-si-forest text-white"
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
        <div className="relative hidden md:block w-40 xl:w-52">
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

        <AlertCenter status={trustStatus ?? null} province={province ?? null} />


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
            className="w-[32px] h-[32px] rounded-full safe-action-degrade flex items-center justify-center text-white text-[12px] font-medium hover:opacity-90 transition-opacity ml-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-si-forest/40"
            aria-label={displayName}
            aria-haspopup="menu"
            aria-expanded={userMenuOpen}
          >
            {initial}
          </button>

          <AnimatePresence>
            {userMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: -6, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.97 }}
                transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
                style={{ originY: 0, originX: 1 }}
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

                {/* La langue vivait dans la barre, deux boutons permanents pour
                    un réglage qu'on change une fois. Elle rejoint le compte, où
                    l'on va déjà chercher ce genre de préférence. */}
                <div className="flex items-center justify-between gap-3 border-b border-[0.5px] border-border/70 px-4 py-2.5">
                  <span className="text-[13px] font-sans text-text-body">
                    {tMisc("language")}
                  </span>
                  <LocaleSwitcher />
                </div>

                <div className="px-1.5 py-1.5">
                  <Link
                    href={routes.parametres}
                    role="menuitem"
                    onClick={() => setUserMenuOpen(false)}
                    className="safe-zoom-menu flex items-center gap-3 rounded-lg px-2.5 py-2 text-[13px] font-sans text-text-body hover:text-text-primary"
                  >
                    <Settings className="w-4 h-4" strokeWidth={1.75} />
                    {t("settings")}
                  </Link>
                  <Link
                    href={routes.parametres}
                    role="menuitem"
                    onClick={() => setUserMenuOpen(false)}
                    className="safe-zoom-menu flex items-center gap-3 rounded-lg px-2.5 py-2 text-[13px] font-sans text-text-body hover:text-text-primary"
                  >
                    <UserIcon className="w-4 h-4" strokeWidth={1.75} />
                    {tMisc("myProfile")}
                  </Link>
                </div>

                <div className="border-t border-[0.5px] border-border/70 px-1.5 py-1.5">
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setUserMenuOpen(false);
                      void signOutClient("/");
                    }}
                    className="safe-zoom-menu flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-[13px] font-sans text-[#B84A3E]"
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
      </div>
    </header>
  );
}
