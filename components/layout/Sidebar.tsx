import Link from "next/link";
import type { Session } from "next-auth";
import { routes } from "@/lib/routes";
import { SidebarBottomSection, SidebarNavList } from "@/components/layout/SidebarNav";
import type { SidebarCounts } from "@/lib/services/sidebar-counts";
import { LogoMark } from "@/components/brand/Logo";

/**
 * Éditorial Chaleureux sidebar
 *
 * - Background: sand-300 (#E8DCC4) — one notch darker than the ivoire page
 * - Border-right: sand-400 separator
 * - Logo block: black square logo + "Safe" wordmark + cabinet context pill
 * - Nav rows: [black icon] [black label] ... [forest green count]
 * - Active state: white pill + 3px forest-green left accent bar
 */
export function Sidebar({
  role,
  billingMode,
  activeNavIds,
  hiddenNavIds,
  counts,
  user,
}: {
  role?: string;
  billingMode?: "forfait" | "horaire";
  activeNavIds?: string[] | null;
  hiddenNavIds?: string[];
  counts?: SidebarCounts | null;
  user?: Session["user"];
}) {
  return (
    <aside
      className="relative h-full w-[260px] shrink-0 hidden lg:flex flex-col overflow-hidden z-10 border-r"
      style={{
        background: "var(--sand-300)",
        borderRightColor: "var(--sand-400)",
      }}
    >
      {/* Logo + context pill */}
      <div className="flex flex-col gap-3 px-4 pt-5 pb-4 shrink-0">
        <Link
          href={routes.tableauDeBord}
          className="inline-flex min-w-0 rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--brand-800)]/40"
          aria-label="SAFE — Tableau de bord"
        >
          <LogoMark size={30} />
        </Link>

        {/* Cabinet context pill (sand-50 bg, forest dot) */}
        <div
          className="flex items-center gap-2 px-2.5 py-1.5 rounded-md border"
          style={{
            background: "var(--sand-50)",
            borderColor: "var(--sand-400)",
          }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full shrink-0"
            style={{ background: "var(--brand-800)" }}
            aria-hidden
          />
          <span
            className="text-[12px] font-medium truncate"
            style={{ color: "var(--zinc-950)" }}
          >
            {user?.name ?? "Mon cabinet"}
          </span>
        </div>
      </div>

      <SidebarNavList
        role={role}
        billingMode={billingMode}
        activeNavIds={activeNavIds}
        hiddenNavIds={hiddenNavIds}
        counts={counts}
        navClassName="flex-1 overflow-y-auto px-3 pb-3 hide-scrollbar"
      />

      <SidebarBottomSection user={user} />
    </aside>
  );
}
