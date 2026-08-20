import { requireCabinetAndUser } from "@/lib/auth/session";
import { PageHeader } from "@/components/ui/PageHeader";
import { routes } from "@/lib/routes";
import { PatrimoineFamilialCalculateur } from "@/components/outils/PatrimoineFamilialCalculateur";

/**
 * Le calculateur de patrimoine familial.
 *
 * Le catalogue déclarait cet outil et sa route depuis longtemps
 * (`lib/catalog/catalog.ts`, id `calc-patrimoine-familial`), sans que la route existe.
 * C'était du moteur sans bouton.
 *
 * Rien ici ne touche à la base : le calcul est une fonction pure, et la page ne lit
 * aucun dossier. C'est la condition 2 du §5bis de REGLE_DE_BUILD.md.
 */
export default async function PatrimoineFamilialPage() {
  await requireCabinetAndUser();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Patrimoine familial"
        description="Le partage, calculé article par article, avec ce qu'il ne tranche pas."
        breadcrumbs={[
          { label: "Outils", href: routes.outils },
          { label: "Patrimoine familial", href: "/outils/patrimoine-familial" },
        ]}
      />
      <PatrimoineFamilialCalculateur />
    </div>
  );
}
