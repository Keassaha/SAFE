import { requireCabinetAndUser } from "@/lib/auth/session";
import { PageHeader } from "@/components/ui/PageHeader";
import { SafeFamilyCalculator } from "@/components/outils/SafeFamilyCalculator";
import { routes } from "@/lib/routes";

export default async function CalculateurFamilialPage() {
  await requireCabinetAndUser();

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Calculateur familial"
        description="Pension alimentaire (Annexe I), patrimoine familial, société d'acquêts et prestation compensatoire — Table de fixation 2026."
        breadcrumbs={[
          { label: "Outils", href: routes.outils },
          { label: "Calculateur familial", href: routes.outilsCalculateurFamilial },
        ]}
      />
      <SafeFamilyCalculator />
    </div>
  );
}
