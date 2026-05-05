import { redirect } from "next/navigation";

/**
 * /facturation/honoraires est consolidé dans /facturation#facturables.
 * On garde la route en place pour les bookmarks et redirige côté serveur.
 * Le drill-down /facturation/honoraires/[clientId] reste actif.
 */
export default function FacturationHonorairesPage() {
  redirect("/facturation#facturables");
}
