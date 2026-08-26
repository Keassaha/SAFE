import type { Config } from "tailwindcss";
import { interfaceTokens as tokens } from "./lib/ds/tokens";
import { ECHELLE_ACTION, ECHELLE_VALIDE } from "./lib/ds/palettes";
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
/**
 * Couleur pilotée par variable CSS.
 *
 * Les jetons `si-*` ne portent plus de valeur littérale : ils lisent
 * `--si-<clé>-rgb`, émis par <PaletteStyles /> depuis `lib/ds/palettes.ts`.
 * Changer `data-palette` sur <html> rebascule donc l'application entière.
 *
 * La forme fonction est nécessaire pour que les 825 modificateurs d'opacité
 * déjà écrits dans les écrans (`bg-si-verified/10`, `text-si-muted/50`)
 * continuent de composer correctement.
 */
type FonctionCouleur = { opacityValue?: string; opacityVariable?: string };

/**
 * Tailwind accepte les couleurs-fonctions à l'exécution, mais ses types ne
 * décrivent que `string | RecursiveKeyValuePair`. Le cast est le prix d'entrée
 * documenté du procédé, il est confiné à ces deux fabriques.
 */
const commeCouleur = (fn: (arg: FonctionCouleur) => string) => fn as unknown as string;

const siColor = (cle: string) =>
  commeCouleur(({ opacityValue }) =>
    opacityValue === undefined
      ? `rgb(var(--si-${cle}-rgb))`
      : `rgb(var(--si-${cle}-rgb) / ${opacityValue})`,
  );

/**
 * Filets : une encre + une opacité par défaut, pas une couleur à part.
 * Sans modificateur, la classe rend l'opacité de la palette (`--si-line-a`).
 * Avec modificateur (`border-si-line/60`), c'est le modificateur qui gagne —
 * exactement le comportement de la valeur `rgba()` littérale qu'ils
 * remplacent.
 */
