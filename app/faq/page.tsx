import PublicFaqPage from "@/components/public-site/FaqPage";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Questions fréquentes",
  description:
    "Sécurité, conformité, accompagnement et fonctionnement de SAFE pour les cabinets d’avocats.",
  path: "/faq",
});

export default function FaqPage() {
  return <PublicFaqPage />;
}
