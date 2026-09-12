import { requireCabinetAndUser } from "@/lib/auth/session";
import { canViewBillingTrust, canEditBillingTrust } from "@/lib/auth/permissions";
import { prisma } from "@/lib/db";
import { FideicommisDashboard } from "@/components/fideicommis/FideicommisDashboard";
import { getTranslations } from "next-intl/server";

export default async function ComptesPage() {
  const t = await getTranslations("accountingUi");
  const { cabinetId, role } = await requireCabinetAndUser();
  if (!canViewBillingTrust(role as "admin_cabinet" | "avocat" | "assistante" | "comptabilite")) {
    return (
      <div className="p-6">
        <p className="text-si-danger-ink">{t("noAccess")}</p>
      </div>
    );
  }

  const [clients, dossiers] = await Promise.all([
    prisma.client.findMany({
      where: { cabinetId },
      orderBy: { raisonSociale: "asc" },
      select: { id: true, raisonSociale: true, prenom: true, nom: true },
    }),
    prisma.dossier.findMany({
      where: { cabinetId },
      orderBy: { intitule: "asc" },
      select: { id: true, clientId: true, intitule: true, numeroDossier: true },
    }),
  ]);

  const canEdit = canEditBillingTrust(role as "admin_cabinet" | "avocat" | "assistante" | "comptabilite");

  /* L'en-tête, la barre de chiffres, les liens et le registre vivent dans le
     composant client : le bouton « Relevé PDF » doit connaître les filtres du
     registre pour s'ouvrir déjà rempli. */
  return <FideicommisDashboard cabinetId={cabinetId} canEdit={canEdit} clients={clients} dossiers={dossiers} />;
}
