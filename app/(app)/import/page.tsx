import { requireCabinetId } from "@/lib/auth/session";
import { SafeImportWizard } from "@/components/import/SafeImportWizard";

export default async function SafeImportPage() {
  await requireCabinetId();

  return <SafeImportWizard />;
}
