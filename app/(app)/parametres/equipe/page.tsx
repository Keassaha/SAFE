import { redirect } from "next/navigation";
import { routes } from "@/lib/routes";

/**
 * /parametres/equipe a été supprimée — la gestion d'équipe vit
 * maintenant sous /employees (liste, filtres, invitations).
 *
 * Redirection conservée le temps que les anciens liens externes
 * (emails d'invitation, marque-pages) soient mis à jour.
 */
export default function ParametresEquipeRedirect() {
  redirect(routes.employees);
}
