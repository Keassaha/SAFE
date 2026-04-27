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

/* ── Teintes des deux galets selon le fond ───────────────────────── */
function toneColors(tone: LogoTone): { upper: string; lower: string } {
  switch (tone) {
    case "dark":       return { upper: "#8FB49F", lower: "#2B4A3E" };   // sur fond sombre
    case "onBrand":    return { upper: "#8FB49F", lower: "#2B4A3E" };   // sur vert SAFE / noir
    case "mono-dark":  return { upper: "#3F3F46", lower: "#111111" };   // mono encre
    case "mono-light": return { upper: "#D4E8D9", lower: "#FFFFFF" };   // mono blanc
    case "light":
    default:           return { upper: "#5A8F7B", lower: "#1F3A2E" };   // sur fond clair
  }
}

/* ── Mark seul — « Les Galets » ──────────────────────────────────────
 * Deux triangles arrondis (galets polis) empilés en diagonale,
 * dans deux teintes de vert. Adapté de la proposition B de la D.A.
 * ──────────────────────────────────────────────────────────────────── */
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
  const { upper, lower } = toneColors(tone);

  // Chemins : triangle pointé vers le bas, coins adoucis par strokeLinejoin="round".
  // Upper (galet supérieur, plus petit) ; Lower (galet inférieur, plus gros, décalé).
  const upperPath = "M 13 9 L 23 9 L 18 20 Z";
  const lowerPath = "M 19 20 L 33 20 L 26 33 Z";

  const UpperTri = (
    <path
      d={upperPath}
      fill={upper}
      stroke={upper}
      strokeWidth="2.6"
      strokeLinejoin="round"
      strokeLinecap="round"
    />
  );
  const LowerTri = (
    <path
      d={lowerPath}
      fill={lower}
      stroke={lower}
      strokeWidth="3.2"
      strokeLinejoin="round"
      strokeLinecap="round"
    />
  );

  if (!animate) {
    return (
      <svg
        viewBox="0 0 40 40"
        width={size}
        height={size}
        xmlns="http://www.w3.org/2000/svg"
        role={title ? "img" : "presentation"}
        aria-hidden={title ? undefined : true}
        aria-label={title}
        style={{ display: "block" }}
      >
        {title && <title>{title}</title>}
        {LowerTri}
        {UpperTri}
      </svg>
    );
  }

  return (
    <motion.svg
      viewBox="0 0 40 40"
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
        d={lowerPath}
        fill={lower}
        stroke={lower}
        strokeWidth="3.2"
        strokeLinejoin="round"
        strokeLinecap="round"
        variants={{
          hidden: { opacity: 0, y: 4, scale: 0.92 },
          visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] } },
        }}
        style={{ originX: 0.5, originY: 0.5 }}
      />
      <motion.path
        d={upperPath}
        fill={upper}
        stroke={upper}
        strokeWidth="2.6"
        strokeLinejoin="round"
        strokeLinecap="round"
        variants={{
          hidden: { opacity: 0, y: -4, scale: 0.92 },
          visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] } },
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
          Safe
        </span>
      )}
    </motion.span>
  );
}
