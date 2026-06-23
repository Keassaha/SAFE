import { redirect } from "next/navigation";
import type { UserRole } from "@prisma/client";
import { requireCabinetAndUser } from "@/lib/auth/session";
import { isSafeInternalUser } from "@/lib/safe-inc";
import { canManageCabinetSettings } from "@/lib/auth/permissions";

/**
 * Layout de la Console SAFE Inc.
 *
 * Accessible uniquement aux membres de l'équipe interne SAFE Inc.
 * (flag `User.isInternal`, avec repli transitoire sur le cabinet "SAFE").
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
  const { userId, role } = await requireCabinetAndUser();
  const isInternal = await isSafeInternalUser(userId);

  // P0 sécurité : la Console exige à la fois un compte interne SAFE Inc. ET un
  // rôle administrateur. Un compte interne non-admin ne doit PAS accéder aux
  // données de tous les clients.
  if (!isInternal || !canManageCabinetSettings(role as UserRole)) {
    redirect("/tableau-de-bord");
  }

  return <>{children}</>;
}
