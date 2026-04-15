import { requireCabinetAndUser } from "@/lib/auth/session";
import { PageHeader } from "@/components/ui/PageHeader";
import dynamic from "next/dynamic";

const SafeDocGeneratorWizard = dynamic(
  () => import("@/components/outils/SafeDocGeneratorWizard").then(m => ({ default: m.SafeDocGeneratorWizard })),
  {
    loading: () => (
      <div className="animate-pulse space-y-4">
        <div className="flex gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-8 w-24 bg-neutral-200 rounded-safe-sm" />
          ))}
        </div>
        <div className="h-60 bg-neutral-100 rounded-safe-sm" />
      </div>
    ),
  }
);

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
