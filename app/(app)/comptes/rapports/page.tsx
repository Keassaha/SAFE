import { requireCabinetAndUser } from "@/lib/auth/session";
import {
  canViewBillingTrust,
  canEditBillingTrust,
  canCertifyComplianceReport,
} from "@/lib/auth/permissions";
import type { UserRole } from "@prisma/client";
import { LSOReportGenerator } from "@/components/fideicommis/LSOReportGenerator";
import { PageHeader } from "@/components/ui/PageHeader";
import { getCabinetProvince } from "@/lib/cabinet/get-province";
import { getTrustRegulatorCopy } from "@/lib/trust/regulator";

export default async function TrustReportsPage() {
  const { cabinetId, role } = await requireCabinetAndUser();
  const userRole = role as UserRole;
  if (!canViewBillingTrust(userRole)) {
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
        title={copy.trustReportsTitle}
        description={copy.trustReportsDesc}
        backHref="/comptes"
        backLabel={copy.backToTrustAccounts}
      />
      <LSOReportGenerator
        canGenerate={canEditBillingTrust(userRole)}
        canCertify={canCertifyComplianceReport(userRole)}
      />
    </div>
  );
}
