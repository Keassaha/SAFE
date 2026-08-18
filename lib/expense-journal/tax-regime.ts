/**
 * SAFE — Régime de taxe par catégorie de dépense.
 *
 * Recherche : docs/research/RECHERCHE_categories_sans_taxe_2026-08-18.md
 * Spec      : docs/accounting/SPEC_DEPENSES_ET_PREPARATION_FISCALE.md, lot 0 bis
 *
 * POURQUOI CE FICHIER EXISTE
 *
 * Le lot 1 décomposera le montant TTC d'une dépense pour en extraire la taxe
 * récupérable. Sans la liste ci-dessous, il fabriquerait de la taxe là où il n'y en a
 * pas : sur un salaire, sur une prime d'assurance, sur des frais bancaires. La
 * conséquence n'est pas un affichage faux, c'est une demande de remboursement de
 * taxes surestimée, qui se découvre à la vérification.
 *
 * UNE RÈGLE, PAS UN TAUX À ZÉRO
 *
 * Un taux à zéro est une valeur : modifiable, donc modifiée un jour par inadvertance,
 * et muette sur la raison. Un régime est une règle : il refuse l'estimation ET porte
 * son motif à l'écran. C'est la même logique que la liste fermée de motifs
 * d'annulation livrée le 2026-08-17.
 */

/** Ce que le moteur d'estimation a le droit de faire sur une catégorie. */
export type TaxRegime =
  /** Régime général : la taxe se décompose du TTC. */
  | "TAXABLE"
  /** Aucune taxe possible. L'estimation ET la saisie manuelle sont refusées. */
  | "SANS_TAXE_DUR"
  /** Aucune taxe estimée, mais une taxe lue sur la pièce reste saisissable. */
  | "SANS_TAXE_SOUPLE"
  /** La taxe de cet objet se règle dans un autre module. */
  | "HORS_PERIMETRE";

export interface TaxRegimeRule {
  regime: TaxRegime;
  /** Phrase montrée au cabinet quand l'estimation est refusée. Jamais un code. */
  motif: string;
  /** D'où vient la règle, et quand elle a été vérifiée. */
  source: string;
  verifieLe: string;
  /**
   * `true` quand la classification repose sur une inférence non confirmée. Ces
   * catégories restent TAXABLE par prudence : un cabinet qui réclame trop peu de
   * crédits se corrige, un cabinet qui en réclame trop se fait reprendre.
   */
  incertain?: boolean;
}

const LTA_123 = "Loi sur la taxe d'accise, art. 123(1)";
const ARC_TYPE = "ARC, Type of supply (fournitures exonérées)";

/**
 * Régime par code de catégorie. Toute catégorie absente suit le régime général,
 * voir `regimeFor`.
 */
export const TAX_REGIME_BY_CATEGORY: Readonly<Record<string, TaxRegimeRule>> = {
  // L'emploi n'est pas une fourniture : ce n'est même pas une exonération, c'est une
  // absence de champ. La définition d'« entreprise » exclut « an office or employment ».
  SALAIRES: {
    regime: "SANS_TAXE_DUR",
    motif: "Un salaire ne porte jamais de TPS, TVH ni TVQ : l'emploi n'est pas une fourniture taxable.",
    source: LTA_123,
    verifieLe: "2026-08-18",
  },

  // Exonéré. Attention : au Québec une taxe sur les primes d'assurance existe, elle
  // est un COÛT et jamais un crédit. D'où le régime dur : accepter une saisie ici
  // ferait entrer une taxe non récupérable dans les récupérables.
  ASSURANCES: {
    regime: "SANS_TAXE_DUR",
    motif:
      "L'émission d'une police d'assurance est exonérée. La taxe sur les primes, elle, est un coût et ne se récupère pas.",
    source: ARC_TYPE,
    verifieLe: "2026-08-18",
  },

  // « MOST services provided by financial institutions ». Le mot « most » interdit une
  // règle dure : une location de coffret ou un service administratif bancaire est
  // taxable. On refuse l'estimation, on laisse la pièce parler.
  FRAIS_BANCAIRES: {
    regime: "SANS_TAXE_SOUPLE",
    motif:
      "Les services financiers sont exonérés. Si votre relevé montre tout de même une taxe, saisissez-la : certains frais bancaires en portent.",
    source: ARC_TYPE,
    verifieLe: "2026-08-18",
  },

  // Une somme avancée pour le client, refacturée ensuite. L'estimer ici la compterait
  // deux fois : une fois en dépense du cabinet, une fois en débours refacturé.
  DEBOURS_AVANCES: {
    regime: "HORS_PERIMETRE",
    motif:
      "Un débours avancé se règle dans le module débours du dossier, avec sa propre taxe. Rien à décomposer ici.",
    source: "Spec dépenses §1, frontière inchangée",
    verifieLe: "2026-08-18",
  },

  // ── Zones d'incertitude ──────────────────────────────────────────────────────
  // L'ARC n'exonère que « CERTAIN property and services provided by governments ».
  // Le mot interdit de conclure. Ces trois restent taxables par prudence, marquées
  // incertaines, et attendent la verification de l'annexe V partie VI de la LTA.
  TRIBUNAL: {
    regime: "TAXABLE",
    motif: "Régime général, sous réserve : seuls « certains » services gouvernementaux sont exonérés.",
    source: ARC_TYPE,
    verifieLe: "2026-08-18",
    incertain: true,
  },
  REGISTRE_FONCIER: {
    regime: "TAXABLE",
    motif: "Régime général, sous réserve : droits d'inscription non vérifiés.",
    source: ARC_TYPE,
    verifieLe: "2026-08-18",
    incertain: true,
  },
  HUISSIER: {
    regime: "TAXABLE",
    motif: "Régime général, sous réserve : statut de l'officier public non vérifié.",
    source: ARC_TYPE,
    verifieLe: "2026-08-18",
    incertain: true,
  },
};

/** Régime général, appliqué à toute catégorie non listée. */
export const DEFAULT_TAX_REGIME: TaxRegimeRule = {
  regime: "TAXABLE",
  motif: "Régime général : la taxe se décompose du montant payé.",
  source: ARC_TYPE,
  verifieLe: "2026-08-18",
};

/** Régime applicable à un code de catégorie. Jamais `undefined`. */
export function regimeFor(code: string | null | undefined): TaxRegimeRule {
  if (!code) return DEFAULT_TAX_REGIME;
  return TAX_REGIME_BY_CATEGORY[code] ?? DEFAULT_TAX_REGIME;
}

/** Le moteur du lot 1 a-t-il le droit d'ESTIMER une taxe sur cette catégorie ? */
export function peutEstimerTaxe(code: string | null | undefined): boolean {
  return regimeFor(code).regime === "TAXABLE";
}

/** Le cabinet a-t-il le droit de SAISIR une taxe lue sur la pièce ? */
export function peutSaisirTaxe(code: string | null | undefined): boolean {
  const { regime } = regimeFor(code);
  return regime === "TAXABLE" || regime === "SANS_TAXE_SOUPLE";
}
