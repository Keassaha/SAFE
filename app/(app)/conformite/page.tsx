import { requireCabinetAndUser } from "@/lib/auth/session";
import { ComplianceDashboard } from "@/components/conformite/ComplianceDashboard";
import { PageHeader } from "@/components/ui/PageHeader";
import { getCabinetProvince } from "@/lib/cabinet/get-province";
import { getTrustRegulatorCopy } from "@/lib/trust/regulator";

export default async function ConformitePage() {
  const { cabinetId } = await requireCabinetAndUser();
  const copy = getTrustRegulatorCopy(await getCabinetProvince(cabinetId));

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title={copy.complianceTitle}
        description={copy.complianceDesc}
      />
      <ComplianceDashboard />
    </div>
  );
}
