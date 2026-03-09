/**
 * Constantes — Générateur de documents droit familial québécois
 * Conformité Barreau du Québec (IA générative, oct. 2024), Loi 25, disclaimer.
 */

export const JURISDICTION = "Quebec, Canada – Civil law (droit civil québécois)";

export const APPLICABLE_LAW_REFS = [
  "CCQ (Code civil du Québec)",
  "CPC (Code de procédure civile)",
  "Divorce Act (fédéral)",
  "RCSMF (Règlement de la Cour supérieure en matière familiale)",
  "Loi sur le Tribunal unifié de la famille (TUF)",
] as const;

/** Disclaimer obligatoire sur tout document généré avec IA (Barreau, bonnes pratiques). */
export const AI_DISCLAIMER_FR =
  "Ce document a été préparé avec l'assistance d'outils d'intelligence artificielle et doit être révisé par un professionnel du droit avant toute utilisation.";

export const AI_DISCLAIMER_EN =
  "This document was prepared with the assistance of artificial intelligence tools and must be reviewed by a legal professional before any use.";

/** Préfixe d'en-tête standard des documents judiciaires Québec (Cour supérieure, Chambre de la famille). */
export const QUEBEC_COURT_HEADER_TEMPLATE =
  "CANADA / PROVINCE DE QUÉBEC / COUR SUPÉRIEURE / Chambre de la famille / District de {{DISTRICT}} / N° : {{FILE_NUMBER}}";

/** Déduction de base pour le calcul du revenu disponible (pensions alimentaires) — mise à jour annuelle. */
export const SUPPORT_BASIC_DEDUCTION_2025 = 13_575;
