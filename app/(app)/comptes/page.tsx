import { requireCabinetAndUser } from "@/lib/auth/session";
import { canViewBillingTrust, canEditBillingTrust } from "@/lib/auth/permissions";
import { prisma } from "@/lib/db";
import { FideicommisDashboard } from "@/components/fideicommis/FideicommisDashboard";
import { AddTransactionButton } from "@/components/fideicommis/AddTransactionButton";
import { PageHeader } from "@/components/ui/PageHeader";
import { routes } from "@/lib/routes";

export default async function ComptesPage() {
  const { cabinetId, role } = await requireCabinetAndUser();
  if (!canViewBillingTrust(role as "admin_cabinet" | "avocat" | "assistante" | "comptabilite")) {
    return (
      <div className="p-6">
        <p className="text-status-error">Vous n&apos;avez pas accès à cette section.</p>
      </div>
    );
  }

  const [clients, dossiers] = await Promise.all([
    prisma.client.findMany({
      where: { cabinetId },
      orderBy: { raisonSociale: "asc" },
      select: { id: true, raisonSociale: true },
    }),
    prisma.dossier.findMany({
      where: { cabinetId },
      orderBy: { intitule: "asc" },
      select: { id: true, clientId: true, intitule: true, numeroDossier: true },
    }),
  ]);

  const canEdit = canEditBillingTrust(role as "admin_cabinet" | "avocat" | "assistante" | "comptabilite");

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Comptes en fidéicommis"
        description="Dépôts, retraits et relevés du compte en fidéicommis par client et dossier."
        backHref={routes.facturation}
        backLabel="Retour à la facturation"
        action={
          <AddTransactionButton
            canEdit={canEdit}
            cabinetId={cabinetId}
            clients={clients}
            dossiers={dossiers}
          />
        }
      />

      <FideicommisDashboard
        cabinetId={cabinetId}
        canEdit={canEdit}
        clients={clients}
        dossiers={dossiers}
        seuilBas={500}
      />
    </div>
  );
}
