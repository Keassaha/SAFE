/**
 * Traduction d'un résultat de relance en réponse HTTP.
 *
 * Isolé et pur pour la même raison que `invoice-send-http.ts` : c'est la partie
 * qui peut changer de comportement sans que rien ne le signale. Chaque code est
 * ici, et testé.
 *
 * La distinction qui compte : 400 pour ce que le cabinet peut corriger
 * lui-même (ajouter un courriel au client), 409 pour ce qui rend le geste sans
 * objet (facture payée, pas encore échue), 502 pour ce dont il n'est pas
 * responsable (le service d'envoi refuse).
 */

import type { ResultatRelance } from "./reminder-service";

export interface ReponseRelanceHttp {
  status: number;
  body: Record<string, unknown>;
}

export function reponseHttpPourRelance(resultat: ResultatRelance): ReponseRelanceHttp {
  switch (resultat.statut) {
    case "facture_introuvable":
      return { status: 404, body: { error: "Facture non trouvée" } };

    case "client_sans_courriel":
      return { status: 400, body: { error: "Le client n'a pas d'adresse courriel" } };

    case "deja_payee":
      return { status: 409, body: { error: "Cette facture est déjà payée" } };

    case "pas_en_retard":
      return { status: 409, body: { error: "Cette facture n'est pas en retard" } };

    case "envoi_echoue":
      return { status: 502, body: { error: `Envoi échoué : ${resultat.message}` } };

    case "envoyee":
      return {
        status: 200,
        body: {
          success: true,
          joursDeRetard: resultat.joursDeRetard,
          destinataire: resultat.destinataire,
        },
      };
  }
}
