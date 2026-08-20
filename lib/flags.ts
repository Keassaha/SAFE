/**
 * Feature flags SAFE (kill-switches par variable d'environnement).
 *
 * Pas de framework de flags dans le repo : un simple garde d'environnement.
 * Doctrine « spec + flag avant chantier » (voir project_dev_doctrine).
 */

function envOff(value: string | undefined): boolean {
  if (value == null) return false;
  return /^(0|off|false|no|disabled)$/i.test(value.trim());
}

function envOn(value: string | undefined): boolean {
  if (value == null) return false;
  return /^(1|on|true|yes|enabled)$/i.test(value.trim());
}

/**
 * Plusieurs personnes sur un dossier (co-clients + parties).
 * Feature SAFE générale : ACTIVÉE par défaut. Kill-switch : SAFE_FEATURE_MULTI_PARTIES=off.
 * Doctrine : docs/product/SPEC_MULTI_CLIENTS_PARTIES_DOSSIER.md
 */
export function isMultiPartiesDossierEnabled(): boolean {
  return !envOff(process.env.SAFE_FEATURE_MULTI_PARTIES);
}

/**
 * Intake client de la Console (ajout manuel d'un cabinet, calqué sur l'audit).
 * ACTIVÉE par défaut. Kill-switch : SAFE_FEATURE_CONSOLE_INTAKE=off.
 * Spec : docs/product/SPEC_INTAKE_CLIENT_CONSOLE.md
 */
export function isConsoleIntakeEnabled(): boolean {
  return !envOff(process.env.SAFE_FEATURE_CONSOLE_INTAKE);
}

/**
 * Mur d'abonnement : bloquer l'application entière quand l'abonnement n'est
 * pas actif. DÉSACTIVÉ par défaut. Interrupteur : SAFE_BLOCAGE_ABONNEMENT=on.
 *
 * Pourquoi le défaut est « ne bloque pas » :
 *
 * Le mur rendait l'écran « Votre abonnement n'est plus actif » à CHAQUE
 * chargement de page, sur tout sauf la page d'abonnement. Un cabinet réel s'y
 * est retrouvé enfermé avec son client et son dossier dedans, sans rien avoir
 * fait de mal : il n'avait simplement jamais eu de ligne Stripe, et seul le
 * webhook peut en écrire une.
 *
 * Un logiciel qu'on essaie d'installer chez un cabinet ne peut pas commencer
 * par lui fermer la porte. La créance n'est pas perdue pour autant : elle
 * devient une obligation visible dans le centre d'alertes, au même titre qu'un
 * rapprochement de fidéicommis en retard. Elle se lit, elle ne hurle pas, et
 * elle n'empêche personne de travailler.
 *
 * L'interrupteur existe pour le jour où un impayé devra vraiment fermer l'accès.
 * Ce jour-là, ce sera une décision, pas un effet de bord.
 */
export function isBlocageAbonnementActif(): boolean {
  return envOn(process.env.SAFE_BLOCAGE_ABONNEMENT);
}
