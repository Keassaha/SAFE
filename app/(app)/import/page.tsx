import { requireCabinetAndUser } from "@/lib/auth/session";
import { canCreateClients } from "@/lib/auth/permissions";
import { SafeImportWizard } from "@/components/import/SafeImportWizard";
import type { UserRole } from "@prisma/client";

/**
 * SAFE Import : la porte unique de ce qui entre dans SAFE depuis l'extérieur.
 * Deux moyens, importer des documents et reprendre des exercices précédents.
 */
export default async function SafeImportPage({
  searchParams,
}: {
  searchParams: Promise<{ section?: string }>;
}) {
  const { role } = await requireCabinetAndUser();
  const params = await searchParams;

  return (
    <SafeImportWizard
      peutReprendreExercices={canCreateClients(role as UserRole)}
      ongletInitial={params.section === "exercices" ? "exercices" : "import"}
    />
  );
}
