/**
 * Configuration cabinet (JSON dans cabinet.config).
 * Utilisée pour devise, taux d'intérêt, format facture, options d'envoi au client.
 */

export type EnvoiFactureClientConfig = {
  activer?: boolean;
  lienExpirationJours?: number;
};

/**
 * Numéros d'enregistrement fiscaux du cabinet à afficher sur la facture.
 *
 * Doctrine : ces numéros sont REQUIS sur les factures canadiennes lorsque
 * le cabinet collecte des taxes (>30 000 $/an de revenus → inscription
 * obligatoire à TPS/HST/QST auprès de l'ARC et Revenu Québec).
 * Stockés dans Cabinet.config (JSON) plutôt que sous forme de colonnes
 * pour permettre l'évolution sans migration Prisma.
 */
export type CabinetTaxNumbers = {
  /** N° d'inscription HST (Ontario, NB, NS, NL, IPE). */
  hstNumber?: string;
  /** N° d'inscription TPS (toutes provinces sauf HST). */
  gstNumber?: string;
  /** N° d'inscription TVQ (Québec). */
  qstNumber?: string;
  /** Numéro d'entreprise CRA (BN9 ou BN15). Souvent identique au préfixe HST/TPS. */
  businessNumber?: string;
};

/**
 * Offre commerciale personnalisée à afficher sur la page Abonnement.
 *
 * Permet à SAFE de présenter à un cabinet précis une offre négociée
 * (prix mensuel, essai gratuit) sans toucher aux PLANS standards. Affichée
 * comme bannière au-dessus de la grille de plans.
 */
export type PendingOfferConfig = {
  /** Libellé court (ex. "Offre d'activation Kouame Avocat"). */
  label: string;
  /** Prix mensuel en cents (ex. 9900 pour 99 $). */
  monthlyPriceCents: number;
  /** Devise ISO 4217 (CAD, USD…). */
  currency: string;
  /** Mois d'essai gratuit à l'activation. */
  trialMonths: number;
  /** Note optionnelle visible sous le prix. */
  note?: string;
};

export type CabinetConfig = {
  devise?: string;
  tauxInteret?: number;
  formatFacture?: string;
  envoiFactureClient?: EnvoiFactureClientConfig;
  taxNumbers?: CabinetTaxNumbers;
  pendingOffer?: PendingOfferConfig;
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

export function getCabinetTaxNumbers(config: CabinetConfig): CabinetTaxNumbers {
  return config.taxNumbers ?? {};
}

export function getPendingOffer(config: CabinetConfig): PendingOfferConfig | null {
  return config.pendingOffer ?? null;
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
    taxNumbers:
      patch.taxNumbers !== undefined
        ? { ...current.taxNumbers, ...patch.taxNumbers }
        : current.taxNumbers,
  };
  return JSON.stringify(merged);
}
