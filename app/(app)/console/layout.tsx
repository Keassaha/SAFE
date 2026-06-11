import { redirect } from "next/navigation";
import type { UserRole } from "@prisma/client";
import { requireCabinetAndUser } from "@/lib/auth/session";
import { isSafeIncCabinet } from "@/lib/safe-inc";
import { canManageCabinetSettings } from "@/lib/auth/permissions";

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
  const { cabinetId, role } = await requireCabinetAndUser();
  const isSafe = await isSafeIncCabinet(cabinetId);

  // P0 sécurité : la Console n'est pas seulement réservée au cabinet SAFE, elle
  // exige aussi un rôle administrateur. Un compte non-admin du cabinet SAFE
  // (assistante, comptabilité) ne doit PAS accéder aux données de tous les clients.
  // Étape minimale ; un rôle interne distinct (User.isInternal) est prévu en P3.
  if (!isSafe || !canManageCabinetSettings(role as UserRole)) {
    redirect("/tableau-de-bord");
  }

  return <>{children}</>;
}
