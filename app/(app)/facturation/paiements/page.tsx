import { requirePageAccess } from "@/lib/auth/page-guard";
import { canManageInvoices } from "@/lib/auth/permissions";
import { FacturationPaiementsView } from "./PaiementsView";

export default async function FacturationPaiementsPage() {
  const { cabinetId } = await requirePageAccess(canManageInvoices);
  return <FacturationPaiementsView cabinetId={cabinetId} />;
}
