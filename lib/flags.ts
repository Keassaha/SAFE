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

/**
 * Plusieurs personnes sur un dossier (co-clients + parties).
 * Feature SAFE générale : ACTIVÉE par défaut. Kill-switch : SAFE_FEATURE_MULTI_PARTIES=off.
 * Doctrine : docs/product/SPEC_MULTI_CLIENTS_PARTIES_DOSSIER.md
 */
export function isMultiPartiesDossierEnabled(): boolean {
  return !envOff(process.env.SAFE_FEATURE_MULTI_PARTIES);
}
