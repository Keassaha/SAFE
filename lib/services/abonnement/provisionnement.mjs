/**
 * SAFE — Règles de provisionnement d'un cabinet abonné (dog food, ADR-006).
 *
 * SAFE Inc. facture ses abonnés avec son propre module de facturation. Pour
 * qu'un encaissement puisse prolonger un accès, il faut une fiche client chez
 * SAFE Inc. reliée au cabinet abonné par `Client.cabinetAbonneId`.
 *
 * Ce module ne contient que les règles, pures et testables. L'écriture vit dans
 * `scripts/provisionner-abonne.mjs`, qui simule par défaut.
 *
 * POURQUOI DU JAVASCRIPT ET PAS DU TYPESCRIPT : ces règles servent à la fois
 * l'application (le cron de facturation à venir) et un script en ligne de
 * commande exécuté par `node`. Node 20, la version installée ici, ne sait pas
 * exécuter du TypeScript. Les recopier dans le script en dupliquerait la
 * définition, et deux copies d'une règle finissent toujours par diverger.
 * Les types sont donc portés par JSDoc, et `tsc` les vérifie quand même.
 */

/** Dernier jour utilisable comme jour de facturation mensuel. */
export const JOUR_FACTURATION_MAX = 28;

/**
 * Valide un jour de facturation mensuel.
 *
 * Plafonné à 28 : les 29, 30 et 31 n'existent pas tous les mois. Un abonné
 * facturé « le 31 » sauterait février, et l'accès construit dessus expirerait
 * sans que personne ne comprenne pourquoi. Mieux vaut refuser à la saisie que
 * produire un trou une fois par an.
 */
/**
 * @param {unknown} valeur
 * @returns {{ok: true, jour: number} | {ok: false, message: string}}
 */
export function validerJourFacturation(valeur) {
  const n = typeof valeur === "string" ? Number(valeur) : valeur;
  if (typeof n !== "number" || !Number.isInteger(n)) {
    return { ok: false, message: "Le jour de facturation doit être un entier." };
  }
  if (n < 1 || n > JOUR_FACTURATION_MAX) {
    return {
      ok: false,
      message:
        `Le jour de facturation doit être entre 1 et ${JOUR_FACTURATION_MAX}. ` +
        "Au-delà, le mois de février n'a pas ce jour et la facture sauterait.",
    };
  }
  return { ok: true, jour: n };
}

/**
 * Valide un montant mensuel d'abonnement.
 *
 * Refuse zéro : un abonnement gratuit ne se provisionne pas ici, il s'accorde
 * avec `scripts/accorder-abonnement-gratuit.mjs`. Confondre les deux ferait
 * émettre une facture de 0 $ à un cabinet, ce qui n'a pas de sens comptable.
 */
/**
 * @param {unknown} valeur
 * @returns {{ok: true, montant: number} | {ok: false, message: string}}
 */
export function validerMontantMensuel(valeur) {
  const n = typeof valeur === "string" ? Number(valeur.replace(",", ".")) : valeur;
  if (typeof n !== "number" || !Number.isFinite(n)) {
    return { ok: false, message: "Le montant mensuel doit être un nombre." };
  }
  if (n <= 0) {
    return {
      ok: false,
      message:
        "Le montant mensuel doit être supérieur à zéro. Pour un accès gratuit, " +
        "utilisez plutôt scripts/accorder-abonnement-gratuit.mjs.",
    };
  }
  if (Math.round(n * 100) !== n * 100) {
    return { ok: false, message: "Le montant mensuel ne peut pas avoir plus de deux décimales." };
  }
  return { ok: true, montant: n };
}

/**
 * Vérifie que le cabinet facturier n'appliquera aucune taxe.
 *
 * SAFE Inc. n'est pas inscrite à la TPS ni à la TVQ (décision CEO 2026-08-20).
 * Or la config taxes retombe sur le Québec par défaut quand elle est absente :
 * une facture d'abonnement émise aujourd'hui porterait donc TPS 5 % et TVQ
 * 9,975 % sans droit de les percevoir, et sans numéro d'inscription à afficher.
 *
 * On bloque le provisionnement plutôt que d'espérer que personne n'émette de
 * facture avant que la config soit posée.
 */
/**
 * @param {string | null | undefined} mode
 * @returns {{ok: true} | {ok: false, mode: string, message: string}}
 */
export function verifierAucuneTaxe(mode) {
  if (mode === "none") return { ok: true };
  return {
    ok: false,
    mode: mode ?? "(absent, donc QC par défaut)",
    message:
      "Le cabinet facturier appliquerait des taxes. SAFE Inc. n'étant pas inscrite, " +
      "une facture taxée serait une perception indue et n'aurait aucun numéro à afficher. " +
      "Relancez avec --configurer-taxes pour poser le mode « aucune taxe ».",
  };
}
