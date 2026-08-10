"use client";

import { useState } from "react";
import s from "../v2.module.css";
import { CrumbsProvider } from "./crumbs";
import { SidebarV2 } from "./SidebarV2";
import { TopbarV2 } from "./TopbarV2";

/**
 * Shell « Calme opérationnel » — sidebar 224 px + topbar sticky.
 * La hiérarchie DOM (shell > sidebar + scrim + workspace > surface > topbar + main)
 * reproduit celle du prototype : le sticky de la topbar en dépend.
 */
export function ShellV2({
  role,
  userName,
  dossierCount,
  children,
}: {
  role: string;
  userName: string;
  dossierCount: number;
  children: React.ReactNode;
}) {
  const [mobileNav, setMobileNav] = useState(false);

  return (
    <CrumbsProvider>
      <div className={s.shell}>
      <SidebarV2
        role={role}
        userName={userName}
        dossierCount={dossierCount}
        open={mobileNav}
        onClose={() => setMobileNav(false)}
      />
      {mobileNav ? (
        <button
          className={s.scrim}
          type="button"
          aria-label="Fermer la navigation"
          onClick={() => setMobileNav(false)}
        />
      ) : null}
      <div className={s.workspace}>
        <div className={s.surface}>
          <TopbarV2 userName={userName} onOpenNav={() => setMobileNav(true)} />
          <main className={s.main}>{children}</main>
        </div>
      </div>
      </div>
    </CrumbsProvider>
  );
}
