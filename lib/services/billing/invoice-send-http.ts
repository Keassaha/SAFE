/**
 * SAFE — Traduction d'un résultat d'envoi de facture en réponse HTTP.
 *
 * Isolé et pur pour une raison précise : c'est la seule partie du refactor de
 * l'envoi qui pouvait changer de comportement sans que rien ne le signale. Les
 * cinq codes d'origine (404, 400, 502, 207, 200) sont ici, et testés.
 */

import type { ResultatEnvoiFacture } from "./invoice-send-service";

export interface ReponseEnvoiHttp {
  status: number;
  body: Record<string, unknown>;
}

export function reponseHttpPourEnvoi(resultat: ResultatEnvoiFacture): ReponseEnvoiHttp {
  switch (resultat.statut) {
    case "facture_introuvable":
      return { status: 404, body: { error: "Facture non trouvée" } };

    case "client_sans_courriel":
      return { status: 400, body: { error: "Le client n'a pas d'adresse courriel" } };

    case "envoi_echoue":
      return {
        status: 502,
        body: { error: `Envoi échoué : ${resultat.message}`, pdfWasAttached: false },
      };

    case "envoye_statut_non_escalade":
      return {
        status: 207,
        body: {
          success: true,
          pdfWasAttached: resultat.pdfJoint,
          warning: "Email envoyé mais escalade de statut échouée. Vérifier le statut.",
        },
      };

    case "envoye":
      return {
        status: 200,
        body: {
          success: true,
          pdfWasAttached: resultat.pdfJoint,
          pdfError: resultat.pdfError ?? undefined,
          message: "Facture envoyée par email",
        },
      };
  }
}
