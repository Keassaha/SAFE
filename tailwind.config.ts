import type { Config } from "tailwindcss";
import { interfaceTokens as tokens } from "./lib/ds/tokens";
import colors from "tailwindcss/colors";

/**
 * Tailwind config — wired to the SAFE Design System (Éditorial Chaleureux).
 *
 * Key strategy (Q1=A migration totale):
 *   • Tailwind's default `emerald` palette is OVERRIDDEN to point at the
 *     brand FOREST GREEN scale. Every legacy `bg-emerald-600` /
 *     `text-emerald-700` class in the codebase therefore resolves to
 *     forest green — zero file diff across 188 files / 787 occurrences.
 *   • The custom `green` / `gold` / `primary` / `accent` namespaces still
 *     route through `--safe-green-*` CSS vars. Those vars are rebound to
 *     forest green in app/globals.css. Result: legacy code that uses
 *     `bg-green-700` or `text-primary-600` also adopts the brand.
 *   • NEW namespaces: `sand` (warm neutrals — page, sidebar, borders),
 *     `forest` (alias for brand), `warm-gold` (accent for urgent KPI
 *     chiffres). Plus `brand`, `success`, `warning`, `danger`, `info`.
 *   • Fonts: Geist Sans + Geist Mono + Instrument Serif (italic éditorial).
 *     Loaded via next/font in app/layout.tsx.
 */
