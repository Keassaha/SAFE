"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/ui/core";
import { cn } from "@/lib/cn";

const NAV = [
  { label: "Tableau de bord", href: "/dashboard" },
  { label: "Conformité", href: "/conformite" },
  { label: "Fidéicommis", href: "/fideicommis" },
  { label: "Facturation", href: "/facturation" },
  { label: "Clients", href: "/clients" },
  { label: "Dossiers", href: "/dossiers" },
  { label: "Employés Virtuels", href: "/employes-virtuels" },
  { label: "Rapports", href: "/rapports" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <nav className="bg-surface border-r border-line px-5 py-[26px] flex flex-col gap-7">
      <div className="flex items-center gap-[11px]">
        <Logo />
        <div>
          <div className="font-serif text-[23px] leading-none">SAFE</div>
          <div className="text-[9.5px] text-muted tracking-wide mt-0.5">
            Facturation · Fidéicommis · Conformité
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-[2px]">
        {NAV.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "text-[13.5px] no-underline px-[11px] py-[9px] rounded-[9px] flex items-center gap-[10px] transition-colors",
                active
                  ? "bg-canvas text-ink font-medium"
                  : "text-muted hover:bg-canvas/60"
              )}
            >
              <span
                className={cn(
                  "w-1.5 h-1.5 rounded-[2px] bg-current",
                  active ? "opacity-50" : "opacity-50"
                )}
              />
              {item.label}
            </Link>
          );
        })}
      </div>

      <div className="mt-auto flex items-center gap-[9px] text-[11px] text-muted border-t border-line2 pt-4">
        <div className="w-[30px] h-[30px] rounded-full bg-forest text-surface grid place-items-center font-serif text-sm">
          B
        </div>
        <div>
          Me Sophie Bélanger
          <br />
          <span className="opacity-70">Cabinet Bélanger, Gatineau</span>
        </div>
      </div>
    </nav>
  );
}
