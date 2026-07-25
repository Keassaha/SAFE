import PublicPricingPage from "@/components/public-site/PricingPage";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Tarification",
  description:
    "Des forfaits mensuels clairs pour les cabinets solo et les petites équipes. La configuration initiale est incluse.",
  path: "/tarification",
});

export default function TarificationPage() {
  return <PublicPricingPage />;
}
