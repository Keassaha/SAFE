import { requireCabinetAndUser } from "@/lib/auth/session";
import { canEditBillingTrust } from "@/lib/auth/permissions";
import { ReconciliationWorkflow } from "@/components/fideicommis/ReconciliationWorkflow";
import { PageHeader } from "@/components/ui/PageHeader";
import { getCabinetProvince } from "@/lib/cabinet/get-province";
import { getTrustRegulatorCopy } from "@/lib/trust/regulator";
import { getTranslations } from "next-intl/server";

export default async function ReconciliationPage() {
  const { cabinetId, role } = await requireCabinetAndUser();
  const t = await getTranslations("trustReconciliationUi");
  if (!canEditBillingTrust(role as "admin_cabinet" | "avocat" | "assistante" | "comptabilite")) {
    return (
      <div className="p-6">
        <p className="text-status-error">{t("accessDenied")}</p>
      </div>
    );
  }

  const copy = getTrustRegulatorCopy(await getCabinetProvince(cabinetId));

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title={copy.isQuebec ? t("titleQc") : t("titleOn")}
        description={t("description", {
          regulation: copy.isQuebec ? t("regulation.qc") : t("regulation.on"),
        })}
        backHref="/comptes"
        backLabel={copy.isQuebec ? t("backQc") : t("backOn")}
        variant="dashboard"
      />
      <ReconciliationWorkflow />
    </div>
  );
}
