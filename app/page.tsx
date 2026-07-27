import ExperienceCinema from "@/components/public-site/ExperienceCinema";
import { JsonLd } from "@/components/seo/JsonLd";
import { buildMetadata, organizationSchema, softwareApplicationSchema } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "SAFE | Gestion et fidéicommis pour cabinets d’avocats",
  description:
    "SAFE relie vos dossiers, votre temps, votre facturation et votre fidéicommis, avec des alertes lorsqu’un écart demande votre attention.",
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