const siLine = (variableAlpha: string) =>
  commeCouleur(({ opacityValue, opacityVariable }) =>
    opacityValue === undefined || opacityVariable !== undefined
      ? `rgb(var(--si-line-ink-rgb) / var(${variableAlpha}))`
      : `rgb(var(--si-line-ink-rgb) / ${opacityValue})`,
  );

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
        /* ─── NEW: Brand (forest green) — canonical accent ───
         * Mêmes variables que le namespace `si-*` : ces alias suivent donc la
         * palette active au lieu de rester figés sur une valeur littérale. */
        canvas: siColor("canvas"),
        surface: siColor("surface"),
        'surface-2': siColor("surface2"),
        border: siColor("border"),
        'border-strong': siColor("border-strong"),
        'text-subtle': siColor("subtle"),
        'text-muted': siColor("muted"),
        'text-body': siColor("body"),
        'text-primary': siColor("ink"),

        /* Vocabulaires en retrait. Ils ne décrivent plus une teinte, ils
         * pointent vers la rampe qui porte leur rôle. Voir les commentaires
         * de `ECHELLE_ACTION` dans lib/ds/palettes.ts. */
        forest: {
          DEFAULT: ECHELLE_ACTION[700],
          ...ECHELLE_ACTION,
        },
        amber: {
          DEFAULT: tokens.color.amber[500],
          ...tokens.color.amber,
        },
        /* `slate` servait des neutres CHAUDS (#FAFAF8, #F1EFE8) sous une
         * interface froide : c'est ce qui faisait tirer certaines pages vers
         * l'ivoire. Il rejoint la rampe froide. */
        slate: { DEFAULT: ECHELLE_ACTION[500], ...ECHELLE_ACTION },
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

        /* ─── Vocabulaires en retrait ───
         *
         * `emerald` et `green` gardent une teinte : ils portent le plus souvent
         * un sens (bandeau de succès, montant rapproché), qu'un achromatique
         * effacerait. Ils convergent vers le seul vert du système, celui de la
         * validation.
         *
         * `green` n'était pas déclaré du tout : ses 118 usages retombaient sur
         * le vert vif par défaut de Tailwind, étranger à la palette.
         *
         * `primary` et `accent` désignent l'action : ils suivent la rampe froide. */
        emerald: { DEFAULT: ECHELLE_VALIDE[500], ...ECHELLE_VALIDE },
        green: { DEFAULT: ECHELLE_VALIDE[500], ...ECHELLE_VALIDE },
        primary: { DEFAULT: ECHELLE_ACTION[700], ...ECHELLE_ACTION },
        accent: { DEFAULT: ECHELLE_ACTION[700], ...ECHELLE_ACTION },

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

        /* `zinc` restait la famille par défaut de Tailwind, soit une troisième
         * teinte de gris à côté du canvas et de `slate`. Il rejoint la rampe
         * neutre : une seule échelle de gris dans le produit. */
        zinc: { DEFAULT: ECHELLE_ACTION[500], ...ECHELLE_ACTION },

        /* ─── Design system safe-interface (variante froide albâtre) ───
         * Namespace `si-*` ADDITIF : porté tel quel depuis le design fourni
         * (docs/propositions/safe-interface/tailwind.config.ts) sans toucher
         * aux tokens existants. Sert au socle + à la page de démonstration.
         * La bascule des écrans réels se fera ensuite, écran par écran. */
        /* Nom canonique depuis le 2026-08-24. Ce rôle s'appelait `si-forest`,
           et le nom mentait : il porte l'encre, pas un vert. Les 413
           occurrences ont migré, l'alias est retiré, le compte est à zéro. */
        "si-ink-strong": { DEFAULT: siColor("ink-strong"), soft: siColor("ink-strong-soft") },
        "si-canvas": siColor("canvas"),
        "si-surface": siColor("surface"),
        "si-surface2": siColor("surface2"),
        "si-body": siColor("body"),
        "si-subtle": siColor("subtle"),
        "si-ink": siColor("ink"),
        "si-muted": siColor("muted"),
        "si-verified": siColor("verified"),
        "si-verified-on-forest": siColor("verified-on-forest"),
        "si-verified-dot": siColor("verified-dot"),
        "si-amber": siColor("amber"),
        /* Variante foncée pour le TEXTE amber (WCAG AA, >=4.5:1). Vérifiée sur
         * les 3 fonds documentés du DS, y compris le pire cas : le tint
         * bg-si-amber/[0.13] composé sur si-canvas (#EFF2ED) -> ~4.72:1. Le
         * #B07A1C reste réservé au fond/à la pastille (contraste non requis). */
        "si-amber-ink": siColor("amber-ink"),
        /* Danger. `si-danger` pour les fonds et les filets, `si-danger-ink`
         * pour le texte : le premier ne tient pas le contraste AA sur canvas. */
        "si-danger": siColor("danger"),
        "si-danger-ink": siColor("danger-ink"),
        "si-line": siLine("--si-line-a"),
        "si-line2": siLine("--si-line2-a"),
      },

      fontFamily: {
        /* Duo de marque validé (CEO 2026-07-17) : Instrument Serif pour les titres
         * (jamais sous 20px, une seule graisse) + Geist pour tout le reste.
         * Pas d'autre famille ni d'alias secondaire. */
        sans: ['var(--font-geist-sans)', "system-ui", "-apple-system", "sans-serif"],
        mono: ['var(--font-geist-mono)', "ui-monospace", "SFMono-Regular", "Menlo", "Monaco", "Consolas", "monospace"],
        /* ── « font-serif » ne rend plus de serif ─────────────────────────
         * Demande CEO du 2026-08-25 : plus aucun titre en serif. La classe
         * habillait 197 endroits, presque tous des titres. On REPOINTE le
         * jeton plutot que d'editer 197 lignes : un seul endroit a lire, un
         * seul a defaire, et aucun risque d'oublier une occurrence.
         *
         * Le nom « serif » ment maintenant. Il reste parce que le renommer
         * demanderait exactement les 197 editions qu'on evite ici, et parce
         * qu'un renommage de classe Tailwind n'est PAS verifie par le
         * compilateur : une occurrence manquee rendrait un titre sans fonte,
         * en silence. Le renommage se fera, mais comme un chantier a lui.
         *
         * « font-instrument » reste la vraie serif : c'est le chemin nomme
         * pour ce qui doit encore l'etre, la voix citee et le document. */
        serif: ['var(--font-geist-sans)', "system-ui", "-apple-system", "sans-serif"],
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
