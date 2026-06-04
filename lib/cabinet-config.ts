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
 * Modèle visuel de facture appliqué pour le cabinet.
 * - `standard` : gabarit SAFE générique (multi-cabinets).
 * - `derisier` : gabarit imitant l'échantillon Derisier Law (en-tête centré,
 *   table « Honoraires & Débours », bloc N.B. fiducie, mention E. & O.).
 */
export type CabinetInvoiceTemplate = "standard" | "derisier";

/**
 * Bloc N.B. propre au cabinet (mentions légales + instructions de paiement),
 * rendu en bas de la facture. Chaque entrée est un paragraphe ; la première
 * ligne est mise en évidence (ex. « TOUS LES SERVICES SONT ASSUJETTIS À LA TVH »).
 * Bilingue : on choisit `fr`/`en` selon la langue de la facture.
 */
export type CabinetInvoiceNotice = {
  fr?: string[];
  en?: string[];
};

/**
 * Signature reproduite en bas de facture (option activée par facture).
 * Aucun fichier image n'est requis : le nom est rendu dans une police
 * manuscrite/italique pour imiter une signature. Le `title` (bilingue) est
 * la mention sous la ligne (ex. « Avocate »). JAMAIS de n° de Barreau / LSO.
 */
export type CabinetInvoiceSignature = {
  /** Nom reproduit en signature (ex. « Marjorie-Alexandra Derisier »). */
  name?: string;
  /** Titre/fonction affiché sous la ligne de signature (bilingue). */
  title?: { fr?: string; en?: string };
};

export type CabinetInvoiceConfig = {
  template?: CabinetInvoiceTemplate;
  notice?: CabinetInvoiceNotice;
  signature?: CabinetInvoiceSignature;
  /**
   * Couleur d'accent (hex « #rrggbb ») appliquée au bandeau, à l'en-tête de
   * tableau et à l'encadré TOTAL. UNE seule couleur stockée → la règle dure
   * « max 2 couleurs » reste garantie. Les teintes dérivées sont calculées au
   * rendu (cf. lib/invoice-template/color.ts). Défaut : marron Derisier.
   */
  accentColor?: string;
};

/**
 * Offre commerciale personnalisée à afficher sur la page Abonnement.
 *
 * Permet à SAFE de présenter à un cabinet précis une offre négociée
 * (prix mensuel, essai gratuit) sans toucher aux PLANS standards.
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
  invoice?: CabinetInvoiceConfig;
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

/**
 * Modèle de facture + bloc N.B. du cabinet, avec valeurs par défaut sûres.
 * `template` retombe sur "standard" si non défini, et `notice` sur des
 * tableaux vides (aucun bloc rendu) — rétro-compatible avec les cabinets
 * existants qui n'ont pas configuré de facture personnalisée.
 */
/** Accent par défaut (marron Derisier) si aucune couleur n'est configurée. */
export const DEFAULT_INVOICE_ACCENT = "#7A3B2E";

export function getCabinetInvoiceConfig(config: CabinetConfig): {
  template: CabinetInvoiceTemplate;
  notice: { fr: string[]; en: string[] };
  signature: { name: string; title: { fr: string; en: string } } | null;
  accentColor: string;
} {
  const inv = config.invoice ?? {};
  const sigName = inv.signature?.name?.trim();
  const accentRaw = inv.accentColor?.trim();
  // Validation hex souple ici (le garde-fou de luminance vit dans color.ts) :
  // on garde la valeur si elle ressemble à un hex, sinon défaut.
  const accentColor =
    accentRaw && /^#?[0-9a-fA-F]{6}$/.test(accentRaw)
      ? accentRaw.startsWith("#")
        ? accentRaw
        : `#${accentRaw}`
      : DEFAULT_INVOICE_ACCENT;
  return {
    template: inv.template ?? "standard",
    notice: {
      fr: inv.notice?.fr ?? [],
      en: inv.notice?.en ?? [],
    },
    signature: sigName
      ? {
          name: sigName,
          title: {
            fr: inv.signature?.title?.fr?.trim() ?? "",
            en: inv.signature?.title?.en?.trim() ?? "",
          },
        }
      : null,
    accentColor,
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
    taxNumbers:
      patch.taxNumbers !== undefined
        ? { ...current.taxNumbers, ...patch.taxNumbers }
        : current.taxNumbers,
    invoice:
      patch.invoice !== undefined
        ? {
            ...current.invoice,
            ...patch.invoice,
            notice:
              patch.invoice.notice !== undefined
                ? { ...current.invoice?.notice, ...patch.invoice.notice }
                : current.invoice?.notice,
          }
        : current.invoice,
  };
  return JSON.stringify(merged);
}
