import CalculateurPatrimoinePage from "@/components/public-site/CalculateurPatrimoinePage";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Calculateur de partage du patrimoine familial (Québec)",
  description:
    "Calculez la valeur à partager du patrimoine familial selon les articles 414 à 426 du Code civil du Québec. Chaque étape cite son article, y compris la déduction proportionnelle de la plus-value.",
  path: "/calculateurs/patrimoine-familial",
});

export default function Page() {
  return <CalculateurPatrimoinePage />;
}
