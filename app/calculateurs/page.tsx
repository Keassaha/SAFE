import CalculateursPage from "@/components/public-site/CalculateursPage";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Outils gratuits",
  description:
    "Des calculs de droit de la famille québécois que vous pouvez vérifier : chaque montant renvoie à son article, et l'outil s'arrête quand le droit ne tranche pas.",
  path: "/calculateurs",
});

export default function Page() {
  return <CalculateursPage />;
}
