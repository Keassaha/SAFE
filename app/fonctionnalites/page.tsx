import PublicFeaturesPage from "@/components/public-site/FeaturesPage";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Fonctionnalités",
  description:
    "Le travail du jour, les dossiers, le temps, la facturation, la comptabilité et le fidéicommis reliés dans un même système, pour les cabinets du Québec et de l’Ontario.",
  path: "/fonctionnalites",
});

export default function FonctionnalitesPage() {
  return <PublicFeaturesPage />;
}
