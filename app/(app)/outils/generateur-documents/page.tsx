import { requireCabinetAndUser } from "@/lib/auth/session";
import { PageHeader } from "@/components/ui/PageHeader";
import { SafeDocGeneratorWizard } from "@/components/outils/SafeDocGeneratorWizard";

export default async function GenerateurDocumentsPage() {
  await requireCabinetAndUser();

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Générateur de documents"
        description="Documents en droit familial québécois (CCQ, CPC, TUF). Wizard en 5 étapes : catégorie → document → informations → rédaction IA → aperçu. Révision professionnelle obligatoire."
        breadcrumbs={[
          { label: "Outils", href: "/outils" },
          { label: "Générateur de documents", href: "/outils/generateur-documents" },
        ]}
      />
      <SafeDocGeneratorWizard />
    </div>
  );
}