const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/ds/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        /* ─── NEW: Brand (forest green) — canonical accent ─── */
        canvas: tokens.color.interface.canvas,
        surface: tokens.color.interface.surface,
        'surface-2': tokens.color.interface.surface2,
        border: tokens.color.interface.border,
        'border-strong': tokens.color.interface.borderStrong,
        'text-subtle': tokens.color.interface.subtle,
        'text-muted': tokens.color.interface.muted,
        'text-body': tokens.color.interface.body,
        'text-primary': tokens.color.interface.ink,
        
        forest: {
          DEFAULT: tokens.color.forest[700],
          ...tokens.color.forest,
          // Clés manquantes dans le token de base — alias vers les valeurs proches
          400: tokens.color.forest[500],
          600: tokens.color.forest[700],
          800: tokens.color.forest[900],
        },
        amber: {
          DEFAULT: tokens.color.amber[500],
          ...tokens.color.amber,
        },
        slate: {
          DEFAULT: tokens.color.slate[500],
          ...tokens.color.slate,
        },
        success: {
          DEFAULT: tokens.color.semantic.success.bg,
          ...tokens.color.semantic.success
        },
        warning: {
          DEFAULT: tokens.color.semantic.warning.bg,
          ...tokens.color.semantic.warning
        },
        danger: {
          DEFAULT: tokens.color.semantic.danger.bg,
          ...tokens.color.semantic.danger
        },
        info: {
          DEFAULT: tokens.color.semantic.info.bg,
          ...tokens.color.semantic.info
        },

        /* ─── REBIND: Legacy mapped properly ─── */
        emerald: {
          ...tokens.color.forest,
        },
        primary: {
          50: tokens.color.slate[50],
          100: tokens.color.slate[100],
          200: tokens.color.forest[200],
          300: tokens.color.forest[300],
          400: tokens.color.forest[500],
          500: tokens.color.forest[500],
          600: tokens.color.forest[700],
          700: tokens.color.forest[700],
          800: tokens.color.forest[900],
          900: tokens.color.forest[900],
          DEFAULT: tokens.color.forest[700],
        },
        accent: {
          50: tokens.color.forest[50],
          100: tokens.color.forest[100],
          400: tokens.color.forest[500],
          500: tokens.color.forest[700],
          600: tokens.color.forest[700],
          700: tokens.color.forest[900],
          DEFAULT: tokens.color.forest[700],
        },

        /* ─── REBUILT: Neutrals now fully zinc ─── */
        neutral: {
          // Legacy semantic tokens — all point to zinc equivalents
          surface: "var(--safe-neutral-surface)",
          border: "var(--safe-neutral-border)",
          "border-subtle": "var(--safe-neutral-100)",
          "border-strong": "var(--safe-neutral-300)",
          muted: "var(--safe-neutral-500)",
          "text-primary": "var(--safe-text-title)",
          "text-secondary": "var(--safe-text-secondary)",
          "text-inverse": "var(--safe-neutral-100)",
          page: "var(--safe-neutral-page)",
          elevated: "var(--safe-neutral-elevated)",
          100: "var(--safe-neutral-100)",
          300: "var(--safe-neutral-300)",
          500: "var(--safe-neutral-500)",
          700: "var(--safe-neutral-700)",
          900: "var(--safe-neutral-900)",
        },

        /* ─── LEGACY: Status tokens (kept, now mapped to semantic) ─── */
        status: {
          success: "var(--safe-status-success)",
          "success-bg": "var(--safe-status-success-bg)",
          warning: "var(--safe-status-warning)",
          "warning-bg": "var(--safe-status-warning-bg)",
          error: "var(--safe-status-error)",
          "error-bg": "var(--safe-status-error-bg)",
          info: "var(--safe-status-info)",
          overdue: "var(--safe-status-overdue)",
        },

        /* ─── Zinc: explicit — lets DS components write `bg-zinc-*` safely.
         * Tailwind ships zinc by default; this namespace pins our source. */
        zinc: colors.zinc,

        /* ─── Design system safe-interface (variante froide albâtre) ───
         * Namespace `si-*` ADDITIF : porté tel quel depuis le design fourni
         * (docs/propositions/safe-interface/tailwind.config.ts) sans toucher
         * aux tokens existants. Sert au socle + à la page de démonstration.
         * La bascule des écrans réels se fera ensuite, écran par écran. */
        "si-forest": { DEFAULT: tokens.color.interface.forest, soft: tokens.color.interface.forestSoft },
        "si-canvas": tokens.color.interface.canvas,
        "si-surface": tokens.color.interface.surface,
        "si-ink": tokens.color.interface.ink,
        "si-muted": tokens.color.interface.muted,
        "si-verified": tokens.color.interface.verified,
        "si-verified-on-forest": tokens.color.interface.verifiedOnForest,
        "si-verified-dot": tokens.color.interface.verifiedDot,
        "si-amber": tokens.color.interface.amber,
        /* Variante foncée pour le TEXTE amber (WCAG AA, >=4.5:1). Vérifiée sur
         * les 3 fonds documentés du DS, y compris le pire cas : le tint
         * bg-si-amber/[0.13] composé sur si-canvas (#EFF2ED) -> ~4.72:1. Le
         * #B07A1C reste réservé au fond/à la pastille (contraste non requis). */
        "si-amber-ink": tokens.color.interface.amberInk,
        /* Danger. `si-danger` pour les fonds et les filets, `si-danger-ink`
         * pour le texte : le premier ne tient pas le contraste AA sur canvas. */
        "si-danger": tokens.color.interface.danger,
        "si-danger-ink": tokens.color.interface.dangerInk,
        "si-line": tokens.color.interface.line,
        "si-line2": tokens.color.interface.lineSubtle,
      },

      fontFamily: {
        /* Duo de marque validé (CEO 2026-07-17) : Instrument Serif pour les titres
         * (jamais sous 20px, une seule graisse) + Geist pour tout le reste.
         * Pas d'autre famille ni d'alias secondaire. */
        sans: ['var(--font-geist-sans)', "system-ui", "-apple-system", "sans-serif"],
        mono: ['var(--font-geist-mono)', "ui-monospace", "monospace"],
        serif: ['var(--font-instrument-serif)', "Georgia", "ui-serif", "serif"],
        instrument: ['var(--font-instrument-serif)', "Georgia", "ui-serif", "serif"],
      },

      letterSpacing: {
        /* Small-caps section labels ("VUE SECONDAIRE", "CRÉATION DE DOCUMENT") */
        caps: "0.08em",
      },

      fontSize: {
        micro: [tokens.fontSize.micro, { lineHeight: tokens.lineHeight.normal }],
        small: [tokens.fontSize.small, { lineHeight: tokens.lineHeight.normal }],
        body: [tokens.fontSize.body, { lineHeight: tokens.lineHeight.relaxed }],
        h3: [tokens.fontSize.h3, { lineHeight: tokens.lineHeight.normal }],
        h2: [tokens.fontSize.h2, { lineHeight: tokens.lineHeight.snug }],
        h1: [tokens.fontSize.h1, { lineHeight: tokens.lineHeight.tight }],
        display: ["clamp(2.5rem, 5vw, 4rem)", { lineHeight: tokens.lineHeight.tight, letterSpacing: "-0.025em" }],
        "heading-1": ["clamp(2rem, 4vw, 3rem)", { lineHeight: tokens.lineHeight.tight, letterSpacing: "-0.025em" }],
        "heading-2": ["clamp(1.5rem, 3vw, 2.25rem)", { lineHeight: tokens.lineHeight.snug, letterSpacing: "-0.02em" }],
        "heading-3": ["clamp(1.25rem, 2vw, 1.75rem)", { lineHeight: tokens.lineHeight.snug, letterSpacing: "-0.01em" }],
        "body-sm": ["0.875rem", { lineHeight: tokens.lineHeight.relaxed }],
        caption: [tokens.fontSize.small, { lineHeight: tokens.lineHeight.normal, letterSpacing: "0.02em" }],
      },

      fontWeight: {
        normal: tokens.fontWeight.normal,
        medium: tokens.fontWeight.medium,
        semibold: tokens.fontWeight.semibold,
        bold: tokens.fontWeight.bold,
        display: tokens.fontWeight.bold,
      },

      spacing: {
        "safe-0": "0",
        "safe-1": "4px",
        "safe-2": "8px",
        "safe-3": "12px",
        "safe-4": "16px",
        "safe-5": "20px",
        "safe-6": "24px",
        "safe-8": "32px",
        "safe-10": "40px",
        "safe-12": "48px",
        "safe-16": "64px",
        "safe-20": "80px",
        "safe-24": "96px",
        sidebar: "224px",
        topbar: "56px",
      },

      borderRadius: {
        sm: tokens.radius.sm,
        DEFAULT: tokens.radius.DEFAULT,
        md: tokens.radius.DEFAULT,
        lg: tokens.radius.md,
        xl: tokens.radius.lg,
        "2xl": tokens.radius.xl,
        full: tokens.radius.full,
        /* Legacy --safe-radius-* — kept for backwards compat */
        safe: tokens.radius.DEFAULT,
        "safe-sm": tokens.radius.sm,
        "safe-md": tokens.radius.DEFAULT,
        "safe-lg": tokens.radius.md,
        "safe-xl": tokens.radius.lg,
        "safe-2xl": tokens.radius.xl,
      },

      boxShadow: {
        focus: tokens.shadow.focus,
        menu: tokens.shadow.menu,
        modal: tokens.shadow.modal,
        xs: "var(--safe-shadow-xs)",
        sm: "var(--safe-shadow-sm)",
        md: "var(--safe-shadow-md)",
        lg: "var(--safe-shadow-lg)",
        /* Ombre de carte du design safe-interface (namespace si-*) */
        "si-card": tokens.shadow.card,
        /* Système de profondeur : une ombre par niveau de verre. */
        "glass-elevated": tokens.shadow["glass-elevated"],
        "glass-focus": tokens.shadow["glass-focus"],
      },

      /**
       * Rayons de flou du système de profondeur. Préférer les classes
       * `.safe-glass-subtle|elevated|focus` de globals.css, qui portent la
       * surface, le filet et l'ombre du même niveau, ainsi que les replis
       * opaques. Ces utilitaires ne servent qu'aux cas isolés.
       */
      backdropBlur: {
        subtle: tokens.blur.subtle,
        elevated: tokens.blur.elevated,
        focus: tokens.blur.focus,
        glass: tokens.blur.glass,
        "glass-strong": tokens.blur.strong,
      },

      backgroundImage: {
        "gradient-main": "var(--safe-gradient-main)",
        "gradient-sidebar": "var(--safe-gradient-sidebar)",
      },

      transitionDuration: {
        fast: tokens.motion.duration.fast,
        normal: tokens.motion.duration.normal,
        slow: tokens.motion.duration.slow,
      },

      transitionTimingFunction: {
        safe: tokens.motion.easing.DEFAULT,
        smooth: tokens.motion.easing.DEFAULT,
        "ds-out": tokens.motion.easing.DEFAULT,
        "ds-in": tokens.motion.easing.DEFAULT,
      },

      keyframes: {
        "fade-in": { "0%": { opacity: "0" }, "100%": { opacity: "1" } },
        "page-enter": {
          "0%": { opacity: "0", transform: "translateY(4px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "slide-up": { "0%": { opacity: "0", transform: "translateY(8px)" }, "100%": { opacity: "1", transform: "translateY(0)" } },
        blob: { "0%, 100%": { transform: "translate(0, 0) scale(1)" }, "25%": { transform: "translate(10px, -20px) scale(1.05)" }, "50%": { transform: "translate(-10px, 10px) scale(0.95)" }, "75%": { transform: "translate(20px, 20px) scale(1.02)" } },
        shimmer: { "0%": { transform: "translateX(-100%)" }, "100%": { transform: "translateX(100%)" } },
        "mobile-drawer-in": { "0%": { transform: "translateX(-100%)" }, "100%": { transform: "translateX(0)" } },
      },

      animation: {
        spin: `spin ${tokens.motion.duration.progress} linear infinite`,
        "mobile-drawer-in": "mobile-drawer-in 0.2s ease-out forwards",
        "fade-in": "fade-in 0.25s ease-out",
        "page-enter": "page-enter 0.35s cubic-bezier(0.4, 0, 0.2, 1) forwards",
        "slide-up": "slide-up 0.3s ease-out",
        blob: "blob 20s ease-in-out infinite",
        shimmer: "shimmer 2s ease-in-out infinite",
      },

      animationDelay: {
        "2000": "2s",
        "4000": "4s",
      },
    },
  },
  plugins: [],
};

export default config;
