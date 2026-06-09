import { redirect } from "next/navigation";
import { requireCabinetAndUser } from "@/lib/auth/session";
import { isSafeIncCabinet } from "@/lib/safe-inc";

/**
 * Layout de la Console SAFE Inc.
 *
 * Accessible uniquement aux utilisateurs rattachés au Cabinet SAFE (dog food, ADR-006).
 * Toute autre tentative redirige vers le tableau de bord normal.
 *
 * La navigation est désormais UNIFIÉE dans le Header (mode consultant), donc
 * plus de barre ConsoleNav séparée ici. Spec : CONSOLE_CONSULTANT_REFACTOR_v1.
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

  return <>{children}</>;
}
