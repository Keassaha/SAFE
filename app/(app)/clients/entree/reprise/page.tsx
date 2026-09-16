import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { requireCabinetAndUser } from "@/lib/auth/session";
import { canCreateClients } from "@/lib/auth/permissions";
import { ReprisePage } from "@/components/clients/reprise/ReprisePage";
import type { UserRole } from "@prisma/client";

/**
 * Reprise de l'historique de facturation — priorité 2 du chantier « un
 * cabinet arrive avec sa clientèle » (suite de `/clients/entree`).
 */
export const dynamic = "force-dynamic";

export default async function ReprisePageRoute() {
  const { role } = await requireCabinetAndUser();
  if (!canCreateClients(role as UserRole)) notFound();

  return (
    <div className="mx-auto max-w-[1180px] px-6 pb-2 pt-6">
      <PageHeader
        variant="dashboard"
        title="Reprise de l'historique"
        description="D'anciennes factures, déposées en vrac, rangées ici de la plus ancienne à la plus récente."
      />
      <ReprisePage />
    </div>
  );
}
