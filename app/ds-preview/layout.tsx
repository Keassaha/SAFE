import { notFound } from "next/navigation";
import { apercuDesignFerme } from "@/lib/apercu-design";

/**
 * Ces pages ne se pregenerent pas.
 *
 * Sans cela, la porte est evaluee au BUILD pour les pages statiques du dossier
 * et a la REQUETE pour les autres : un build de production les figeait en 404,
 * et elles restaient fermees sur une preversion servie par le meme build.
 * Mesure faite, pas supposee. Forcer le rendu dynamique supprime la question :
 * la porte ne depend plus que de l'environnement au moment de la requete.
 */
export const dynamic = "force-dynamic";

/**
 * Porte des controles visuels.
 *
 * Le middleware arrete deja la requete en production. Ce garde-fou est le
 * second tour de cle : il vit a cote des pages qu'il protege, donc il survit a
 * une modification du `matcher` du middleware, et il rend la vraie page 404 de
 * l'application plutot qu'une reponse nue.
 *
 */
export default function ApercuDesignLayout({ children }: { children: React.ReactNode }) {
  if (apercuDesignFerme()) {
    notFound();
  }
  return <>{children}</>;
}
