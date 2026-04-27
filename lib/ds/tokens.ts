/**
 * SAFE Design System — Éditorial Chaleureux
 * --------------------------------------------------------------
 * Single source of truth for design tokens.
 * Consumed by:
 *   - tailwind.config.ts (web)
 *   - app/globals.css variables
 *   - (future) React Native / Expo via `native` export
 *
 * Direction: warm ivory canvas + deep forest green accent +
 * editorial italic serif for section subtitles. Black inverse
 * reserved for urgent/critical surfaces (CTAs primaires, cards
 * Urgent, etc.). Soft muted pills for statuses.
 */

/* ─────────────────────────── Colors ─────────────────────────── */

/**
 * Sand scale — warm neutrals. Page canvas, sidebar, borders.
 * Replaces pure zinc in the previous Minimal Monochrome draft.
 */
export const sand = {
  50:  "#FCFAF4", // crème très léger (cards, hover)
  100: "#F7F2E8", // ivoire chaud (page bg)
  200: "#EDE5D4", // sable très pâle (borders subtle)
  300: "#E8DCC4", // sable (sidebar bg — 1 ton plus foncé que page)
  400: "#D4C8B0", // taupe clair (borders strong, séparateurs)
  500: "#B8AB91", // taupe moyen
  600: "#8B8680", // taupe doux (text muted)
  700: "#5C5852", // charbon chaud (text secondary alt)
  800: "#3D3A36",
  900: "#1F1D1A",
} as const;

/**
 * Zinc scale — kept for neutral-text on warm surfaces (text primary
 * uses ink black, secondary = charbon, muted = taupe). Also backs
 * black inverse surfaces (TPS card, Employé virtuel card, CTAs).
 */
export const zinc = {
  50:  "#FAFAFA",
  100: "#F4F4F5",
  200: "#E4E4E7",
  300: "#D4D4D8",
  400: "#A1A1AA",
  500: "#71717A",
  600: "#52525B",
  700: "#3F3F46",
  800: "#27272A",
  900: "#18181B",
  950: "#0B0B0C", // encre (text primary + inverse surfaces)
} as const;

/**
 * Brand forest green scale — deep sage/pine.
 * `brand.800` (#1F3A2E) is the canonical accent. This scale also
 * overrides Tailwind's default `emerald` palette via the rebind
 * trick in tailwind.config.ts, so every legacy `bg-emerald-600` /
 * `text-green-700` class in the codebase automatically adopts
 * forest green — no find-and-replace needed.
 */
export const brand = {
  50:  "#EEF5F0",
  100: "#D4E8D9",
  200: "#B8D6C0",
  300: "#8EB69B", // sage
  400: "#5A8F7B",
  500: "#3D6B5A",
  600: "#2B4A3E",
  700: "#234539",
  800: "#1F3A2E", // ← canonical brand (forest deep)
  900: "#162B20",
  950: "#0E2419",
} as const;

/**
 * Warm gold — used sparingly (numbers on black cards like "6 229 $"
 * TPS urgent). NOT a general accent.
 */
export const goldWarm = {
  50:  "#FEF6E3",
  100: "#FCE8B6",
  300: "#F5C96B",
  500: "#F4A045", // canonical warm gold
  600: "#D88128",
  700: "#A8611C",
} as const;

/**
 * Semantic colors — ONLY use for meaning (never decorative).
 * Each status also has a soft "pill" pairing (bg + text).
 */
