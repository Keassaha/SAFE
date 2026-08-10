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

/* ─────────────────────── Profondeur ─────────────────────── */

/**
 * Système de profondeur SAFE, trois plans.
 * Doctrine : docs/design/SYSTEME_DE_PROFONDEUR_TROIS_PLANS.md
 *
 * Règle centrale — les surfaces structurelles (plan 1) et de contenu (plan 2)
 * restent mates. Le verre est réservé au plan 3 : ce qui flotte, recouvre du
 * contenu qui continue d'exister derrière, ou réclame momentanément l'attention.
 * L'adjacence n'est pas une superposition : une sidebar collée au canvas est mate,
 * la même en tiroir mobile prend du verre.
 *
 * Trois niveaux au maximum (PS-006c). `focus` est le plus OPAQUE des trois :
 * il porte des montants et des décisions irréversibles, la lisibilité prime
 * sur l'effet. Un seul `focus` visible à la fois (PS-006f).
 *
 * Chaque niveau expose un `opaque` : c'est le repli servi aux navigateurs sans
 * `backdrop-filter` et aux personnes qui demandent moins de transparence
 * (PS-006d). La hiérarchie tient alors sur l'ombre et le filet seuls.
 */
export const depth = {
  /** Barre supérieure collante, contrôles secondaires réellement superposés. */
  subtle: {
    surface: "rgba(251, 252, 250, 0.72)",
    opaque: "#F7F9F6",
    blur: "blur(14px) saturate(1.25)",
    line: "rgba(31, 42, 36, 0.10)",
    lip: "rgba(255, 255, 255, 0.55)",
    shadow: "none",
  },
  /** Composeur, popovers, menus, palette de commandes, tiroir mobile. */
  elevated: {
    surface: "rgba(251, 252, 250, 0.84)",
    opaque: "#FBFCFA",
    blur: "blur(24px) saturate(1.5)",
    line: "rgba(31, 42, 36, 0.13)",
    lip: "rgba(255, 255, 255, 0.70)",
    shadow: "0 18px 36px -20px rgba(11, 31, 25, 0.50)",
  },
  /** Approbation, envoi, panneau qui réclame l'attention. */
  focus: {
    surface: "rgba(252, 253, 251, 0.95)",
    opaque: "#FDFEFC",
    blur: "blur(30px) saturate(1.6)",
    line: "rgba(31, 42, 36, 0.16)",
    lip: "rgba(255, 255, 255, 0.80)",
    shadow: "0 30px 64px -28px rgba(11, 31, 25, 0.62)",
  },
  /**
   * Voile des surfaces modales. Ce n'est pas un quatrième verre : le voile
   * éteint l'arrière-plan, il ne le présente pas. Flou volontairement faible,
   * il signale l'inaccessibilité sans coûter une passe de rendu par image.
   */
  scrim: {
    surface: "rgba(11, 31, 25, 0.44)",
    blur: "blur(3px)",
  },
  /**
   * Fond atmosphérique (§5). Flouter un aplat parfaitement uni ne produit
   * aucune information : il n'y a rien à flouter. Amplitude faible, jamais
   * perceptible comme « un dégradé », couleurs de marque uniquement.
   */
  atmosphere: {
    base: "#EFF2ED",
    forest: "rgba(45, 107, 71, 0.07)",
    warm: "rgba(198, 178, 140, 0.14)",
  },
} as const;

/* ─────────────────────── Motion ─────────────────────── */

export const motion = {
  duration: {
    fast: "120ms",
    normal: "180ms",
    slow: "260ms",
    progress: "720ms",
  },
  easing: {
    DEFAULT: "cubic-bezier(0.16, 1, 0.3, 1)",
  },
} as const;

/**
 * Contrat de compatibilité de l'interface actuellement déployée.
 * Tailwind le consomme directement afin d'éviter une seconde source de jetons.
 */
export const interfaceTokens = {
  color: {
    forest: {
      50: "#F0F9F4", 100: "#DCEFE3", 200: "#C8E6D3", 300: "#A3D4B3",
      400: "#5FA87E", 500: "#5FA87E", 600: "#2D6B47", 700: "#2D6B47",
      800: "#1A2E2A", 900: "#1A2E2A",
    },
    amber: { 50: "#FEF6E7", 200: "#FAC775", 500: "#BA7517", 700: "#854F0B", 900: "#412402" },
    slate: {
      50: "#FAFAF8", 100: "#F1EFE8", 200: "#E5E3DA", 300: "#D3D1C7",
      400: "#B4B2A9", 500: "#888780", 600: "#5F5E5A", 700: "#444441",
      800: "#2C2C2A", 950: "#18181A",
    },
    semantic: {
      success: { bg: "#EAF3DE", border: "#3B6D11", text: "#173404" },
      warning: { bg: "#FAEEDA", border: "#854F0B", text: "#412402" },
      danger: { bg: "#FCEBEB", border: "#A32D2D", text: "#501313" },
      info: { bg: "#E6F1FB", border: "#185FA5", text: "#042C53" },
    },
    interface: {
      canvas: "#EFF2ED", surface: "#FBFCFA", surface2: "#E7ECE5",
      border: "#DCE0DA", borderStrong: "#C4CABE", ink: "#1F2A24",
      body: "#3A453E", muted: "#5A665F", subtle: "#7A857E",
      forest: "#0B1F19", forestSoft: "#16312A", verified: "#2E7D5B",
      amber: "#B07A1C", amberInk: "#835A10",
      /* Danger. La palette `interface` n'en avait pas, et les écrans de
       * conformité l'ont révélé en l'inventant à la main dans une trentaine
       * d'endroits. `danger` porte les fonds et les filets, `dangerInk` le
       * texte : comme pour amber, la variante foncée existe pour tenir le
       * contraste WCAG AA sur canvas et sur le tint de danger lui-même. */
      danger: "#B84A3E", dangerInk: "#8F3529",
      line: "rgba(31,42,36,0.10)", lineSubtle: "rgba(31,42,36,0.06)",
      verifiedOnForest: "#9FE3C2", verifiedDot: "#5FCF9C",
    },
  },
  fontFamily: typography.fontFamily,
  fontSize: { micro: "11px", small: "12px", body: "14px", h3: "16px", h2: "22px", h1: "32px" },
  fontWeight: typography.fontWeight,
  lineHeight: { tight: "1.1", snug: "1.3", normal: "1.4", relaxed: "1.6" },
  radius,
  shadow: {
    ...shadows,
    focus: "0 0 0 3px rgba(45, 107, 71, 0.15)",
    menu: "0 4px 12px rgba(24, 24, 26, 0.08)",
    modal: "0 16px 48px rgba(24, 24, 26, 0.16)",
    card: "0 18px 40px -32px rgba(31, 42, 36, 0.40)",
    // Ombres du système de profondeur, une par niveau de verre.
    "glass-elevated": depth.elevated.shadow,
    "glass-focus": depth.focus.shadow,
  },
  /**
   * Rayons de flou nommés d'après les trois plans. `glass` et `strong` sont
   * conservés comme alias des usages antérieurs à la migration du lot 5.
   */
  blur: {
    subtle: "14px",
    elevated: "24px",
    focus: "30px",
    glass: "24px",
    strong: "30px",
  },
  depth,
  motion,
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
