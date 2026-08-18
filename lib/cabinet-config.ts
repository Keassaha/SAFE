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
 * Gabarit par défaut du courriel qui accompagne l'envoi d'une facture.
 * Sauvegardé une fois au niveau du cabinet, réutilisé à chaque envoi et
 * toujours modifiable dans la modale juste avant d'envoyer. Les champs
 * acceptent des variables : {{client}}, {{numero_facture}}, {{cabinet}},
 * {{echeance}} (substituées au moment de l'envoi).
 */
export type EmailFactureConfig = {
  /** Objet du courriel (ex. « Facture {{numero_facture}} — {{cabinet}} »). */
  objet?: string;
  /** Corps du message d'accompagnement (texte brut, sauts de ligne conservés). */
  message?: string;
  /** Instructions de paiement affichées dans l'encadré du courriel. */
  instructionsPaiement?: string;
};

/**
 * Part d'usage d'affaires d'un véhicule, pour un exercice.
 *
 * Spec : SPEC_DEPENSES_ET_PREPARATION_FISCALE.md §6, arbitrage CEO n° 1.
 *
 * PAR ANNÉE, ET NON UNE VALEUR UNIQUE
 *
 * L'usage d'affaires varie d'un exercice à l'autre. Appliquer le prorata de cette
 * année aux dépenses de l'an dernier produirait une déduction fausse sur un
 * exercice déjà déclaré.
 *
 * SAISI, DONC PLUS FAIBLE QU'UN REGISTRE
 *
 * L'ARC attend un registre kilométrique : date, destination, motif, kilomètres,
 * relevés d'odomètre. Un prorata déclaré se défend moins bien. La faiblesse est
 * assumée par décision CEO, et le dossier de fin d'année la classe en zone
 * d'incertitude. `saisiLe` existe pour qu'on puisse dire QUAND la valeur a été
 * affirmée, ce qui est le minimum défendable.
 */
export type ProrataVehiculeAnnee = {
  /** Exercice visé. */
  annee: number;
  /** Part d'usage d'affaires, de 0 à 1. */
  prorata: number;
  /** Date de saisie, `YYYY-MM-DD`. */
  saisiLe: string;
  /** Qui l'a affirmée. */
  saisiPar?: string;
};

export type CabinetConfig = {
  devise?: string;
  tauxInteret?: number;
  formatFacture?: string;
  /** Province du cabinet (ex. "QC", "ON") — pilote la réglementation citée. */
  province?: string;
  envoiFactureClient?: EnvoiFactureClientConfig;
  emailFacture?: EmailFactureConfig;
  taxNumbers?: CabinetTaxNumbers;
  invoice?: CabinetInvoiceConfig;
  /** Prorata d'usage du véhicule, un par exercice. Voir `ProrataVehiculeAnnee`. */
  prorataVehicule?: ProrataVehiculeAnnee[];
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

export function getEmailFactureConfig(config: CabinetConfig): EmailFactureConfig {
  return config.emailFacture ?? {};
}

/**
 * Substitue les variables d'un gabarit d'email de facture par leurs valeurs.
 * Tolérante aux alias courants ({{numero}} == {{numero_facture}}) et insensible
 * aux espaces internes ({{ client }} fonctionne aussi). Une variable inconnue
 * est laissée telle quelle (l'utilisateur voit tout de suite sa coquille).
 */
export function applyInvoiceEmailVariables(
  template: string,
  vars: { client?: string; numeroFacture?: string; cabinet?: string; echeance?: string },
): string {
  const table: Record<string, string> = {
    client: vars.client ?? "",
    numero: vars.numeroFacture ?? "",
    numero_facture: vars.numeroFacture ?? "",
    cabinet: vars.cabinet ?? "",
    echeance: vars.echeance ?? "",
  };
  return template.replace(/\{\{\s*([a-z_]+)\s*\}\}/gi, (match, key: string) => {
    const normalized = key.toLowerCase();
    return normalized in table ? table[normalized] : match;
  });
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
    emailFacture:
      patch.emailFacture !== undefined
        ? { ...current.emailFacture, ...patch.emailFacture }
        : current.emailFacture,
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

/**
 * Prorata véhicule d'un exercice donné.
 *
 * Ne retombe JAMAIS sur une autre année. Un prorata absent est une INCERTITUDE que
 * le dossier de fin d'année doit déclarer, pas un trou à combler avec la valeur
 * voisine : déduire 2025 avec le chiffre de 2026 serait une affirmation que rien ne
 * soutient.
 */
export function getProrataVehicule(
  config: CabinetConfig,
  annee: number,
): ProrataVehiculeAnnee | null {
  const entree = (config.prorataVehicule ?? []).find((p) => p.annee === annee);
  if (!entree) return null;
  // Une valeur hors bornes est refusée plutôt que corrigée en silence : mieux vaut
  // une incertitude déclarée qu'une déduction fabriquée par un clamp.
  // `Number.isFinite` et non `typeof === "number"` : NaN est un nombre, et il
  // franchit `< 0` comme `> 1` puisque toute comparaison avec NaN est fausse. Il se
  // propagerait ensuite dans chaque montant de taxe du dossier de fin d'année.
  if (!Number.isFinite(entree.prorata) || entree.prorata < 0 || entree.prorata > 1) {
    return null;
  }
  return entree;
}

/** Remplace le prorata d'un exercice, en conservant les autres années. */
export function setProrataVehicule(
  config: CabinetConfig,
  entree: ProrataVehiculeAnnee,
): CabinetConfig {
  const autres = (config.prorataVehicule ?? []).filter((p) => p.annee !== entree.annee);
  return {
    ...config,
    prorataVehicule: [...autres, entree].sort((a, b) => b.annee - a.annee),
  };
}
