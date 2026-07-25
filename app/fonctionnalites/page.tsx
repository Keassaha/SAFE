import PublicFeaturesPage from "@/components/public-site/FeaturesPage";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Fonctionnalités",
  description:
    "Fidéicommis, facturation, temps et dossiers reliés dans un système conçu pour les petits cabinets d’avocats.",
  path: "/fonctionnalites",
});

export default function FonctionnalitesPage() {
  return <PublicFeaturesPage />;
}
