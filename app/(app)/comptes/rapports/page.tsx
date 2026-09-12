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
        <p className="text-si-danger-ink">You do not have access to this section.</p>
      </div>
    );
  }

  const copy = getTrustRegulatorCopy(await getCabinetProvince(cabinetId));

  return (
    <div className="space-y-6">
      {/* Le titre porte la phrase du geste ; le retour ne nomme que l'écran
          d'où l'on vient. Demande CEO du 2026-09-12. */}
      <PageHeader
        variant="dashboard"
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
