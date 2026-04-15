import { requireCabinetAndUser } from "@/lib/auth/session";
import { ComplianceDashboard } from "@/components/conformite/ComplianceDashboard";
import { PageHeader } from "@/components/ui/PageHeader";

export default async function ConformitePage() {
  await requireCabinetAndUser();

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Compliance Dashboard"
        description="Real-time compliance status for By-Law 9 (LSO), FINTRAC, PIPEDA, and professional obligations."
      />
      <ComplianceDashboard />
    </div>
  );
}
