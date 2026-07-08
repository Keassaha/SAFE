"use client";

import { motion } from "framer-motion";

/**
 * SAFE — Nouveau logo « Le Chevron »
 * Deux chevrons superposés, teintes de vert (base humaine + couche d'automatisation).
 * SVG inline (net sur tout écran, adaptable aux variantes de fond).
 */

type LogoTone = "light" | "dark" | "onBrand" | "mono-dark" | "mono-light";

interface SafeLogoProps {
  className?: string;
  alt?: string;
  /** Sur fond clair (défaut) → chevrons foncés ; sur fond sombre → chevrons clairs. */
  variant?: "light" | "dark";
  /** Désactive la pulsation douce (préservation batterie / reduced-motion). */
  noPulse?: boolean;
  /**
   * Bandeau gris type maquette (coins arrondis) + pastille sombre + mot « Safe » en blanc.
   * Utile pour la nav / le footer quand on veut le logo « chip ».
   */
  brandBar?: boolean;
  /** Taille du mark en px (défaut 36). */
  size?: number;
  /** Forcer un ton custom (utile pour pages vertes sombres). */
  tone?: LogoTone;
  /** Afficher uniquement la marque (sans le mot « Safe »). */
  markOnly?: boolean;
  /** @deprecated — conservé pour compat. */
  priority?: boolean;
}

/* ── Teinte de base du mark selon le fond ─────────────────────────────
 * Un seul vert : galet supérieur plein, galet inférieur à 55% d'opacité
 * (structure du logo de référence, couleur adaptée au vert SAFE). */
function toneColors(tone: LogoTone): { base: string } {
  switch (tone) {
    case "dark":
    case "onBrand":    return { base: "#8FB49F" };   // vert clair, sur fond sombre
    case "mono-dark":  return { base: "#1C1C1C" };    // mono encre
    case "mono-light": return { base: "#FFFFFF" };    // mono blanc
    case "light":
    default:           return { base: "#1F3A2E" };    // vert forêt, sur fond clair
  }
}

/* ── Mark seul — « Les Galets » ──────────────────────────────────────
 * Deux galets arrondis (Bézier) CONVERGENTS : le galet supérieur pointe
 * vers le bas (plein), le galet inférieur pointe vers le haut (même vert,
 * 55% d'opacité). Géométrie de référence CEO (safe-logo-fonce.svg),
 * couleur adaptée au vert SAFE.
 * ──────────────────────────────────────────────────────────────────── */
const UPPER_PATH =
  "M 4.5,5.5 Q 3.5,3.5 5.5,4 L 12.5,4 Q 14.5,3.5 13.5,5.5 L 10,12.5 Q 9,14.5 8,12.5 Z";
const LOWER_PATH =
  "M 19.5,18.5 Q 20.5,20.5 18.5,20 L 11.5,20 Q 9.5,20.5 10.5,18.5 L 14,11.5 Q 15,9.5 16,11.5 Z";
const LOWER_OPACITY = 0.55;

export function ChevronMark({
  size = 36,
  tone = "light",
  title,
  animate = true,
}: {
  size?: number;
  tone?: LogoTone;
  title?: string;
  animate?: boolean;
}) {
  const { base } = toneColors(tone);

  if (!animate) {
    return (
      <svg
        viewBox="0 0 24 24"
        width={size}
        height={size}
        xmlns="http://www.w3.org/2000/svg"
        role={title ? "img" : "presentation"}
        aria-hidden={title ? undefined : true}
        aria-label={title}
        style={{ display: "block" }}
      >
        {title && <title>{title}</title>}
        <path d={UPPER_PATH} fill={base} />
        <path d={LOWER_PATH} fill={base} fillOpacity={LOWER_OPACITY} />
      </svg>
    );
  }

  return (
    <motion.svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      xmlns="http://www.w3.org/2000/svg"
      role={title ? "img" : "presentation"}
      aria-hidden={title ? undefined : true}
      aria-label={title}
      style={{ display: "block" }}
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
      }}
    >
      {title && <title>{title}</title>}
      <motion.path
        d={UPPER_PATH}
        fill={base}
        variants={{
          hidden: { opacity: 0, y: -2, scale: 0.92 },
          visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] } },
        }}
        style={{ originX: 0.5, originY: 0.5 }}
      />
      <motion.path
        d={LOWER_PATH}
        fill={base}
        fillOpacity={LOWER_OPACITY}
        variants={{
          hidden: { opacity: 0, y: 2, scale: 0.92 },
          visible: { opacity: LOWER_OPACITY, y: 0, scale: 1, transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] } },
        }}
        style={{ originX: 0.5, originY: 0.5 }}
      />
    </motion.svg>
  );
}

export function SafeLogo({
  className = "",
  alt = "Logo SAFE",
  variant = "light",
  noPulse = false,
  brandBar = false,
  size = 36,
  tone,
  markOnly = false,
}: SafeLogoProps) {
  const resolvedTone: LogoTone = tone || (brandBar ? "mono-light" : variant);
  const isDark = variant === "dark" || brandBar;

  /* Shell (pastille qui entoure la mark) */
  const markBg = brandBar
    ? "bg-[#0E2419] ring-1 ring-white/10"
    : isDark
      ? "bg-[#0E2419] ring-1 ring-white/10"
      : "bg-[#EEF5F0] ring-1 ring-[#1F3A2E]/12";

  /* Wordmark */
  const wordColor = brandBar
    ? "text-white"
    : isDark
      ? "text-[#E8F0EA]"
      : "text-[#111111]";

  const shellClass = brandBar
    ? "gap-2.5 rounded-l-[1.125rem] rounded-r-lg bg-[#2E343C] px-2.5 py-1.5 shadow-[0_2px_14px_rgba(0,0,0,0.22)] ring-1 ring-white/[0.07]"
    : "gap-2.5";

  return (
    <motion.span
      role="img"
      aria-label={alt}
      className={`inline-flex items-center ${shellClass} ${className}`.trim()}
      {...(!noPulse && {
        animate: { opacity: [1, 0.92, 1] },
        transition: { duration: 2.8, repeat: Infinity, ease: "easeInOut" },
      })}
    >
      <span
        className={`relative flex shrink-0 items-center justify-center rounded-[10px] ${markBg}`}
        style={{ width: size + 8, height: size + 8 }}
      >
        <ChevronMark size={size - 4} tone={resolvedTone} />
      </span>

      {!markOnly && (
        <span
          className={`select-none font-serif text-[22px] leading-none tracking-[0.01em] ${wordColor}`}
          style={{ fontFamily: "var(--font-instrument-serif), Georgia, serif" }}
        >
          SAFE
        </span>
      )}
    </motion.span>
  );
}