export const semantic = {
  success: {
    // Encaissé / Payée / Réconcilié
    50:  "#EEF5F0",
    100: "#D4E8D9",
    500: "#3D6B5A",
    600: "#2B4A3E",
    700: "#1F3A2E",
    pillBg: "#D4E8D9",
    pillText: "#1F3A2E",
  },
  warning: {
    // En attente / Dû bientôt
    50:  "#FDF7E4",
    100: "#F5E6C8",
    500: "#C89830",
    600: "#A37A20",
    700: "#8B6B1F",
    pillBg: "#F5E6C8",
    pillText: "#8B6B1F",
  },
  danger: {
    // Retard / Erreur / Urgent
    50:  "#FBEAE5",
    100: "#F3D8D2",
    500: "#B8543A",
    600: "#9F442E",
    700: "#8A3A2D",
    pillBg: "#F3D8D2",
    pillText: "#8A3A2D",
  },
  info: {
    // Fidéi. / En cours
    50:  "#EEECF2",
    100: "#E0DDE8",
    500: "#6A6486",
    600: "#56506E",
    700: "#4A4561",
    pillBg: "#E0DDE8",
    pillText: "#4A4561",
  },
} as const;

/* ─────────────────────── Typography ─────────────────────── */

export const typography = {
  fontFamily: {
    // UI + body + KPI numbers
    sans: ["var(--font-geist-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
    // Tabular numbers (refs, N° factures, dates)
    mono: ["var(--font-geist-mono)", "ui-monospace", "SFMono-Regular", "monospace"],
    // Editorial italic subtitles: "— registre en temps réel",
    //                             "— composition éditoriale"
    serif: ["var(--font-instrument-serif)", "Georgia", "ui-serif", "serif"],
  },
  fontSize: {
    xs:    ["0.75rem",  { lineHeight: "1rem" }],
    sm:    ["0.8125rem",{ lineHeight: "1.25rem" }],
    base:  ["0.875rem", { lineHeight: "1.375rem" }],
    md:    ["0.9375rem",{ lineHeight: "1.5rem" }],
    lg:    ["1rem",     { lineHeight: "1.5rem" }],
    xl:    ["1.125rem", { lineHeight: "1.625rem" }],
    "2xl": ["1.375rem", { lineHeight: "1.75rem",  letterSpacing: "-0.015em" }],
    "3xl": ["1.75rem",  { lineHeight: "2rem",     letterSpacing: "-0.02em"  }],
    "4xl": ["2.25rem",  { lineHeight: "2.5rem",   letterSpacing: "-0.025em" }],
    "5xl": ["3rem",     { lineHeight: "3.25rem",  letterSpacing: "-0.03em"  }],
  },
  fontWeight: {
    normal: "400",
    medium: "500",
    semibold: "600",
    bold: "700",
  },
  letterSpacing: {
    tight: "-0.02em",
    normal: "0",
    wide: "0.02em",
    // Small caps section labels ("VUE SECONDAIRE", "CRÉATION DE DOCUMENT")
    caps: "0.08em",
  },
} as const;

/* ─────────────────────── Spacing & radius ─────────────────────── */

export const radius = {
  none: "0",
  sm: "4px",
  DEFAULT: "6px",  // rounded-md — buttons, inputs
  md: "8px",       // rounded-lg
  lg: "12px",      // rounded-xl — cards
  xl: "16px",      // rounded-2xl — elevated cards
  full: "9999px",
} as const;

export const shadows = {
  // Éditorial: near-invisible, borders do the work
  none: "none",
  xs: "0 1px 0 0 rgba(11, 11, 12, 0.03)",
  sm: "0 1px 2px 0 rgba(11, 11, 12, 0.04)",
  md: "0 2px 4px -1px rgba(11, 11, 12, 0.05), 0 1px 2px -1px rgba(11, 11, 12, 0.03)",
  lg: "0 8px 16px -4px rgba(11, 11, 12, 0.06), 0 4px 6px -2px rgba(11, 11, 12, 0.03)",
  xl: "0 16px 32px -8px rgba(11, 11, 12, 0.08), 0 8px 12px -4px rgba(11, 11, 12, 0.04)",
} as const;

/* ─────────────────────── Motion ─────────────────────── */

export const motion = {
  duration: {
    fast: "120ms",
    normal: "180ms",
    slow: "260ms",
  },
  easing: {
    DEFAULT: "cubic-bezier(0.16, 1, 0.3, 1)",
    out: "cubic-bezier(0.33, 1, 0.68, 1)",
    in: "cubic-bezier(0.32, 0, 0.67, 0)",
  },
} as const;

/* ─────────────────────── Semantic tokens ─────────────────────── */
/**
 * Pre-composed tokens — what components reach for, not raw hex.
 */
export const tokens = {
  surface: {
    page: sand[100],            // #F7F2E8 — ivoire chaud (page canvas)
    card: sand[50],             // #FCFAF4 — crème très léger (cards)
    "card-alt": "#FFFFFF",      // blanc pur (cards transactions, élévées)
    sidebar: sand[300],         // #E8DCC4 — sable foncé (sidebar)
    "sidebar-hover": sand[50],  // #FCFAF4 — crème léger (hover sidebar)
    "sidebar-active": "#FFFFFF",// blanc pur (active nav item)
    subtle: sand[200],          // #EDE5D4 — alt rows, sections
    inverse: zinc[950],         // #0B0B0C — cards urgentes, CTAs primaires
    "inverse-subtle": zinc[900],
  },
  text: {
    primary: zinc[950],         // #0B0B0C — encre
    secondary: sand[700],       // #5C5852 — charbon chaud
    muted: sand[600],           // #8B8680 — taupe doux
    inverse: sand[100],         // #F7F2E8 — ivoire sur fond noir
    "inverse-muted": sand[500], // #B8AB91 — taupe clair sur noir
    brand: brand[800],          // #1F3A2E — vert forêt (liens actifs, counts)
    warmGold: goldWarm[500],    // #F4A045 — "6 229 $" sur card TPS noire
  },
  border: {
    subtle: sand[200],          // #EDE5D4 — très pâle
    DEFAULT: sand[300],         // #E8DCC4 — sable
    strong: sand[400],          // #D4C8B0 — taupe clair
    inverse: zinc[800],         // #27272A — sur fond noir
  },
  brand: {
    DEFAULT: brand[800],        // #1F3A2E — forest deep
    hover: brand[900],          // #162B20
    subtle: brand[100],         // #D4E8D9 — fond de badge
    "subtle-hover": brand[200], // #B8D6C0
    text: brand[800],
    "text-on-brand": "#FFFFFF",
  },
} as const;

/* ─────────────────────── Native export (future RN) ─────────────────────── */

export const native = {
  colors: {
    ...Object.fromEntries(
      Object.entries(sand).map(([k, v]) => [`sand-${k}`, v])
    ),
    ...Object.fromEntries(
      Object.entries(zinc).map(([k, v]) => [`zinc-${k}`, v])
    ),
    ...Object.fromEntries(
      Object.entries(brand).map(([k, v]) => [`brand-${k}`, v])
    ),
    brand: brand[800],
    page: sand[100],
    sidebar: sand[300],
    ink: zinc[950],
    success: semantic.success[700],
    warning: semantic.warning[700],
    danger: semantic.danger[700],
    info: semantic.info[700],
    warmGold: goldWarm[500],
  },
  fontFamily: {
    sans: "Geist",
    mono: "GeistMono",
    serif: "InstrumentSerif",
  },
  radius: {
    none: 0,
    sm: 4,
    md: 6,
    lg: 8,
    xl: 12,
    "2xl": 16,
    full: 9999,
  },
  spacing: {
    0: 0, 1: 4, 2: 8, 3: 12, 4: 16, 5: 20, 6: 24,
    8: 32, 10: 40, 12: 48, 16: 64, 20: 80, 24: 96,
  },
} as const;

/* ─────────────────────── Root default export ─────────────────────── */

const ds = {
  sand,
  zinc,
  brand,
  goldWarm,
  semantic,
  typography,
  radius,
  shadows,
  motion,
  tokens,
  native,
} as const;

export default ds;
export type DS = typeof ds;
