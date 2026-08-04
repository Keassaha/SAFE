import { requireCabinetAndUser } from "@/lib/auth/session";
import { canViewBillingTrust, canEditBillingTrust } from "@/lib/auth/permissions";
import { prisma } from "@/lib/db";
import { FideicommisDashboard } from "@/components/fideicommis/FideicommisDashboard";
import { AddTransactionButton } from "@/components/fideicommis/AddTransactionButton";
import { PageHeader } from "@/components/ui/PageHeader";
import { routes } from "@/lib/routes";
import { getTranslations } from "next-intl/server";
import Link from "next/link";

export default async function ComptesPage() {
  const t = await getTranslations("accountingUi");
  const { cabinetId, role } = await requireCabinetAndUser();
  if (!canViewBillingTrust(role as "admin_cabinet" | "avocat" | "assistante" | "comptabilite")) {
    return (
      <div className="p-6">
        <p className="text-[#B84A3E]">{t("noAccess")}</p>
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

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title={t("trustAccountsTitle")}
        description={t("trustAccountsDescription")}
        backHref={routes.facturation}
        backLabel={t("backToBilling")}
        action={
          <div className="flex items-center gap-2">
            {/* Le rapport mensuel est le premier document qu'un inspecteur demande.
                Il vit à un clic de l'écran des comptes, pas dans un sous-menu. */}
            <Link
              href={routes.trousseInspection}
              className="rounded-lg border border-[var(--si-line)] px-3 py-2 text-sm text-[var(--si-ink)] transition-colors hover:bg-[#0B1F19]/[0.04]"
            >
              Trousse d'inspection
            </Link>
            <Link
              href={routes.rapportMensuel}
              className="rounded-lg border border-[var(--si-line)] px-3 py-2 text-sm text-[var(--si-ink)] transition-colors hover:bg-[#0B1F19]/[0.04]"
            >
              Rapport mensuel
            </Link>
            <AddTransactionButton
            canEdit={canEdit}
            cabinetId={cabinetId}
            clients={clients}
              dossiers={dossiers}
            />
          </div>
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
