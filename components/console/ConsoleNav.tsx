"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  GitBranch,
  Activity,
  ShieldCheck,
  Repeat,
  LifeBuoy,
  type LucideIcon,
} from "lucide-react";

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  section: "pilotage" | "conformite" | "revenus" | "systeme";
  disabled?: boolean;
};

const NAV_ITEMS: NavItem[] = [
  { href: "/console", label: "Dashboard", icon: LayoutDashboard, section: "pilotage" },
  { href: "/console/leads", label: "Cabinets", icon: Building2, section: "pilotage" },
  { href: "/console/pipeline", label: "Pipeline", icon: GitBranch, section: "pilotage" },
  { href: "/console/activites", label: "Activités", icon: Activity, section: "pilotage", disabled: true },
  { href: "/console/audits", label: "Audits", icon: ShieldCheck, section: "conformite" },
  { href: "/console/clients", label: "Clients", icon: Repeat, section: "revenus" },
  { href: "/console/support", label: "Support", icon: LifeBuoy, section: "revenus", disabled: true },
];

function isActive(pathname: string, href: string): boolean {
  if (href === "/console") return pathname === "/console";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function ConsoleNav() {
  const pathname = usePathname();

  return (
    <nav className="flex items-center gap-1 overflow-x-auto border-b border-[var(--safe-neutral-border)]/60 px-1">
      {NAV_ITEMS.map((item) => {
        const active = isActive(pathname, item.href);
        const Icon = item.icon;

        if (item.disabled) {
          return (
            <span
              key={item.href}
              className="flex shrink-0 cursor-not-allowed items-center gap-1.5 border-b-2 border-transparent px-3 py-2.5 text-sm font-medium text-zinc-400"
              title="À venir"
            >
              <Icon className="h-4 w-4" />
              {item.label}
              <span className="ml-1 rounded bg-zinc-100 px-1 py-0.5 text-[9px] uppercase tracking-wide text-zinc-400">
                bientôt
              </span>
            </span>
          );
        }

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-2.5 text-sm font-medium transition-colors ${
              active
                ? "border-emerald-600 text-emerald-700"
                : "border-transparent text-zinc-600 hover:text-zinc-900"
            }`}
          >
            <Icon className="h-4 w-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
