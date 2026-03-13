/**
 * Configuration cabinet (JSON dans cabinet.config).
 * Utilisée pour devise, taux d'intérêt, format facture, options d'envoi au client.
 */

export type EnvoiFactureClientConfig = {
  activer?: boolean;
  lienExpirationJours?: number;
};

export type CabinetConfig = {
  devise?: string;
  tauxInteret?: number;
  formatFacture?: string;
  envoiFactureClient?: EnvoiFactureClientConfig;
};

const DEFAULT_LIEN_EXPIRATION_JOURS = 30;

export function parseCabinetConfig(rawConfig: string | null): CabinetConfig {
  if (!rawConfig) return {};
  try {
    return JSON.parse(rawConfig) as CabinetConfig;
  } catch {
    return {};
  }
}

export function getEnvoiFactureClientConfig(config: CabinetConfig): EnvoiFactureClientConfig {
  const envoi = config.envoiFactureClient ?? {};
  return {
    activer: envoi.activer ?? true,
    lienExpirationJours: envoi.lienExpirationJours ?? DEFAULT_LIEN_EXPIRATION_JOURS,
  };
}

export function mergeCabinetConfig(
  rawConfig: string | null,
  patch: Partial<CabinetConfig>
): string {
  const current = parseCabinetConfig(rawConfig);
  const merged: CabinetConfig = {
    ...current,
    ...patch,
    envoiFactureClient:
      patch.envoiFactureClient !== undefined
        ? { ...current.envoiFactureClient, ...patch.envoiFactureClient }
        : current.envoiFactureClient,
  };
  return JSON.stringify(merged);
}
