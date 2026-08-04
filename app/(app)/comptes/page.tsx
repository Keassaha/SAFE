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
          <AddTransactionButton
            canEdit={canEdit}
            cabinetId={cabinetId}
            clients={clients}
            dossiers={dossiers}
          />
        }
      />

      {/* Les écrans réglementaires ont leur propre section.
          Les garder ici melangeait le fideicommis avec ce qui n'en releve pas :
          quatre des neuf registres et la trousse concernent tout le cabinet. */}
      <Link
        href={routes.inspection}
        className="flex items-baseline justify-between gap-4 rounded-xl border border-[var(--si-line)] bg-[var(--si-surface)] px-4 py-3 transition-colors hover:bg-[#0B1F19]/[0.03]"
      >
        <span>
          <span className="block text-sm font-medium text-[var(--si-ink)]">Inspection</span>
          <span className="mt-0.5 block text-xs text-[var(--si-muted)]">
            Rapport mensuel, registres, trousse et le reste de ce qu'un inspecteur demande.
          </span>
        </span>
        <span className="shrink-0 text-sm text-[var(--si-muted)]">Ouvrir</span>
      </Link>

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
