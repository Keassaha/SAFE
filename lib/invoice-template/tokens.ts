/**
 * SAFE — Design tokens partagés pour le rendu de facture.
 *
 * Source unique de vérité pour la mise en forme de la facture, utilisée par :
 *  - le composant react-pdf canonique (`InvoiceDocument.tsx`) — PDF officiel
 *  - le composant React HTML (s'il est utilisé en parallèle pour preview legacy)
 *
 * Ne contient AUCUNE logique métier — uniquement des constantes visuelles.
 */

/** Palette SAFE — alignée sur le PageHeader gradient et les chips registry. */
export const colors = {
  /** Texte principal (presque noir, lisible papier). */
  text: "#1A1A1A",
  /** Texte secondaire / labels en majuscules. */
  textMuted: "#525252",
  /** Texte très discret (mentions légales, footer). */
  textFaint: "#737373",
  /** Vert SAFE primaire pour titres et accents importants. */
  brand: "#0F2A22",
  /** Vert SAFE sombre pour le bandeau de page d'en-tête. */
  brandDark: "#0A1F18",
  /** Vert clair pour les fonds doux (en-tête table, bloc destinataire). */
  brandSoft: "#E6F2EA",
  /** Vert pour rabais (montant négatif, remise visible). */
  discount: "#047857",
  /** Vert clair fond pour ligne de rabais. */
  discountSoft: "#ECFDF5",
  /** Ambre pour frais administratifs distincts. */
  fees: "#B45309",
  /** Ambre clair fond. */
  feesSoft: "#FFFBEB",
  /** Bordures et séparateurs neutres. */
  border: "#E5E7EB",
  /** Bordure forte (séparation totaux, footer). */
  borderStrong: "#D1D5DB",
  /** Fond rangées paires de la table (zébrage). */
  rowAlt: "#F9FAFB",
  /** Blanc pur. */
  white: "#FFFFFF",
} as const;

/** Tailles typographiques en points (1pt = 1.333px web). */
export const fontSize = {
  /** Numéro de facture, total final. */
  hero: 22,
  /** Sous-totaux, montant ligne de hero (Total). */
  totalLarge: 16,
  /** En-tête de section (FACTURE, ÉMETTEUR, ADRESSÉE À). */
  sectionHeader: 9,
  /** Texte normal des lignes facture, totaux. */
  body: 10,
  /** Titres de blocs (cabinet, client). */
  blockTitle: 12,
  /** Sous-texte (heures × taux, "par X"). */
  bodySmall: 9,
  /** Mentions légales, footer. */
  footer: 8,
} as const;

/** Espacements en points. */
export const spacing = {
  pagePadding: 36,
  sectionGap: 14,
  blockPadding: 10,
  rowPadding: 8,
} as const;

/** Famille de police — Helvetica est garantie disponible dans react-pdf. */
export const font = {
  family: "Helvetica",
  bold: "Helvetica-Bold",
  oblique: "Helvetica-Oblique",
} as const;

/** Largeurs de colonnes du tableau de lignes (en %). */
export const tableColumns = {
  date: 16,
  description: 64,
  amount: 20,
} as const;

/** Mention légale standard à afficher en pied de facture (CA). */
export const legalNotices = {
  fr: {
    keepForRecords:
      "Conservez cette facture pour vos dossiers comptables et fiscaux.",
    paymentTerms: "Paiement à l'échéance par virement bancaire ou chèque.",
    interestNotice:
      "Les soldes impayés à l'échéance peuvent porter intérêt selon les conditions du mandat.",
  },
  en: {
    keepForRecords: "Keep this invoice for your accounting and tax records.",
    paymentTerms: "Payment due by bank transfer or cheque on the due date.",
    interestNotice:
      "Unpaid balances past the due date may bear interest as per the engagement terms.",
  },
} as const;

/** Mapping province → libellé taxe principale. Sert à choisir entre HST / TPS+TVQ. */
export function provinceToTaxRegime(province: string | null | undefined): "HST" | "GST_QST" | "GST_ONLY" {
  if (!province) return "HST";
  const p = province.trim().toUpperCase();
  // Provinces HST (taxe harmonisée 13-15 %).
  if (["ON", "ONTARIO", "NB", "NEW BRUNSWICK", "NS", "NOVA SCOTIA", "NL", "NEWFOUNDLAND", "PE", "PEI"].includes(p)) {
    return "HST";
  }
  // Québec : TPS + TVQ.
  if (["QC", "QUEBEC", "QUÉBEC"].includes(p)) {
    return "GST_QST";
  }
  // Autres provinces : TPS seule (la TVP provinciale n'est pas perçue par le cabinet).
  return "GST_ONLY";
}
