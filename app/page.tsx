import ExperienceCinema from "@/components/public-site/ExperienceCinema";
import { JsonLd } from "@/components/seo/JsonLd";
import { buildMetadata, organizationSchema, softwareApplicationSchema } from "@/lib/seo";

/**
 * Le titre reprend mot pour mot l'exergue de la première vue.
 *
 * Il annonçait « Gestion et fidéicommis », ce que la page racontait avant sa
 * refonte du 20 août 2026 : deux modules. Elle présente maintenant une suite,
 * et un titre d'onglet qui promet autre chose que la page fait cliquer puis
 * repartir. 53 caractères, dans la fenêtre de 50 à 60 de la stratégie SEO.
 *
 * Ce que le titre perd, la description le reprend : « fidéicommis » et
 * « comptabilité » sont les deux mots que cherche une avocate du Québec, et
 * c'est la description qui porte la longue traîne. 152 caractères, dans la
 * fenêtre de 140 à 160.
 *
 * Réf. : docs/marketing/seo/STRATEGIE_SEO_2026.md §A.2.
 */
export const metadata = buildMetadata({
  title: "SAFE | La suite administrative des cabinets d’avocats",
  description:
    "SAFE relie l’administration, les dossiers, le temps, la facturation, la comptabilité et le fidéicommis d’un cabinet d’avocats du Québec ou de l’Ontario.",
  path: "/",
});

export default function LandingPage() {
  return (
    <>
      <JsonLd schema={[organizationSchema(), softwareApplicationSchema()]} />
      <ExperienceCinema />
    </>
  );
}
