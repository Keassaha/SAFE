import { requireCabinetAndUser } from "@/lib/auth/session";
import { PageHeader } from "@/components/ui/PageHeader";
import { routes } from "@/lib/routes";
import { PensionAlimentaireCalculateur } from "@/components/outils/PensionAlimentaireCalculateur";

export default async function PensionAlimentairePage() {
  await requireCabinetAndUser();
  return (
    <div className="space-y-6">
      <PageHeader
        title="Pension alimentaire"
        description="Le calcul du formulaire officiel, ligne par ligne, avec ce qu'il ne tranche pas."
        breadcrumbs={[
          { label: "Outils", href: routes.outils },
          { label: "Pension alimentaire", href: "/outils/pension-alimentaire" },
        ]}
      />
      <PensionAlimentaireCalculateur />
    </div>
  );
}
