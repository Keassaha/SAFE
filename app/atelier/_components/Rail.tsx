"use client";

import {
  BriefcaseBusiness,
  ChartNoAxesCombined,
  Landmark,
  LayoutDashboard,
  type LucideIcon,
  Scale,
  Search,
  Settings,
  Users,
} from "lucide-react";
import s from "../atelier.module.css";
import { SafeLogo } from "@/components/branding/SafeLogo";

type Item = { label: string; icon: LucideIcon; count?: number; active?: boolean };

const TRAVAIL: Item[] = [
  { label: "Aujourd’hui", icon: LayoutDashboard, active: true },
  { label: "Dossiers", icon: BriefcaseBusiness, count: 34 },
  { label: "Clients", icon: Users, count: 118 },
];

const CABINET: Item[] = [
  { label: "Finances", icon: Landmark },
  { label: "Fidéicommis", icon: Scale },
  { label: "Rapports", icon: ChartNoAxesCombined },
];

/**
 * PLAN 1, structure permanente.
 *
 * Mate et adjacente au canvas, donc aucun verre et aucune ombre latérale : un
 * filet suffit à marquer la frontière. Elle ne prend du verre qu'en dessous de
 * 900 px, quand elle se superpose réellement au contenu (voir .railOpen).
 * La hiérarchie vient de l'indentation, de la typographie et des groupes
 * séparés par l'espace, jamais d'une succession de filets.
 */
export function Rail({
  open,
  onOpenPalette,
}: {
  open: boolean;
  onOpenPalette: () => void;
}) {
  return (
    <aside
      className={`${s.rail} ${open ? s.railOpen : ""}`}
      data-plane="1"
      aria-label="Navigation principale"
    >
      <div className={s.brand}>
        {/* Marque canonique. Ce rail dessinait un « S » dans un carré vert. */}
        <SafeLogo size={20} alt="SAFE" />
      </div>

      <button type="button" className={s.railSearch} onClick={onOpenPalette}>
        <Search size={15} strokeWidth={1.8} />
        <span>Rechercher</span>
        <kbd>⌘K</kbd>
      </button>

      <nav className={s.nav}>
        <div className={s.navGroup}>
          {TRAVAIL.map((item) => (
            <NavItem key={item.label} item={item} />
          ))}
        </div>
        <div className={s.navGroup}>
          <div className={s.navLabel}>Cabinet</div>
          {CABINET.map((item) => (
            <NavItem key={item.label} item={item} />
          ))}
        </div>
      </nav>

      <div className={s.railFoot}>
        <button type="button" className={s.navItem}>
          <Settings size={16} strokeWidth={1.8} />
          <span>Paramètres</span>
        </button>
        <div className={s.account}>
          <span className={s.avatar} aria-hidden>
            LD
          </span>
          <span>
            <strong>Me Lucie Derisier</strong>
            <small>Avocate</small>
          </span>
        </div>
      </div>
    </aside>
  );
}

function NavItem({ item }: { item: Item }) {
  const Icon = item.icon;
  return (
    <button
      type="button"
      className={`${s.navItem} ${item.active ? s.navItemActive : ""}`}
      aria-current={item.active ? "page" : undefined}
    >
      <Icon size={16} strokeWidth={1.8} />
      <span>{item.label}</span>
      {item.count ? <span className={s.navCount}>{item.count}</span> : null}
    </button>
  );
}
