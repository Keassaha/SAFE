import { requireCabinetAndUser } from "@/lib/auth/session";
import { canEditBillingTrust } from "@/lib/auth/permissions";
import { ReconciliationWorkflow } from "@/components/fideicommis/ReconciliationWorkflow";
import { PageHeader } from "@/components/ui/PageHeader";
import { getCabinetProvince } from "@/lib/cabinet/get-province";
import { getTrustRegulatorCopy } from "@/lib/trust/regulator";

export default async function ReconciliationPage() {
  const { cabinetId, role } = await requireCabinetAndUser();
  if (!canEditBillingTrust(role as "admin_cabinet" | "avocat" | "assistante" | "comptabilite")) {
    return (
      <div className="p-6">
        <p className="text-[#B84A3E]">You do not have access to this section.</p>
      </div>
    );
  }

  const copy = getTrustRegulatorCopy(await getCabinetProvince(cabinetId));

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title={copy.trustReconciliationTitle}
        description={copy.trustReconciliationDesc}
        backHref="/comptes"
        backLabel={copy.backToTrustAccounts}
      />
      <ReconciliationWorkflow />
    </div>
  );
}
