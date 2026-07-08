import { notFound, redirect } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { requireCabinetAndUser } from "@/lib/auth/session";
import { isSafeIncCabinet } from "@/lib/safe-inc";
import { isConsoleIntakeEnabled } from "@/lib/flags";
import { ConsoleIntakeForm } from "@/components/console/ConsoleIntakeForm";
import { listImportableAudits } from "./actions";

/**
 * Intake client Console — ajout manuel d'un cabinet, calqué sur l'audit.
 * Réservé à SAFE Inc. (dog food) + derrière le flag SAFE_FEATURE_CONSOLE_INTAKE.
 * Spec : docs/product/SPEC_INTAKE_CLIENT_CONSOLE.md
 */
export default async function NouveauClientPage() {
  if (!isConsoleIntakeEnabled()) notFound();

  const { cabinetId } = await requireCabinetAndUser();
  if (!(await isSafeIncCabinet(cabinetId))) {
    redirect("/tableau-de-bord");
  }

  const imports = await listImportableAudits();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title="Nouveau client"
        description="Ajouter un cabinet à la main. Mêmes questions que l'audit gratuit ; remplissez ce que vous savez."
        backHref="/console/clients"
        backLabel="Tous les clients"
      />
      <ConsoleIntakeForm imports={imports} />
    </div>
  );
}
