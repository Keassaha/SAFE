import { requireCabinetAndUser } from "@/lib/auth/session";
import { canEditBillingTrust } from "@/lib/auth/permissions";
import { LSOReportGenerator } from "@/components/fideicommis/LSOReportGenerator";
import { PageHeader } from "@/components/ui/PageHeader";

export default async function TrustReportsPage() {
  const { role } = await requireCabinetAndUser();
  if (!canEditBillingTrust(role as "admin_cabinet" | "avocat" | "assistante" | "comptabilite")) {
    return (
      <div className="p-6">
        <p className="text-status-error">You do not have access to this section.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Trust Compliance Reports"
        description="Generate LSO By-Law 9 compliance reports for spot audit readiness. Includes transaction journal, 3-way reconciliation, and LFO interest summary."
        backHref="/comptes"
        backLabel="Back to Trust Accounts"
      />
      <LSOReportGenerator />
    </div>
  );
}
