import { requirePageAccess } from "@/lib/auth/page-guard";
import { canManageInvoices, canViewBilling } from "@/lib/auth/permissions";
import { FacturationPaiementsView } from "./PaiementsView";

export default async function FacturationPaiementsPage() {
  const { cabinetId, role } = await requirePageAccess(canViewBilling);
  return <FacturationPaiementsView cabinetId={cabinetId} canWrite={canManageInvoices(role)} />;
}
