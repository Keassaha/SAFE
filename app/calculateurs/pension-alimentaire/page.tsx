import CalculateurPensionPage from "@/components/public-site/CalculateurPensionPage";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Calculateur de pension alimentaire pour enfants (Québec)",
  description:
    "Calculez la pension alimentaire selon le formulaire officiel québécois et la table applicable depuis le 1er janvier 2026. Chaque étape porte son numéro de ligne.",
  path: "/calculateurs/pension-alimentaire",
});

export default function Page() {
  return <CalculateurPensionPage />;
}
