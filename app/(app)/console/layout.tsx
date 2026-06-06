import { redirect } from "next/navigation";
import { requireCabinetAndUser } from "@/lib/auth/session";
import { isSafeIncCabinet } from "@/lib/safe-inc";
import { ConsoleNav } from "@/components/console/ConsoleNav";

/**
 * Layout de la Console SAFE Inc.
 *
 * Accessible uniquement aux utilisateurs rattachés au Cabinet SAFE (dog food, ADR-006).
 * Toute autre tentative redirige vers le tableau de bord normal.
 *
 * Navigation horizontale en haut (ConsoleNav), cohérente avec la nav top de SAFE.
 */
export default async function ConsoleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { cabinetId } = await requireCabinetAndUser();
  const isSafe = await isSafeIncCabinet(cabinetId);

  if (!isSafe) {
    redirect("/tableau-de-bord");
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <p className="text-xs uppercase tracking-wide text-emerald-700">
          Console SAFE Inc. — Tour de contrôle interne
        </p>
        <ConsoleNav />
      </div>
      {children}
    </div>
  );
}
