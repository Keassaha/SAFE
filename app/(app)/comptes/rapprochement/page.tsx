import { requireCabinetAndUser } from "@/lib/auth/session";
import { canEditBillingTrust } from "@/lib/auth/permissions";
import { ReconciliationWorkflow } from "@/components/fideicommis/ReconciliationWorkflow";
import { PageHeader } from "@/components/ui/PageHeader";

export default async function ReconciliationPage() {
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
        title="Trust Reconciliation"
        description="Monthly 3-way reconciliation per By-Law 9, LSO. Compare bank statement, SAFE register, and per-matter balances."
        backHref="/comptes"
        backLabel="Back to Trust Accounts"
      />
      <ReconciliationWorkflow />
    </div>
  );
}
