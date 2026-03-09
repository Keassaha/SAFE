import { requireCabinetAndUser } from "@/lib/auth/session";
import { HonorairesDetailClientView } from "./HonorairesDetailClientView";

export default async function HonorairesDetailPage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { role } = await requireCabinetAndUser();
  const { clientId } = await params;
  return <HonorairesDetailClientView clientId={clientId} role={role} />;
}
