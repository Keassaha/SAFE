import { requireCabinetAndUser } from "@/lib/auth/session";
import { FactureEditView } from "./FactureEditView";

export default async function FactureEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireCabinetAndUser();
  const { id } = await params;
  return <FactureEditView invoiceId={id} />;
}
