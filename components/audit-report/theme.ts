export const PALETTE = {
  ink:      "#0B1F19",
  forest:   "#102A21",
  forest2:  "#163B2E",
  moss:     "#587567",
  moss2:    "#7A958A",
  sage:     "#A9C2B2",
  sage200:  "#C9DBCF",
  sage100:  "#E2ECE4",
  sage50:   "#EEF4EF",
  gold:     "#A9772A",
  goldSoft: "#C79A4E",
  goldDark: "#DCB36A",
  clay:     "#9B4A2D",
  line:     "rgba(11,31,25,.13)",
  lineSoft: "rgba(11,31,25,.07)",
} as const;

export const VARIANTS = {
  cream: {
    pageBg:   "#F4EEE1",
    card:     "#FBF6EC",
    cardDeep: "#EBE2CF",
    shadow:   "none",
    haloGreenOpacity: ".16",
    haloGoldOpacity:  ".13",
  },
  white: {
    pageBg:   "transparent",
    pageGradient: "linear-gradient(157deg,#FFFFFF 0%,#FDFCFA 56%,#F7F2E9 100%)",
    card:     "#FFFFFF",
    cardDeep: "#F2EEE6",
    shadow:   "0 1px 2px rgba(11,31,25,.04), 0 10px 26px rgba(11,31,25,.055)",
    haloGreenOpacity: ".12",
    haloGoldOpacity:  ".10",
  },
} as const;

export type RiskLevel = "Critique" | "Élevé" | "Modéré" | "Faible";

export const RISK_COLORS: Record<RiskLevel, { bg: string; text: string; dot: string }> = {
  "Critique": { bg: "#F7E2DF", text: "#7A1F1F", dot: "#9B4A2D" },
  "Élevé":    { bg: "#FBE8D9", text: "#7A3A14", dot: "#A94A14" },
  "Modéré":   { bg: "#F7EED7", text: "#6B5010", dot: "#A9772A" },
  "Faible":   { bg: "#E8F0EA", text: "#1F3A2E", dot: "#587567" },
};

export const SCORE_COLORS: Record<string, { text: string; arc: string }> = {
  "Profil sain":      { text: "#163B2E", arc: "#587567" },
  "Profil attentif":  { text: "#163B2E", arc: "#A9772A" },
  "À corriger":       { text: "#6B5010", arc: "#C79A4E" },
  "À sécuriser":      { text: "#7A1F1F", arc: "#9B4A2D" },
};
