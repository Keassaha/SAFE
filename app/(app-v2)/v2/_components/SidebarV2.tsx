"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import {
  BriefcaseBusiness,
  ChartNoAxesCombined,
  Landmark,
  LayoutDashboard,
  Search,
  Settings,
  Users,
  X,
} from "lucide-react";
import type { UserRole } from "@prisma/client";
import {
  canManageExpenseJournal,
  canManageInvoices,
  canViewClients,
  canViewDossiers,
  canViewReports,
} from "@/lib/auth/permissions";
import { routes } from "@/lib/routes";
import s from "../v2.module.css";
import { SafeLogo } from "@/components/branding/SafeLogo";

const ROLE_LABELS: Record<string, string> = {
  admin_cabinet: "Administrateur",
  avocat: "Avocat",
  assistante: "Assistante juridique",
  comptabilite: "Comptabilité",
};

type NavEntry = {
  label: string;
  href: string;
  icon: LucideIcon;
  show: (role: UserRole) => boolean;
  count?: number;
  /** Préfixe d'URL marquant l'item actif (les liens legacy sortent du shell v2). */
  activePrefix?: string;
};

/**
 * Sidebar v2 — items réels uniquement (doctrine « rien de simulé ») :
 * ce qui n'a pas encore d'équivalent v2 pointe vers la page legacy.
 * Visibilité par rôle : mêmes prédicats que components/layout/SidebarNav.tsx.
 */
export function SidebarV2({
  role,
  userName,
  dossierCount,
  open,
  onClose,
}: {
  role: string;
  userName: string;
  dossierCount: number;
  open: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();
  const userRole = role as UserRole;

  const items: NavEntry[] = [
    {
      label: "Aujourd’hui",
      href: routes.aujourdhui,
      icon: LayoutDashboard,
      show: () => true,
    },
    {
      label: "Dossiers",
      href: "/v2/dossiers",
      icon: BriefcaseBusiness,
      show: canViewDossiers,
      count: dossierCount,
      activePrefix: "/v2/dossiers",
    },
    {
      label: "Clients",
      href: routes.clients,
      icon: Users,
      show: canViewClients,
    },
    {
      label: "Finances",
      href: routes.facturation,
      icon: Landmark,
      show: (r) => canManageInvoices(r) || canManageExpenseJournal(r),
    },
    {
      label: "Rapports",
      href: routes.rapports,
      icon: ChartNoAxesCombined,
      show: canViewReports,
    },
  ];

  const initials = userInitials(userName);

  return (
    <aside className={`${s.sidebar} ${open ? s.sidebarOpen : ""}`}>
      <div className={s.brandRow}>
        {/* Marque canonique. Cette barre dessinait un « S » dans un carré vert. */}
        <SafeLogo size={20} alt="SAFE" />
        <button
          type="button"
          className={s.mobileClose}
          aria-label="Fermer la navigation"
          onClick={onClose}
        >
          <X size={18} />
        </button>
      </div>

      <Link href="/v2/dossiers" className={s.commandButton} onClick={onClose}>
        <Search size={16} />
        <span>Rechercher</span>
      </Link>

      <nav aria-label="Navigation principale" className={s.primaryNav}>
        {items
          .filter((item) => item.show(userRole))
          .map(({ label, href, icon: Icon, count, activePrefix }) => {
            const active = activePrefix
              ? pathname === activePrefix || pathname.startsWith(`${activePrefix}/`)
              : false;
            return (
              <Link
                key={label}
                href={href}
                className={`${s.navItem} ${active ? s.navItemActive : ""}`}
                aria-current={active ? "page" : undefined}
                onClick={onClose}
              >
                <Icon size={17} strokeWidth={1.8} />
                <span>{label}</span>
                {count ? <span className={s.navCount}>{count}</span> : null}
              </Link>
            );
          })}
      </nav>

      <div className={s.sidebarBottom}>
        <Link href={routes.parametres} className={s.navItem} onClick={onClose}>
          <Settings size={17} />
          <span>Paramètres</span>
        </Link>
        <div className={s.accountButton}>
          <span className={s.avatar}>{initials}</span>
          <span>
            <strong>{userName}</strong>
            <small>{ROLE_LABELS[role] ?? role}</small>
          </span>
        </div>
      </div>
    </aside>
  );
}

export function userInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
