/* Rapport d'audit SAFE — système à deux couleurs.
 *
 * Décision CEO 2026-07-28 : le document n'utilise que deux couleurs.
 *   1. Vert forêt  #163B2E — texte, filets, aplats. Toutes ses nuances sont
 *      obtenues par opacité sur le papier, jamais par une nouvelle teinte.
 *   2. Or          #A9772A — réservé à ce qui porte une décision : montants
 *      récupérables, tarif, jauge de gravité. Rien d'autre.
 *
 * Le papier et les filets sont des neutres dérivés du vert, donc pas des
 * couleurs supplémentaires. Aucun rouge, aucun terracotta, aucun ambre pâle.
 */

const FOREST_RGB = "22, 59, 46";

const forestAlpha = (a: number) => `rgba(${FOREST_RGB}, ${a})`;

export const PALETTE = {
  /* ── Couleur 1 : vert forêt ────────────────────────────────────── */
  forest: "#163B2E",
  forestDeep: "#102A21",

  ink: "#12281F",            // titres et valeurs
  inkBody: forestAlpha(0.78), // texte courant
  inkMuted: forestAlpha(0.62), // libellés, entêtes de colonnes
  inkFaint: forestAlpha(0.5),  // pagination, sources

  onForest: "#EDF2EE",             // texte sur aplat vert
  onForestMuted: "rgba(237, 242, 238, 0.68)",
  onForestFaint: "rgba(237, 242, 238, 0.45)",

  /* ── Couleur 2 : or ────────────────────────────────────────────── */
  gold: "#A9772A",
  goldOnForest: "#D9AF63",

  /* ── Neutres dérivés (papier, fonds, filets) ───────────────────── */
  paper: "#FFFFFF",
  fill: forestAlpha(0.04),
  fillStrong: forestAlpha(0.08),
  line: forestAlpha(0.16),
  lineSoft: forestAlpha(0.09),
  lineOnForest: "rgba(237, 242, 238, 0.18)",
} as const;

export const VARIANTS = {
  cream: {
    pageBg: "#F6F3EC",
    card: forestAlpha(0.035),
    shadow: "none",
  },
  white: {
    pageBg: "#FFFFFF",
    card: forestAlpha(0.035),
    shadow: "none",
  },
} as const;

export type RiskLevel = "Critique" | "Élevé" | "Modéré" | "Faible";

/* Gravité : plus de couleur de sévérité. L'ordre de lecture, le libellé écrit
 * et une jauge à quatre crans portent l'information. Le rang sert au tri. */
export const RISK_RANK: Record<RiskLevel, number> = {
  "Critique": 4,
  "Élevé": 3,
  "Modéré": 2,
  "Faible": 1,
};
