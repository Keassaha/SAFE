import { requireCabinetAndUser } from "@/lib/auth/session";
import { PageHeader } from "@/components/ui/PageHeader";
import dynamic from "next/dynamic";
import { routes } from "@/lib/routes";

const SafeFamilyCalculator = dynamic(
  () => import("@/components/outils/SafeFamilyCalculator").then(m => ({ default: m.SafeFamilyCalculator })),
  {
    ssr: false,
    loading: () => (
      <div className="animate-pulse space-y-4">
        <div className="h-11 bg-neutral-200 rounded-safe-sm w-full max-w-md" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="h-40 bg-neutral-100 rounded-safe-sm" />
          <div className="h-40 bg-neutral-100 rounded-safe-sm" />
        </div>
        <div className="h-60 bg-neutral-100 rounded-safe-sm" />
      </div>
    ),
  }
);

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
