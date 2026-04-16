import Link from "next/link";
import { SafeLogo } from "@/components/branding/SafeLogo";
import { routes } from "@/lib/routes";
import { SidebarBottomSection, SidebarNavList } from "@/components/layout/SidebarNav";

export function Sidebar({ role, billingMode }: { role?: string; billingMode?: "forfait" | "horaire" }) {
  return (
    <aside className="relative h-full w-[260px] flex flex-col shrink-0 hidden lg:flex bg-green-950 overflow-hidden z-10">
      <div className="flex items-center gap-3 px-5 pt-6 pb-5 shrink-0">
        <Link
          href={routes.tableauDeBord}
          className="flex items-center transition-opacity duration-200 hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-green-700/30 rounded-safe-sm"
        >
          <SafeLogo className="shrink-0" variant="dark" noPulse />
        </Link>
      </div>

      <SidebarNavList role={role} billingMode={billingMode} navClassName="flex-1 overflow-y-auto px-3 pb-3 hide-scrollbar" />

      <SidebarBottomSection />
    </aside>
  );
}
