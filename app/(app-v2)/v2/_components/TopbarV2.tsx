"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import s from "../v2.module.css";
import { SafeLogo } from "@/components/branding/SafeLogo";
import { useCrumbs } from "./crumbs";
import { userInitials } from "./SidebarV2";

function sectionLabel(pathname: string): string {
  if (pathname.startsWith("/v2/dossiers")) return "Dossiers";
  return "SAFE";
}

/**
 * Topbar sticky 52 px. Le fil d'ariane détaillé (client, référence) vit dans
 * l'en-tête de page (MatterHeader) : ici, seulement la section courante.
 */
export function TopbarV2({
  userName,
  onOpenNav,
}: {
  userName: string;
  onOpenNav: () => void;
}) {
  const pathname = usePathname();
  const { crumbs } = useCrumbs();

  return (
    <header className={s.topbar}>
      <div className={s.topbarLeft}>
        <button
          type="button"
          className={s.iconButton}
          aria-label="Ouvrir la navigation"
          onClick={onOpenNav}
        >
          <Menu size={19} />
        </button>
        <SafeLogo size={18} alt="SAFE" className={s.mobileBrand} />
        <span className={s.topbarPath}>
          {crumbs && crumbs.length > 0 ? (
            crumbs.map((crumb, index) => (
              <span key={`${crumb.label}-${index}`}>
                {index > 0 ? <span> › </span> : null}
                {crumb.href ? (
                  <Link href={crumb.href}>{crumb.label}</Link>
                ) : crumb.strong ? (
                  <strong>{crumb.label}</strong>
                ) : (
                  crumb.label
                )}
              </span>
            ))
          ) : (
            <strong>{sectionLabel(pathname)}</strong>
          )}
        </span>
      </div>
      <div className={s.topbarRight}>
        <span className={s.prototypeFlag}>Préversion</span>
        <span className={s.topAvatar}>{userInitials(userName)}</span>
      </div>
    </header>
  );
}
