import { requireCabinetAndUser } from "@/lib/auth/session";
import { HonorairesAFacturerView } from "./HonorairesAFacturerView";

export default async function FacturationHonorairesPage() {
  const { cabinetId, role } = await requireCabinetAndUser();
  return <HonorairesAFacturerView cabinetId={cabinetId} role={role} />;
}
