import { PageHeader } from "@/components/ui/PageHeader";
import { CatalogueDemoView } from "./CatalogueDemoView";

/**
 * PROTOTYPE — Bibliothèque interne d'outils.
 *
 * Démontre l'inversion : le menu d'un cabinet est COMPOSÉ depuis le catalogue
 * + les outils activés, au lieu d'être un tableau statique qu'on filtre.
 *
 * Cochez un outil (ex: le calculateur de patrimoine familial) → il apparaît
 * tout seul au bon endroit dans le menu de gauche.
 */
export default function CataloguePage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Bibliothèque d'outils (prototype)"
        description="Le menu du cabinet se compose depuis le catalogue. Activez un outil, il se place tout seul au bon endroit."
      />
      <CatalogueDemoView />
    </div>
  );
}
